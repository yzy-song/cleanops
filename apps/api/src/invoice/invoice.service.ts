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
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake/js/base').default;

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
    private emailService: EmailService,
    private xeroService: XeroService,
    private configService: ConfigService,
    private companyService: CompanyService,
  ) {}

  async create(companyId: string, dto: CreateInvoiceDto) {
    const company = await this.prisma.client.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const lastInvoice = await this.prisma.client.invoice.findFirst({
      where: { companyId },
      orderBy: { invoiceNumber: 'desc' },
    });
    const nextNumber = (lastInvoice?.invoiceNumber ?? 0) + 1;

    const created = await this.prisma.client.invoice.create({
      data: {
        invoiceNumber: nextNumber,
        amount: dto.amount,
        vatAmount: dto.vatAmount,
        status: 'UNPAID',
        company: { connect: { id: companyId } },
        job: dto.jobId ? { connect: { id: dto.jobId } } : undefined,
      } as any,
    });

    // Auto-sync to Xero
    this.autoSyncToXero(created.id, companyId);

    return created;
  }

  generateFromJob = this.generateFromJobMethod.bind(this);
  private async generateFromJobMethod(companyId: string, jobId: string) {
    const job = await this.prisma.client.job.findFirst({
      where: { id: jobId, companyId },
      include: { customer: true },
    });
    if (!job) throw new NotFoundException('Job not found');

    const existing = await this.prisma.client.invoice.findFirst({
      where: { jobId },
    });
    if (existing) throw new BadRequestException('Invoice already exists for this job');

    const isCommercial = job.customer.isCommercial;
    const vatRate = isCommercial ? 0.23 : 0.135;

    const company = await this.prisma.client.company.findUnique({ where: { id: companyId } });
    const hourlyRate = company?.baseHourlyRate ?? 1480;
    const durationHours = (job.estimatedDuration ?? 60) / 60;
    const subtotal = Math.round(hourlyRate * durationHours);
    const vatAmount = Math.round(subtotal * vatRate);
    const amount = subtotal + vatAmount;

    const lastInvoice = await this.prisma.client.invoice.findFirst({
      where: { companyId },
      orderBy: { invoiceNumber: 'desc' },
    });
    const nextNumber = (lastInvoice?.invoiceNumber ?? 0) + 1;

    return this.prisma.client.invoice.create({
      data: {
        invoiceNumber: nextNumber,
        amount,
        vatAmount,
        status: 'UNPAID',
        companyId,
        jobId,
      },
    }).then(async (invoice) => {
      // Auto-sync to Xero in background
      this.autoSyncToXero(invoice.id, companyId);
      return invoice;
    });
  }

  private async autoSyncToXero(invoiceId: string, companyId: string): Promise<void> {
    try {
      const hasXero = await this.prisma.client.company.findUnique({
        where: { id: companyId },
        select: { xeroTenantId: true },
      });
      if (!hasXero?.xeroTenantId) return;
      await this.syncToXero(invoiceId, companyId);
    } catch (err) {
      this.logger.warn(`Auto-sync to Xero failed for invoice ${invoiceId.substring(0, 8)}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async autoUpdateXeroStatus(invoiceId: string, companyId: string, newStatus: 'PAID' | 'VOIDED'): Promise<void> {
    try {
      const invoice = await this.prisma.client.invoice.findFirst({
        where: { id: invoiceId, companyId },
        select: { xeroInvoiceId: true },
      });
      if (!invoice?.xeroInvoiceId) return;

      const xero = await this.xeroService.getClient(companyId);
      if (!xero) return;

      const company = await this.prisma.client.company.findUnique({
        where: { id: companyId },
        select: { xeroTenantId: true },
      });
      if (!company?.xeroTenantId) return;

      await xero.accountingApi.updateInvoice(
        company.xeroTenantId,
        invoice.xeroInvoiceId,
        { invoices: [{ status: newStatus as any }] },
      );
      this.logger.log(`Xero invoice ${invoice.xeroInvoiceId} updated to ${newStatus}`);
    } catch (err) {
      this.logger.warn(`Auto-update Xero status failed for invoice ${invoiceId.substring(0, 8)}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async findAll(companyId: string, query: QueryInvoiceDto) {
    const where: any = { companyId };
    if (query.status) where.status = query.status;
    if ((query as any).customerId) where.job = { customerId: (query as any).customerId };

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
    return this.prisma.client.invoice.update({ where: { id }, data: dto as any });
  }

  async generatePaymentLink(id: string, companyId: string) {
    const invoice = await this.findOne(id, companyId);
    if (invoice.status === 'PAID') throw new BadRequestException('Invoice already paid');
    if (invoice.paymentLink) return { url: invoice.paymentLink };

    const url = await this.stripeService.createPaymentLink(
      companyId,
      invoice.amount,
      `Invoice ${invoice.invoiceNumber ?? invoice.id.slice(0, 8)} — ${invoice.job.customer.name}`,
      { invoiceId: invoice.id, companyId },
    );

    if (!url) throw new BadRequestException('Stripe is not configured for this company. Please add your Stripe secret key in Settings.');

    await this.prisma.client.invoice.update({
      where: { id },
      data: { paymentLink: url },
    });

    return { url };
  }

  async markAsPaid(id: string, companyId: string, paymentMethod?: string) {
    const invoice = await this.findOne(id, companyId);
    if (invoice.status === 'PAID') throw new BadRequestException('Already paid');
    const updated = await this.prisma.client.invoice.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date(), paymentMethod: paymentMethod || null },
    });
    // Auto-update Xero status
    this.autoUpdateXeroStatus(id, companyId, 'PAID');
    return updated;
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) { this.logger.warn('STRIPE_WEBHOOK_SECRET not configured'); return { received: true }; }
    try {
      const event = this.stripeService.constructWebhookEvent(rawBody, signature, secret);
      await this.processPaymentWebhook(event);
    } catch (err: any) {
      this.logger.error(`Payment webhook error: ${err.message}`);
      throw new BadRequestException('Invalid signature');
    }
    return { received: true };
  }

  async handleConnectWebhook(rawBody: Buffer, signature: string) {
    // Stripe Connect webhook — no longer used, kept for backward compatibility
    this.logger.warn('Connect webhook received but Connect is deprecated');
    return { received: true };
  }

  private async processPaymentWebhook(event: any): Promise<void> {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const invoiceId = session.metadata?.invoiceId;
      if (invoiceId && session.payment_status === 'paid') {
        const invoice = await this.prisma.client.invoice.findUnique({ where: { id: invoiceId } });
        if (invoice && invoice.status !== 'PAID') {
          await this.markAsPaid(invoiceId, invoice.companyId, 'STRIPE');
        }
      }
    }
  }

  async voidInvoice(id: string, companyId: string) {
    const invoice = await this.findOne(id, companyId);
    if (invoice.status === 'PAID') throw new BadRequestException('Cannot void a paid invoice');
    const updated = await this.prisma.client.invoice.update({
      where: { id },
      data: { status: 'VOID' },
    });
    // Auto-update Xero status
    this.autoUpdateXeroStatus(id, companyId, 'VOIDED');
    return updated;
  }

  async sendReminder(id: string, companyId: string) {
    const invoice = await this.findOne(id, companyId);
    if (invoice.status !== 'UNPAID') throw new BadRequestException('Can only remind for unpaid invoices');

    const customer = invoice.job.customer;
    if (customer.email) {
      await this.emailService.sendInvoiceReminderEmail(invoice, customer);
    }

    await this.prisma.client.invoice.update({
      where: { id },
      data: { reminderSentAt: new Date(), reminderCount: { increment: 1 } },
    });

    return { message: 'Reminder sent' };
  }

  async syncToXero(id: string, companyId: string) {
    const invoice = await this.findOne(id, companyId);
    if (invoice.xeroInvoiceId) throw new BadRequestException('Already synced to Xero');

    const xero = await this.xeroService.getClient(companyId);
    if (!xero) throw new BadRequestException('Xero not connected');

    const company = await this.prisma.client.company.findUnique({
      where: { id: companyId },
      select: { xeroTenantId: true },
    });
    if (!company?.xeroTenantId) throw new BadRequestException('Xero tenant not found');

    const customer = invoice.job.customer;
    const workerNames = invoice.job.assignments
      ?.map((a: any) => `${a.worker.firstName} ${a.worker.lastName}`)
      .join(', ') || '';

    const contactId = await this.findOrCreateXeroContact(xero, company.xeroTenantId, customer);

    const lineItem = {
      description: `Cleaning service — ${customer.name} (${workerNames})`,
      quantity: 1,
      unitAmount: invoice.amount - invoice.vatAmount,
      accountCode: '200',
    };

    const xeroInvoice = await xero.accountingApi.createInvoices(
      company.xeroTenantId,
      {
        invoices: [{
          type: 'ACCREC' as any,
          contact: { contactID: contactId },
          lineItems: [lineItem],
          date: format(invoice.createdAt, 'yyyy-MM-dd'),
          dueDate: format(new Date(invoice.createdAt.getTime() + 30 * 86400000), 'yyyy-MM-dd'),
          reference: invoice.invoiceNumber?.toString() ?? invoice.id.slice(0, 8),
          status: 'AUTHORISED' as any,
        }],
      },
    );

    const xeroId = xeroInvoice.body.invoices?.[0]?.invoiceID;
    if (xeroId) {
      await this.prisma.client.invoice.update({
        where: { id },
        data: { xeroInvoiceId: xeroId, xeroSyncedAt: new Date() },
      });
    }

    return { xeroInvoiceId: xeroId };
  }

  private async findOrCreateXeroContact(xero: any, tenantId: string, customer: any): Promise<string> {
    const existing = await xero.accountingApi.getContacts(tenantId, undefined, `Name=="${customer.name}"`);
    if (existing.body.contacts?.length > 0) return existing.body.contacts[0].contactID;

    const created = await xero.accountingApi.createContacts(tenantId, {
      contacts: [{
        name: customer.name,
        emailAddress: customer.email,
        phones: customer.phone ? [{ phoneNumber: customer.phone }] : undefined,
        addresses: [{ addressLine1: customer.address, city: customer.postalCode }],
      }],
    });
    return created.body.contacts?.[0]?.contactID ?? '';
  }

  async generatePdf(id: string, companyId: string): Promise<Buffer> {
    const invoice = await this.findOne(id, companyId);
    const job = invoice.job;
    const customer = job.customer;
    const company = invoice.company;
    const subtotal = invoice.amount - invoice.vatAmount;
    const vatRate = customer.isCommercial ? 23 : 13.5;
    const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

    const workerNames = job.assignments
      ?.map((a) => `${a.worker?.firstName} ${a.worker?.lastName}`)
      .join(', ') || '—';

    const dueDate = new Date(invoice.createdAt);
    dueDate.setDate(dueDate.getDate() + 30);

    const divider = {
      canvas: [{ type: 'line' as const, x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }],
      marginBottom: 8,
    };

    const serviceLabel = job.description || job.title || 'Cleaning service';

    const content: any[] = [
      // HEADER
      {
        columns: [
          { text: company?.name || 'CleanOps', style: 'companyName', width: '*' },
          { text: company?.vatNumber ? 'VAT INVOICE' : 'INVOICE', style: 'invoiceTitle', alignment: 'right' as const, width: 'auto' },
        ],
        marginBottom: 4,
      },
      company?.address ? { text: company.address, style: 'small' } : null,
      company?.phone ? { text: `Tel: ${company.phone}`, style: 'small' } : null,
      company?.email ? { text: company.email, style: 'small' } : null,
      company?.vatNumber ? { text: `VAT Reg No: ${company.vatNumber}`, style: 'smallBold', marginTop: 2 } : null,
      divider,

      // INVOICE META
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Bill To:', style: 'label' },
              { text: customer.name, style: 'body' },
              { text: customer.address, style: 'body' },
              customer.postalCode ? { text: customer.postalCode, style: 'body' } : null,
              customer.email ? { text: customer.email, style: 'small' } : null,
            ].filter(Boolean),
          },
          {
            width: 'auto',
            stack: [
              { text: invoice.invoiceNumber ? `INV-${invoice.createdAt.getFullYear()}-${String(invoice.invoiceNumber).padStart(4, '0')}` : id.slice(0, 8), style: 'invoiceNumber' },
              { text: `Issued: ${format(new Date(invoice.createdAt), 'dd MMM yyyy')}`, style: 'small', alignment: 'right' as const },
              { text: `Due: ${format(dueDate, 'dd MMM yyyy')}`, style: 'small', alignment: 'right' as const },
              invoice.status === 'PAID' ? { text: `Paid: ${format(new Date(invoice.paidAt!), 'dd MMM yyyy')}`, style: 'paidBadge', alignment: 'right' as const } : null,
            ].filter(Boolean),
          },
        ],
        marginBottom: 8,
      },
      divider,

      // SERVICE DETAILS
      { text: 'Service Details', style: 'sectionHeader', marginBottom: 6 },
      {
        table: {
          headerRows: 1,
          widths: ['*', 60, 80],
          body: [
            [
              { text: 'Description', style: 'tableHeader' },
              { text: 'Qty', style: 'tableHeader', alignment: 'center' as const },
              { text: 'Amount', style: 'tableHeader', alignment: 'right' as const },
            ],
            [
              {
                stack: [
                  { text: `${serviceLabel} — ${customer.name}`, bold: true },
                  { text: `Scheduled: ${format(new Date(job.scheduledStart), 'dd MMM yyyy \'at\' HH:mm')}`, style: 'small' },
                  { text: `Duration: ${job.estimatedDuration || '—'} min`, style: 'small' },
                  { text: `Worker(s): ${workerNames}`, style: 'small' },
                  customer.address ? { text: `Location: ${customer.address}`, style: 'small' } : null,
                  job.notes ? { text: `Notes: ${job.notes}`, style: 'small', italics: true } : null,
                ].filter(Boolean),
              },
              { text: '1', alignment: 'center' as const },
              { text: eur(subtotal), alignment: 'right' as const },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 0,
          hLineColor: () => '#e5e7eb',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        marginBottom: 8,
      },

      // TOTALS
      {
        table: {
          widths: ['*', 120],
          body: [
            [{ text: 'Subtotal', alignment: 'right' as const, style: 'body' }, { text: eur(subtotal), alignment: 'right' as const, style: 'body' }],
            [{ text: `VAT (${vatRate}%)`, alignment: 'right' as const, style: 'body' }, { text: eur(invoice.vatAmount), alignment: 'right' as const, style: 'body' }],
            [{ text: 'TOTAL DUE', alignment: 'right' as const, style: 'totalLabel' }, { text: eur(invoice.amount), alignment: 'right' as const, style: 'totalAmount' }],
          ],
        },
        layout: 'noBorders',
        marginBottom: 16,
      },

      // PAYMENT INFO
      divider,
      { text: 'Payment Information', style: 'sectionHeader', marginBottom: 4 },
      { text: 'Payment is due within 30 days of the invoice date.', style: 'small' },
      { text: 'Please include the invoice number with your payment.', style: 'small' },
      invoice.paymentLink ? { text: `Pay online: ${invoice.paymentLink}`, style: 'link', marginTop: 4 } : null,
      company?.iban ? { text: `IBAN: ${company.iban}`, style: 'small', marginTop: 4 } : null,
      company?.bic ? { text: `BIC: ${company.bic}`, style: 'small' } : null,

      // STATUS
      { text: '\n' },
      invoice.status === 'PAID'
        ? { text: `✓ PAID on ${format(new Date(invoice.paidAt!), 'dd MMM yyyy')}`, style: 'paidStamp', alignment: 'center' as const }
        : invoice.status === 'VOID'
          ? { text: 'VOID', style: 'voidStamp', alignment: 'center' as const }
          : null,

      // FOOTER
      { text: '\n\n', fontSize: 4 },
      { text: company?.name || 'CleanOps', style: 'footer', alignment: 'center' as const },
      company?.vatNumber ? { text: `VAT Reg No: ${company.vatNumber}`, style: 'footer', alignment: 'center' as const } : null,
      { text: 'This invoice is subject to Irish VAT regulations. Late payment may incur interest under EU Directive 2011/7/EU.', style: 'footer', alignment: 'center' as const, fontSize: 7 },
    ].filter(Boolean);

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content,
      styles: {
        companyName: { fontSize: 16, bold: true, color: '#111827' },
        invoiceTitle: { fontSize: 20, bold: true, color: '#4f46e5' },
        invoiceNumber: { fontSize: 12, bold: true, color: '#111827' },
        label: { fontSize: 9, bold: true, color: '#6b7280', marginBottom: 2 },
        body: { fontSize: 10, color: '#111827' },
        small: { fontSize: 8, color: '#6b7280' },
        smallBold: { fontSize: 8, bold: true, color: '#374151' },
        sectionHeader: { fontSize: 11, bold: true, color: '#4f46e5', marginTop: 4, marginBottom: 4 },
        tableHeader: { fontSize: 8, bold: true, color: '#6b7280' },
        totalLabel: { fontSize: 12, bold: true, color: '#111827' },
        totalAmount: { fontSize: 14, bold: true, color: '#4f46e5' },
        paidStamp: { fontSize: 16, bold: true, color: '#10b981' },
        paidBadge: { fontSize: 8, bold: true, color: '#10b981' },
        voidStamp: { fontSize: 16, bold: true, color: '#ef4444' },
        link: { fontSize: 8, color: '#4f46e5' },
        footer: { fontSize: 7, color: '#9ca3af' },
      },
      defaultStyle: { font: 'Roboto', fontSize: 10, color: '#111827' },
    };

    const printer = new PdfPrinter();
    printer.addFonts({
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    });

    const pdfDoc = await printer.createPdf(docDefinition);

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}