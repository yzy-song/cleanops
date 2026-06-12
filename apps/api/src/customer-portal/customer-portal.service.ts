import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { PricingService } from '../quote/pricing.service';
import { StripeService } from '../common/services/stripe.service';
import { InvoiceService } from '../invoice/invoice.service';
import { GeocodingService } from '../common/services/geocoding.service';
import { AiEstimateService } from '../common/services/ai-estimate.service';
import { ReviewService } from '../job/review.service';
import { randomBytes } from 'crypto';
import { ServiceType, PropertySize, ServiceFrequency } from '@cleanops/db';

@Injectable()
export class CustomerPortalService {
  private readonly logger = new Logger(CustomerPortalService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
    private pricingService: PricingService,
    private stripeService: StripeService,
    private invoiceService: InvoiceService,
    private geocodingService: GeocodingService,
    private aiEstimateService: AiEstimateService,
    private reviewService: ReviewService,
  ) {}

  async sendMagicLink(email: string) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { email },
    });

    // Don't reveal whether the email exists
    if (!customer) {
      return { message: 'If an account with that email exists, a magic link has been sent.' };
    }

    // Per-email rate limit: 1 per 5 minutes
    if (customer.authTokenExpiresAt) {
      const remainingMs = customer.authTokenExpiresAt.getTime() - Date.now();
      if (remainingMs > 23 * 60 * 60 * 1000 + 55 * 60 * 1000) {
        throw new BadRequestException('A magic link was already sent recently. Please wait before requesting another.');
      }
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await this.prisma.client.customer.update({
      where: { id: customer.id },
      data: { authToken: token, authTokenExpiresAt: expiresAt },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const link = `${frontendUrl}/portal/verify?token=${token}`;

    await this.emailService.sendEmail(
      email,
      'Your CleanOps Portal Access',
      `<p>Hello ${customer.name},</p>
       <p>Click the link below to access your account:</p>
       <p><a href="${link}">${link}</a></p>
       <p>This link expires in 24 hours.</p>`,
    );

    return { message: 'If an account with that email exists, a magic link has been sent.' };
  }

  async verifyToken(token: string) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { authToken: token },
    });
    if (!customer) throw new UnauthorizedException('Invalid token');
    if (customer.authTokenExpiresAt && customer.authTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    // Generate session token (7-day TTL) and consume the magic link token
    const sessionToken = randomBytes(32).toString('hex');
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.client.customer.update({
      where: { id: customer.id },
      data: {
        authToken: null,
        authTokenExpiresAt: null,
        sessionToken,
        sessionTokenExpiresAt: sessionExpiresAt,
      },
    });

    return {
      sessionToken,
      expiresAt: sessionExpiresAt,
      customerId: customer.id,
      name: customer.name,
      email: customer.email,
    };
  }

  async logout(customerId: string) {
    await this.prisma.client.customer.update({
      where: { id: customerId },
      data: { sessionToken: null, sessionTokenExpiresAt: null },
    });
    return { message: 'Logged out' };
  }

  async getProfile(customerId: string) {
    const customer = await this.prisma.client.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async updateProfile(customerId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    postalCode?: string;
    accessCode?: string;
  }) {
    const customer = await this.prisma.client.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.client.customer.update({
      where: { id: customerId },
      data,
    });
  }

  async getMyJobs(customerId: string) {
    return this.prisma.client.job.findMany({
      where: { customerId },
      include: { assignments: { include: { worker: true } }, invoice: true },
      orderBy: { scheduledStart: 'desc' },
      take: 50,
    });
  }

  async getMyJob(customerId: string, jobId: string) {
    const job = await this.prisma.client.job.findFirst({
      where: { id: jobId, customerId },
      include: {
        assignments: { include: { worker: true } },
        invoice: true,
        photos: { orderBy: { createdAt: 'desc' } },
        customer: true,
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async rescheduleJob(customerId: string, jobId: string, newDate: string) {
    const job = await this.prisma.client.job.findFirst({
      where: { id: jobId, customerId },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'PENDING') {
      throw new BadRequestException('Only pending jobs can be rescheduled');
    }
    const scheduledStart = new Date(newDate);
    if (isNaN(scheduledStart.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    if (scheduledStart <= new Date()) {
      throw new BadRequestException('New date must be in the future');
    }

    return this.prisma.client.job.update({
      where: { id: jobId },
      data: { scheduledStart },
      include: { assignments: { include: { worker: true } }, invoice: true },
    });
  }

  async cancelJob(customerId: string, jobId: string, reason?: string) {
    const job = await this.prisma.client.job.findFirst({
      where: { id: jobId, customerId },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'PENDING') {
      throw new BadRequestException('Only pending jobs can be cancelled');
    }

    const safeReason = reason?.trim().slice(0, 500) || '';
    return this.prisma.client.job.update({
      where: { id: jobId },
      data: {
        status: 'CANCELLED',
        internalNotes: safeReason ? `Customer cancelled: ${safeReason}` : 'Customer cancelled',
      },
      include: { assignments: { include: { worker: true } }, invoice: true },
    });
  }

  async getMyInvoices(customerId: string, status?: string, page = 1, limit = 20) {
    const where: any = { job: { customerId } };
    if (status) where.status = status;
    const [invoices, total] = await Promise.all([
      this.prisma.client.invoice.findMany({
        where,
        include: { job: true, company: { select: { stripeSecretKey: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.invoice.count({ where }),
    ]);
    return { data: invoices, total, page, limit };
  }

  async getInvoicePdf(customerId: string, invoiceId: string): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.prisma.client.invoice.findFirst({
      where: { id: invoiceId, job: { customerId } },
      include: { job: true, company: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const buffer = await this.invoiceService.generatePdf(invoiceId, invoice.companyId);
    const invNum = invoice.invoiceNumber
      ? `INV-${new Date(invoice.createdAt).getFullYear()}-${String(invoice.invoiceNumber).padStart(4, '0')}`
      : invoiceId.slice(0, 8);
    return { buffer, filename: `${invNum}.pdf` };
  }

  async payInvoice(customerId: string, invoiceId: string) {
    const invoice = await this.prisma.client.invoice.findFirst({
      where: { id: invoiceId, job: { customerId } },
      include: { job: true, company: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID') throw new BadRequestException('Invoice already paid');
    if (invoice.status === 'VOID') throw new BadRequestException('Invoice is voided');

    const paymentUrl = await this.stripeService.createPaymentLink(
      invoice.companyId,
      invoice.amount,
      `Invoice ${invoice.invoiceNumber || invoice.id.slice(0, 8)}`,
      { invoiceId: invoice.id, companyId: invoice.companyId, type: 'invoice' },
    );

    if (!paymentUrl) throw new BadRequestException('Payment not available — company has not configured Stripe');

    await this.prisma.client.invoice.update({
      where: { id: invoiceId },
      data: { paymentLink: paymentUrl },
    });

    return { paymentUrl };
  }

  async getMyInvoice(customerId: string, invoiceId: string) {
    const invoice = await this.prisma.client.invoice.findFirst({
      where: { id: invoiceId, job: { customerId } },
      include: {
        company: true,
        job: { include: { customer: true, assignments: { include: { worker: true } } } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async createBooking(data: {
    name: string;
    email: string;
    phone?: string;
    address: string;
    postalCode?: string;
    accessCode?: string;
    lat?: number;
    lng?: number;
    scheduledDate: string;
    notes?: string;
    isCommercial?: boolean;
    companyId?: string;
  }) {
    if (!data.companyId) {
      const firstCompany = await this.prisma.client.company.findFirst();
      if (!firstCompany) throw new BadRequestException('No company configured');
      data.companyId = firstCompany.id;
    }

    let customer = await this.prisma.client.customer.findFirst({
      where: { email: data.email, companyId: data.companyId },
    });

    if (!customer) {
      customer = await this.prisma.client.customer.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          postalCode: data.postalCode,
          accessCode: data.accessCode,
          isCommercial: data.isCommercial ?? false,
          lat: data.lat ?? 53.3498,
          lng: data.lng ?? -6.2603,
          company: { connect: { id: data.companyId } },
        },
      });
    }

    const company = await this.prisma.client.company.findUnique({
      where: { id: data.companyId },
    });
    if (!company) throw new BadRequestException('Company not found');

    const job = await this.prisma.client.job.create({
      data: {
        scheduledStart: new Date(data.scheduledDate),
        notes: data.notes,
        status: 'PENDING',
        customer: { connect: { id: customer.id } },
        company: { connect: { id: data.companyId } },
      },
      include: { customer: true },
    });

    // Send booking confirmation email
    try {
      await this.emailService.sendJobConfirmationEmail(customer, job, company);
    } catch (err: any) {
      this.logger.error(`Failed to send booking confirmation: ${err.message}`);
    }

    return { customer, job };
  }

  // ==================== Quote Methods ====================

  async calculateQuotePrice(body: {
    serviceType: string;
    propertySize: string;
    bathrooms?: number;
    frequency: string;
    isCommercial: boolean;
    companyId?: string;
  }) {
    const companyId = body.companyId || (await this.resolveCompanyId());
    return this.pricingService.calculatePrice({
      serviceType: body.serviceType as ServiceType,
      propertySize: body.propertySize as PropertySize,
      bathrooms: body.bathrooms,
      frequency: body.frequency as ServiceFrequency,
      isCommercial: body.isCommercial,
      companyId,
    });
  }

  async createQuoteFromPortal(body: {
    serviceType: string;
    propertySize: string;
    bathrooms?: number;
    frequency: string;
    isCommercial: boolean;
    notes?: string;
    name: string;
    email: string;
    phone?: string;
    address: string;
    postalCode?: string;
    accessCode?: string;
    lat?: number;
    lng?: number;
    companyId?: string;
  }) {
    const companyId = body.companyId || (await this.resolveCompanyId());

    const pricing = await this.pricingService.calculatePrice({
      serviceType: body.serviceType as ServiceType,
      propertySize: body.propertySize as PropertySize,
      bathrooms: body.bathrooms,
      frequency: body.frequency as ServiceFrequency,
      isCommercial: body.isCommercial,
      companyId,
    });

    const publicToken = randomBytes(32).toString('hex');

    const createdQuote = await this.prisma.client.quote.create({
      data: {
        status: 'SENT',
        publicToken,
        serviceType: body.serviceType as ServiceType,
        propertySize: body.propertySize as PropertySize,
        bathrooms: body.bathrooms,
        frequency: body.frequency as ServiceFrequency,
        isCommercial: body.isCommercial,
        estimatedDuration: pricing.estimatedDuration,
        notes: body.notes,
        subtotal: pricing.subtotal,
        vatAmount: pricing.vatAmount,
        grandTotal: pricing.grandTotal,
        depositRequired: pricing.depositRequired,
        depositAmount: pricing.depositAmount,
        customerName: body.name,
        customerEmail: body.email,
        customerPhone: body.phone,
        customerAddress: body.address,
        customerPostalCode: body.postalCode,
        customerAccessCode: body.accessCode,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        sentAt: new Date(),
        companyId,
        lineItems: {
          create: pricing.lineItems.map((li, i) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            totalPrice: li.totalPrice,
            sortOrder: i,
          })),
        },
      },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    });

    // Send quote notification email
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
      const company = await this.prisma.client.company.findUnique({ where: { id: companyId } });
      if (company) {
        await this.emailService.sendQuoteEmail(
          { name: body.name, email: body.email },
          createdQuote,
          company.name,
          frontendUrl,
        );
      }
    } catch (err: any) {
      this.logger.error(`Failed to send quote email: ${err.message}`);
    }

    return createdQuote;
  }

  async viewQuoteByToken(token: string) {
    const quote = await this.prisma.client.quote.findUnique({
      where: { publicToken: token },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        company: { select: { name: true, vatNumber: true } },
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async acceptQuote(token: string) {
    const quote = await this.prisma.client.quote.findUnique({
      where: { publicToken: token },
      include: { company: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'SENT') throw new BadRequestException('Quote is no longer available');
    if (new Date(quote.validUntil) < new Date()) throw new BadRequestException('Quote has expired');

    // Find or create customer
    let customer = await this.prisma.client.customer.findFirst({
      where: { email: quote.customerEmail, companyId: quote.companyId },
    });
    if (!customer) {
      let lat = 53.3498;
      let lng = -6.2603;
      if (quote.customerPostalCode) {
        const coords = await this.geocodingService.geocode(quote.customerPostalCode);
        if (coords) { lat = coords.lat; lng = coords.lng; }
      }
      customer = await this.prisma.client.customer.create({
        data: {
          name: quote.customerName,
          email: quote.customerEmail,
          phone: quote.customerPhone,
          address: quote.customerAddress,
          postalCode: quote.customerPostalCode,
          accessCode: quote.customerAccessCode,
          isCommercial: quote.isCommercial,
          lat,
          lng,
          companyId: quote.companyId,
        },
      });
    }

    // Create job
    const job = await this.prisma.client.job.create({
      data: {
        status: 'PENDING',
        estimatedDuration: quote.estimatedDuration,
        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000),
        notes: quote.notes,
        depositAmount: quote.depositAmount,
        customerId: customer.id,
        companyId: quote.companyId,
      },
    });

    await this.prisma.client.quote.update({
      where: { id: quote.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        customerId: customer.id,
        jobId: job.id,
      },
    });

    // Generate deposit payment link if required
    let paymentUrl: string | null = null;
    if (quote.depositRequired && quote.depositAmount && quote.company.stripeSecretKey) {
      try {
        paymentUrl = await this.stripeService.createPaymentLink(
          quote.companyId,
          quote.depositAmount,
          `Deposit for ${quote.serviceType || 'Service'} — ${quote.customerName}`,
          { jobId: job.id, companyId: quote.companyId, type: 'deposit' },
        );
      } catch (err: any) {
        this.logger.error(`Failed to create deposit checkout session: ${err.message}`);
      }
    }

    return { quote: { ...quote, status: 'ACCEPTED' }, job, paymentUrl };
  }

  async declineQuote(token: string, reason?: string) {
    const quote = await this.prisma.client.quote.findUnique({
      where: { publicToken: token },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'SENT') throw new BadRequestException('Quote is no longer available');

    return this.prisma.client.quote.update({
      where: { id: quote.id },
      data: { status: 'DECLINED', declinedAt: new Date(), declinedReason: reason },
    });
  }

  async getMyQuotes(customerId: string) {
    const customer = await this.prisma.client.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer?.email) return [];

    return this.prisma.client.quote.findMany({
      where: {
        OR: [
          { customerId },
          { customerEmail: customer.email, companyId: customer.companyId },
        ],
      },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getReviewInfo(jobId: string) {
    const info = await this.reviewService.getReviewInfo(jobId);
    if (!info) throw new NotFoundException('Job not found');
    return info;
  }

  async submitReviewFeedback(jobId: string, feedback: string) {
    if (!feedback?.trim()) throw new BadRequestException('Feedback is required');
    await this.reviewService.submitFeedback(jobId, feedback);
    return { message: 'Thank you for your feedback. We will get back to you shortly.' };
  }

  async estimateFromPhotos(photos: string[]) {
    const estimate = await this.aiEstimateService.estimateFromPhotos(photos);
    if (!estimate) {
      throw new BadRequestException('AI estimate is not available. Please configure OPENAI_API_KEY.');
    }
    return estimate;
  }

  private async resolveCompanyId(): Promise<string> {
    const firstCompany = await this.prisma.client.company.findFirst();
    if (!firstCompany) throw new BadRequestException('No company configured');
    return firstCompany.id;
  }
}
