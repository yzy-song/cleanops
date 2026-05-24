import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { PricingService } from '../quote/pricing.service';
import { StripeService } from '../common/services/stripe.service';
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
  ) {}

  async sendMagicLink(email: string) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { email },
    });
    if (!customer) throw new NotFoundException('No customer found with this email');

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

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
       <p>This link expires in 30 minutes.</p>`,
    );

    return { message: 'Magic link sent to your email' };
  }

  async verifyToken(token: string) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { authToken: token },
    });
    if (!customer) throw new UnauthorizedException('Invalid token');
    if (customer.authTokenExpiresAt && customer.authTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Token expired');
    }
    return { token, customerId: customer.id, name: customer.name, email: customer.email };
  }

  async getProfile(customerId: string) {
    const customer = await this.prisma.client.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async getMyJobs(customerId: string) {
    return this.prisma.client.job.findMany({
      where: { customerId },
      include: { assignments: { include: { worker: true } }, invoice: true },
      orderBy: { scheduledStart: 'desc' },
      take: 50,
    });
  }

  async getMyInvoices(customerId: string) {
    return this.prisma.client.invoice.findMany({
      where: { job: { customerId } },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
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
    eircode?: string;
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
          eircode: data.eircode,
          accessCode: data.accessCode,
          isCommercial: data.isCommercial ?? false,
          lat: data.lat ?? 53.3498,
          lng: data.lng ?? -6.2603,
          company: { connect: { id: data.companyId } },
        },
      });
    }

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
    eircode?: string;
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

    return this.prisma.client.quote.create({
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
        customerEircode: body.eircode,
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
      customer = await this.prisma.client.customer.create({
        data: {
          name: quote.customerName,
          email: quote.customerEmail,
          phone: quote.customerPhone,
          address: quote.customerAddress,
          eircode: quote.customerEircode,
          accessCode: quote.customerAccessCode,
          isCommercial: quote.isCommercial,
          lat: 53.3498,
          lng: -6.2603,
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
    if (quote.depositRequired && quote.depositAmount && quote.company.stripeAccountId) {
      try {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
        paymentUrl = await this.stripeService.createConnectCheckoutSession({
          amount: quote.depositAmount,
          connectedAccountId: quote.company.stripeAccountId,
          description: `Deposit for ${quote.serviceType} — ${quote.customerName}`,
          metadata: { jobId: job.id, companyId: quote.companyId, type: 'deposit' },
          successUrl: `${frontendUrl}/portal/quote/${token}?paid=true`,
          cancelUrl: `${frontendUrl}/portal/quote/${token}`,
        });
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

  private async resolveCompanyId(): Promise<string> {
    const firstCompany = await this.prisma.client.company.findFirst();
    if (!firstCompany) throw new BadRequestException('No company configured');
    return firstCompany.id;
  }
}
