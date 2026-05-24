import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GeocodingService } from 'src/common/services/geocoding.service';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    private geocodingService: GeocodingService,
  ) {}
  async create(dto: CreateCustomerDto) {
    let lat = dto.lat;
    let lng = dto.lng;
    if (dto.postalCode && (lat == null || lng == null)) {
      const geo = await this.geocodingService.geocode(dto.postalCode);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
      }
    }

    return this.prisma.client.customer.create({
      data: {
        name: dto.name,
        address: dto.address,
        postalCode: dto.postalCode,
        accessCode: dto.accessCode,
        lat,
        lng,
        isCommercial: dto.isCommercial ?? false,
        company: {
          connect: { id: dto.companyId },
        },
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.client.customer.findMany({
      where: { companyId },
      include: { jobs: { take: 5, orderBy: { createdAt: 'desc' } } }, // 顺便查出最近5个客户
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.client.customer.findUnique({
      where: { id },
      include: { jobs: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const data: any = { ...dto };
    if (dto.postalCode && (dto.lat == null || dto.lng == null)) {
      const geo = await this.geocodingService.geocode(dto.postalCode);
      if (geo) {
        data.lat = geo.lat;
        data.lng = geo.lng;
      }
    }
    return this.prisma.client.customer.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.client.customer.delete({ where: { id } });
  }

  async getCreditSummary(id: string) {
    const customer = await this.prisma.client.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    const unpaidInvoices = await this.prisma.client.invoice.findMany({
      where: {
        companyId: customer.companyId,
        job: { customerId: id },
        status: 'UNPAID',
      },
      include: { job: { select: { scheduledStart: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const overdueCount = unpaidInvoices.filter(
      (inv) => new Date(inv.createdAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).length;

    const riskLevel = totalUnpaid > 20000 ? 'HIGH' : totalUnpaid > 5000 ? 'MEDIUM' : 'LOW';

    return {
      customerId: id,
      totalUnpaid,
      unpaidCount: unpaidInvoices.length,
      overdueCount,
      riskLevel,
      invoices: unpaidInvoices.map((inv) => ({
        id: inv.id,
        amount: inv.amount,
        dueDate: inv.createdAt,
        jobDate: inv.job.scheduledStart,
      })),
    };
  }

  async findAllWithCreditRisk(companyId: string) {
    const customers = await this.prisma.client.customer.findMany({
      where: { companyId },
      include: {
        jobs: {
          include: {
            invoice: { select: { id: true, amount: true, status: true, createdAt: true } },
          },
        },
      },
    });

    return customers.map((c) => {
      const unpaidInvoices = c.jobs
        .flatMap((j) => (j.invoice ? [j.invoice] : []))
        .filter((inv) => inv.status === 'UNPAID');

      const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const riskLevel = totalUnpaid > 20000 ? 'HIGH' : totalUnpaid > 5000 ? 'MEDIUM' : 'LOW';

      return {
        id: c.id,
        name: c.name,
        address: c.address,
        postalCode: c.postalCode,
        isCommercial: c.isCommercial,
        totalUnpaid,
        unpaidCount: unpaidInvoices.length,
        riskLevel,
      };
    });
  }
}
