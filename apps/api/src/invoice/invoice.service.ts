import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from '../common/services/stripe.service';
import { XeroService } from '../common/services/xero.service';
import { EmailService } from '../email/email.service';
import { CompanyService } from '../company/company.service';
import { paginate } from '../common/utils/pagination.util';
import Stripe from 'stripe';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { format } from 'date-fns';
const PdfPrinter = require('pdfmake');

function formatInvoiceNumber(invoice: { invoiceNumber: number | null; createdAt: Date }): string {
  const num = invoice.invoiceNumber;
  if (!num) return `INV-${invoice.createdAt.getFullYear()}-DRAFT`;
  return `INV-${invoice.createdAt.getFullYear()}-${String(num).padStart(4, '0')}`;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private xeroService: XeroService,
    private configService: ConfigService,
    private emailService: EmailService,
    private companyService: CompanyService,
  ) {}

  private async getNextInvoiceNumber(companyId: string): Promise<number> {
    const result = await this.prisma.client.invoice.aggregate({
      where: { companyId, invoiceNumber: { not: null } },
      _max: { invoiceNumber: true },
    });
    return (result._max.invoiceNumber ?? 0) + 1;
  }

  async generateFromJob(companyId: string, jobId: string) {
    const job = await this.prisma.client.job.findFirst({
      where: { id: jobId, companyId },
      include: { customer: true, company: true, assignments: { include: { worker: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'COMPLETED') {
      throw new BadRequestException('Can only generate invoice for completed jobs');
    }

    let totalMinutes = 0;
    if (job.actualStart && job.actualEnd) {
      totalMinutes = Math.round((job.actualEnd.getTime() - job.actualStart.getTime()) / 60000);
    } else if (job.estimatedDuration) {
      totalMinutes = job.estimatedDuration;
    }

    const hours = totalMinutes / 60;
    const worker = job.assignments[0]?.worker;
    const hourlyRate = worker?.hourlyRate ?? job.company.baseHourlyRate;
    const subtotal = Math.round(hours * hourlyRate);

    const vatRate = job.customer.isCommercial ? 0.23 : 0.135;
    const vatAmount = Math.round(subtotal * vatRate);
    const amount = subtotal + vatAmount;

    const invoiceNumber = await this.getNextInvoiceNumber(companyId);

    return this.prisma.client.invoice.create({
      data: {
        invoiceNumber,
        amount,
        vatAmount,
        status: 'UNPAID',
        job: { connect: { id: jobId } },
        company: { connect: { id: companyId } },
      },
      include: { job: { include: { customer: true } } },
    });
  }

  async create(companyId: string, dto: CreateInvoiceDto) {
    const invoiceNumber = await this.getNextInvoiceNumber(companyId);

    return this.prisma.client.invoice.create({
      data: {
        invoiceNumber,
        amount: dto.amount,
        vatAmount: dto.vatAmount,
        status: 'UNPAID',
        job: { connect: { id: dto.jobId } },
        company: { connect: { id: companyId } },
      },
      include: { job: { include: { customer: true } } },
    });
  }

  async findAll(companyId: string, query: QueryInvoiceDto) {
    const where: any = { companyId };
    if (query.status) where.status = query.status;

    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.client.invoice.findMany({
        where,
        include: { job: { include: { customer: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.invoice.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string, companyId: string) {
    const invoice = await this.prisma.client.invoice.findFirst({
      where: { id, companyId },
      include: { company: true, job: { include: { customer: true, assignments: { include: { worker: true } } } } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async update(id: string, companyId: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(id, companyId);
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cannot update a paid invoice');
    }
    return this.prisma.client.invoice.update({
      where: { id },
      data: dto,
      include: { job: { include: { customer: true } } },
    });
  }

  async markAsPaid(id: string, companyId: string, paymentMethod?: string) {
    const invoice = await this.findOne(id, companyId);
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already paid');
    }
    return this.prisma.client.invoice.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date(), paymentMethod: paymentMethod ?? null },
    });
  }

  async voidInvoice(id: string, companyId: string) {
    return this.prisma.client.invoice.update({
      where: { id },
      data: { status: 'VOID' },
    });
  }

  async generatePaymentLink(id: string, companyId: string) {
    const invoice = await this.findOne(id, companyId);
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already paid');
    }

    // Check Stripe Connect is set up
    const company = await this.prisma.client.company.findUnique({
      where: { id: companyId },
      select: { stripeAccountId: true, stripeAccountStatus: true },
    });
    if (!company?.stripeAccountId) {
      throw new BadRequestException('Please connect your Stripe account in Settings first');
    }
    if (company.stripeAccountStatus === 'restricted') {
      throw new BadRequestException('Your Stripe account needs attention. Please check Settings.');
    }

    const customer = invoice.job.customer;
    const invoiceRef = formatInvoiceNumber(invoice);
    const description = `CleanOps — ${customer.name} (${invoiceRef})`;

    const url = await this.stripeService.createConnectCheckoutSession({
      amount: invoice.amount,
      connectedAccountId: company.stripeAccountId,
      description,
      metadata: { invoiceId: invoice.id, companyId, type: 'invoice' },
    });

    if (url) {
      await this.prisma.client.invoice.update({
        where: { id },
        data: { paymentLink: url },
      });
    }

    return { paymentLink: url, invoice };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not configured, skipping webhook');
      return { received: true };
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { invoiceId, jobId, type } = session.metadata || {};

      if (type === 'deposit' && jobId) {
        const job = await this.prisma.client.job.update({
          where: { id: jobId },
          data: { isDepositPaid: true },
          include: { customer: true },
        });
        this.logger.log(`Job ${jobId} deposit marked as PAID via Stripe webhook`);
        try {
          await this.emailService.sendDepositConfirmationEmail(job.customer, job);
        } catch (err: any) {
          this.logger.warn(`Failed to send deposit confirmation: ${err.message}`);
        }
      } else if (invoiceId) {
        await this.prisma.client.invoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID', paidAt: new Date(), paymentMethod: 'STRIPE' },
        });
        this.logger.log(`Invoice ${invoiceId} marked as PAID via Stripe webhook`);
      }
    }

    // Handle refunds — check if we need to void the connected invoice
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      // Refunds via Stripe Connect with reverse_transfer automatically return the app fee.
      // We just log it; the connected account balance is adjusted by Stripe.
      this.logger.log(`Charge ${charge.id} refunded — platform fee reversed if applicable`);
    }

    return { received: true };
  }

  /** Handle Stripe Connect account.updated webhook events. */
  async handleConnectWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_CONNECT_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.warn('STRIPE_CONNECT_WEBHOOK_SECRET not configured');
      return { received: true };
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error(`Connect webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid signature');
    }

    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;
      await this.companyService.updateConnectAccountStatus(account.id, account.charges_enabled);
    }

    return { received: true };
  }

  async generatePdf(id: string, companyId: string): Promise<Buffer> {
    const invoice = await this.findOne(id, companyId);
    const job = invoice.job;
    const customer = job.customer;
    const company = invoice.company;
    const subtotal = invoice.amount - invoice.vatAmount;
    const vatRate = customer.isCommercial ? '23%' : '13.5%';
    const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

    const workerNames = job.assignments
      ?.map((a) => `${a.worker?.firstName} ${a.worker?.lastName}`)
      .join(', ') || '—';

    const content: any[] = [
      { text: company?.name || 'CleanOps', style: 'header' },
      { text: formatInvoiceNumber(invoice), style: 'subheader' },
      { text: format(new Date(invoice.createdAt), 'PPP'), style: 'subheader' },
      { text: '\n' },
      { text: 'Bill To:', style: 'label' },
      { text: customer.name, style: 'body' },
      { text: customer.address, style: 'body' },
      { text: '\n' },
      { text: 'Service Details', style: 'label' },
      { text: `Date: ${format(new Date(job.scheduledStart), 'PPP \'at\' HH:mm')}`, style: 'body' },
      { text: `Worker: ${workerNames}`, style: 'body' },
      { text: '\n' },
      {
        style: 'table',
        table: {
          widths: ['*', 'auto'],
          body: [
            ['Subtotal', eur(subtotal)],
            [`VAT (${vatRate})`, eur(invoice.vatAmount)],
            [{ text: 'Total', bold: true }, { text: eur(invoice.amount), bold: true }],
          ],
        },
      },
      { text: '\n' },
    ];

    if (company?.vatNumber) {
      content.splice(1, 0, { text: `VAT: ${company.vatNumber}`, style: 'subheader' });
    }

    if (invoice.status === 'PAID') {
      content.push({ text: `Paid on ${format(new Date(invoice.paidAt!), 'PPP')}`, style: 'paidStamp' });
    } else {
      content.push({ text: invoice.status, style: 'statusStamp' });
    }

    if (invoice.paymentLink) {
      content.push({ text: '\nPay online: ' + invoice.paymentLink, style: 'link' });
    }

    const docDefinition: TDocumentDefinitions = {
      content,
      styles: {
        header: { fontSize: 18, bold: true, marginBottom: 4 },
        subheader: { fontSize: 10, color: '#666' },
        label: { fontSize: 11, bold: true, marginTop: 8, marginBottom: 4 },
        body: { fontSize: 11 },
        paidStamp: { fontSize: 14, bold: true, color: '#10b981', marginTop: 8 },
        statusStamp: { fontSize: 14, bold: true, color: '#f59e0b', marginTop: 8 },
        link: { fontSize: 9, color: '#3b82f6' },
      },
      defaultStyle: { font: 'Roboto' },
    };

    const printer = new PdfPrinter({
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    });

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  async syncToXero(id: string, companyId: string) {
    const invoice = await this.findOne(id, companyId);

    if (invoice.xeroInvoiceId) {
      throw new BadRequestException('Invoice already synced to Xero');
    }

    const xero = await this.xeroService.getClient(companyId);
    if (!xero) throw new BadRequestException('Xero is not connected');

    const company = await this.prisma.client.company.findUnique({
      where: { id: companyId },
      select: { xeroTenantId: true },
    });
    if (!company?.xeroTenantId) throw new BadRequestException('Xero tenant not found');

    const customer = invoice.job.customer;
    const workerNames = invoice.job.assignments
      ?.map((a: any) => `${a.worker.firstName} ${a.worker.lastName}`)
      .join(', ') || '';

    // 1. Find or create Xero contact
    const contactId = await this.findOrCreateXeroContact(xero, company.xeroTenantId, customer);

    // 2. Build invoice line item
    const cleanopsServiceDescription = workerNames
      ? `Cleaning service — ${workerNames}`
      : `Cleaning service — ${customer.address}`;

    const vatAmount = invoice.vatAmount / 100;
    const subtotal = (invoice.amount - invoice.vatAmount) / 100;

    const taxType = customer.isCommercial
      ? this.configService.get('XERO_TAX_TYPE_COMMERCIAL') || 'OUTPUT2'
      : this.configService.get('XERO_TAX_TYPE_RESIDENTIAL') || 'OUTPUT';

    const accountCode = this.configService.get('XERO_ACCOUNT_CODE') || '200';

    const xeroInvoice = {
      type: 'ACCREC' as const,
      contact: { contactID: contactId },
      lineItems: [
        {
          description: cleanopsServiceDescription,
          quantity: 1.0,
          unitAmount: subtotal,
          accountCode,
          taxType,
        },
      ],
      date: invoice.createdAt.toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      reference: formatInvoiceNumber(invoice),
      status: 'AUTHORISED' as const,
    };

    try {
      const response = await (xero as any).accountingApi.createInvoices(
        company.xeroTenantId,
        { invoices: [xeroInvoice] },
        true, // summarizeErrors
        4,    // unitdp
      );

      const createdInvoices = response?.body?.invoices || response?.body?.Invoices || [];
      const created = createdInvoices[0];

      if (created?.invoiceID) {
        await this.prisma.client.invoice.update({
          where: { id },
          data: { xeroInvoiceId: created.invoiceID, xeroSyncedAt: new Date() },
        });
      }

      return { success: true, xeroInvoiceId: created?.invoiceID || null };
    } catch (err: any) {
      const errorBody = err?.response?.body || err.message;
      this.logger.error(`Xero sync failed for invoice ${id}: ${JSON.stringify(errorBody)}`);
      throw new BadRequestException(
        `Failed to sync to Xero: ${err?.response?.body?.title || err.message}`,
      );
    }
  }

  private async findOrCreateXeroContact(
    xero: any,
    tenantId: string,
    customer: { name: string; email?: string | null; phone?: string | null; address: string },
  ): Promise<string> {
    // Search by name
    try {
      const searchResult = await xero.accountingApi.getContacts(
        tenantId,
        null, // ifModifiedSince
        `Name=="${customer.name.replace(/"/g, '\\"')}"`, // where
        null, // order
        null, // page
      );

      const existing = searchResult?.body?.contacts || [];
      if (existing.length > 0) {
        return existing[0].contactID;
      }
    } catch (err: any) {
      this.logger.warn(`Xero contact search failed: ${err.message}`);
    }

    // Create new contact
    const newContact = {
      name: customer.name,
      emailAddress: customer.email || '',
      phones: customer.phone
        ? [{ phoneType: 'MOBILE' as const, phoneNumber: customer.phone }]
        : [],
      isCustomer: true,
    };

    try {
      const createResult = await xero.accountingApi.createContacts(
        tenantId,
        { contacts: [newContact] },
        true,
      );
      const contacts = createResult?.body?.contacts || createResult?.body?.Contacts || [];
      if (contacts.length > 0) {
        return contacts[0].contactID;
      }
    } catch (err: any) {
      this.logger.warn(`Xero contact creation failed: ${err.message}`);
    }

    throw new BadRequestException('Failed to find or create Xero contact');
  }

  async sendReminder(id: string, companyId: string) {
    const invoice = await this.findOne(id, companyId);
    if (invoice.status !== 'UNPAID') {
      throw new BadRequestException('Can only send reminders for unpaid invoices');
    }

    const customer = invoice.job.customer;

    // Ensure a payment link exists
    let paymentLink = invoice.paymentLink;
    if (!paymentLink) {
      try {
        const result = await this.generatePaymentLink(id, companyId);
        paymentLink = result.paymentLink;
      } catch (err: any) {
        this.logger.warn(`Could not generate payment link for reminder: ${err.message}`);
      }
    }

    await this.emailService.sendInvoiceReminderEmail(invoice, customer, paymentLink);

    await this.prisma.client.invoice.update({
      where: { id },
      data: {
        reminderSentAt: new Date(),
        reminderCount: { increment: 1 },
      },
    });

    return { success: true };
  }
}
