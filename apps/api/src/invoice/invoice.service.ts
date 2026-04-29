import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from '../common/services/stripe.service';
import { paginate } from '../common/utils/pagination.util';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
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

    // 2026 Auto-enrolment pension: 1.5% of gross
    const pensionAmount = job.company.pensionEnrollment ? Math.round(subtotal * 0.015) : 0;

    const amount = subtotal + vatAmount;

    return this.prisma.client.invoice.create({
      data: {
        amount,
        vatAmount,
        pensionAmount,
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
        pensionAmount: dto.pensionAmount ?? 0,
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
      include: { job: { include: { customer: true, assignments: { include: { worker: true } } } } },
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

  async markAsPaid(id: string, companyId: string) {
    const invoice = await this.findOne(id, companyId);
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already paid');
    }
    return this.prisma.client.invoice.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
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
}
