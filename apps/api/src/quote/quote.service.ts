import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PricingService } from './pricing.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
import { paginate } from '../common/utils/pagination.util';
import crypto from 'crypto';

@Injectable()
export class QuoteService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
  ) {}

  async create(companyId: string, dto: CreateQuoteDto) {
    // Auto-calculate pricing unless manually overridden
    const isManual = dto.subtotal !== undefined && dto.lineItems;
    const pricing = isManual ? null : await this.pricingService.calculatePrice({
      serviceType: dto.serviceType,
      propertySize: dto.propertySize,
      bathrooms: dto.bathrooms,
      frequency: dto.frequency,
      isCommercial: dto.isCommercial,
      companyId,
    });

    const estimatedDuration = dto.estimatedDuration ?? pricing?.estimatedDuration ?? 120;
    const subtotal = dto.subtotal ?? pricing!.subtotal;
    const vatAmount = dto.vatAmount ?? pricing!.vatAmount;
    const lineItems = dto.lineItems ?? pricing!.lineItems;
    const depositRequired = isManual ? ((dto.depositAmount ?? 0) > 0) : pricing!.depositRequired;
    const depositAmount = dto.depositAmount ?? pricing?.depositAmount ?? null;

    let customerName: string;
    let customerEmail: string;
    let customerPhone: string | undefined;
    let customerAddress: string;
    let customerEircode: string | undefined;
    let customerAccessCode: string | undefined;
    let customerId: string | undefined;

    if (dto.customerId) {
      const cust = await this.prisma.client.customer.findFirst({
        where: { id: dto.customerId, companyId },
      });
      if (!cust) throw new NotFoundException('Customer not found');
      customerId = cust.id;
      customerName = cust.name;
      customerEmail = cust.email || '';
      customerPhone = cust.phone || undefined;
      customerAddress = cust.address;
      customerEircode = cust.postalCode || undefined;
      customerAccessCode = cust.accessCode || undefined;
    } else if (dto.customerName && dto.customerEmail && dto.customerAddress) {
      customerName = dto.customerName;
      customerEmail = dto.customerEmail;
      customerPhone = dto.customerPhone;
      customerAddress = dto.customerAddress;
      customerEircode = dto.customerPostalCode;
      customerAccessCode = dto.customerAccessCode;
    } else {
      throw new BadRequestException('Either customerId or customerName+email+address is required');
    }

    const grandTotal = subtotal + vatAmount;

    return this.prisma.client.quote.create({
      data: {
        serviceType: dto.serviceType,
        propertySize: dto.propertySize,
        bathrooms: dto.bathrooms,
        frequency: dto.frequency,
        isCommercial: dto.isCommercial,
        estimatedDuration,
        notes: dto.notes,
        subtotal,
        vatAmount,
        grandTotal,
        depositRequired,
        depositAmount,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        customerPostalCode: customerEircode,
        customerAccessCode,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        companyId,
        customerId,
        lineItems: {
          create: lineItems.map((li, i) => ({
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

  async findAll(companyId: string, query: QueryQuoteDto) {
    const where: any = { companyId };
    if (query.status) where.status = query.status;

    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.client.quote.findMany({
        where,
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, job: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.quote.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string, companyId: string) {
    const quote = await this.prisma.client.quote.findFirst({
      where: { id, companyId },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customer: true,
        job: { include: { assignments: { include: { worker: true } } } },
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async update(id: string, companyId: string, dto: UpdateQuoteDto) {
    const quote = await this.findOne(id, companyId);
    if (quote.status !== 'DRAFT') {
      throw new BadRequestException('Only draft quotes can be edited');
    }

    const data: any = { ...dto };
    delete data.lineItems;

    // Handle line items update
    if (dto.lineItems) {
      await this.prisma.client.quoteLineItem.deleteMany({ where: { quoteId: id } });
      await this.prisma.client.quoteLineItem.createMany({
        data: dto.lineItems.map((li, i) => ({
          quoteId: id,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          totalPrice: li.totalPrice,
          sortOrder: i,
        })),
      });
    }

    return this.prisma.client.quote.update({
      where: { id },
      data,
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async send(id: string, companyId: string) {
    const quote = await this.findOne(id, companyId);
    if (quote.status !== 'DRAFT') {
      throw new BadRequestException('Only draft quotes can be sent');
    }

    const publicToken = crypto.randomBytes(32).toString('hex');

    return this.prisma.client.quote.update({
      where: { id },
      data: { status: 'SENT', publicToken, sentAt: new Date() },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async convertToJob(id: string, companyId: string) {
    const quote = await this.findOne(id, companyId);
    if (quote.status !== 'ACCEPTED') {
      throw new BadRequestException('Only accepted quotes can be converted to jobs');
    }
    if (quote.jobId) {
      throw new BadRequestException('Quote already converted to a job');
    }

    // Find or create customer
    let customerId = quote.customerId;
    if (!customerId) {
      const existing = await this.prisma.client.customer.findFirst({
        where: { email: quote.customerEmail, companyId },
      });
      if (existing) {
        customerId = existing.id;
      } else {
        const created = await this.prisma.client.customer.create({
          data: {
            name: quote.customerName,
            email: quote.customerEmail,
            phone: quote.customerPhone,
            address: quote.customerAddress,
            postalCode: quote.customerPostalCode,
            accessCode: quote.customerAccessCode,
            lat: 53.3498,
            lng: -6.2603,
            isCommercial: quote.isCommercial,
            companyId,
          },
        });
        customerId = created.id;
      }
    }

    // Create job
    const job = await this.prisma.client.job.create({
      data: {
        status: 'PENDING',
        estimatedDuration: quote.estimatedDuration,
        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        customerId,
        companyId,
        notes: quote.notes,
      },
    });

    await this.prisma.client.quote.update({
      where: { id },
      data: { jobId: job.id },
    });

    return { quote: await this.findOne(id, companyId), job };
  }

  async markDeclined(id: string, companyId: string, reason?: string) {
    const quote = await this.findOne(id, companyId);
    if (quote.status !== 'SENT') {
      throw new BadRequestException('Only sent quotes can be declined');
    }

    return this.prisma.client.quote.update({
      where: { id },
      data: { status: 'DECLINED', declinedAt: new Date(), declinedReason: reason },
    });
  }
}
