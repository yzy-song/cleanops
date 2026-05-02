import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from '../common/services/stripe.service';
import { paginate } from '../common/utils/pagination.util';
import Stripe from 'stripe';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { format } from 'date-fns';
const PdfPrinter = require('pdfmake');

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  async generateFromJob(companyId: string, jobId: string) {
    const job = await this.prisma.client.job.findFirst({
      where: { id: jobId, companyId },
      include: { customer: true, company: true, assignments: { include: { worker: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'COMPLETED') {
      throw new BadRequestException('Can only generate invoice for completed jobs');
    }

    // Calculate hours from actual clock-in/out times
    let totalMinutes = 0;
    if (job.actualStart && job.actualEnd) {
      totalMinutes = Math.round((job.actualEnd.getTime() - job.actualStart.getTime()) / 60000);
    } else if (job.estimatedDuration) {
      totalMinutes = job.estimatedDuration;
    }

    const hours = totalMinutes / 60;
    // Use the first assigned worker's rate, or company default
    const worker = job.assignments[0]?.worker;
    const hourlyRate = worker?.hourlyRate ?? job.company.baseHourlyRate;
    const subtotal = Math.round(hours * hourlyRate);

    // Irish VAT rates: 23% for commercial, 13.5% for residential
    const vatRate = job.customer.isCommercial ? 0.23 : 0.135;
    const vatAmount = Math.round(subtotal * vatRate);

    const amount = subtotal + vatAmount;

    return this.prisma.client.invoice.create({
      data: {
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
    return this.prisma.client.invoice.create({
      data: {
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

    const customer = invoice.job.customer;
    const description = `CleanOps - ${customer.name} (Invoice #${invoice.id.slice(0, 8)})`;

    const url = await this.stripeService.createPaymentLink(invoice.amount, description, {
      invoiceId: invoice.id,
      companyId,
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
        await this.prisma.client.job.update({
          where: { id: jobId },
          data: { isDepositPaid: true },
        });
        this.logger.log(`Job ${jobId} deposit marked as PAID via Stripe webhook`);
      } else if (invoiceId) {
        await this.prisma.client.invoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID', paidAt: new Date(), paymentMethod: 'STRIPE' },
        });
        this.logger.log(`Invoice ${invoiceId} marked as PAID via Stripe webhook`);
      }
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
      { text: `Invoice #${invoice.id.slice(0, 8)}`, style: 'subheader' },
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
}
