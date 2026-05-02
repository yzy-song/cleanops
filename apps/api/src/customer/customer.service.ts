import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateCustomerDto) {
    return this.prisma.client.customer.create({
      data: {
        name: dto.name,
        address: dto.address,
        eircode: dto.eircode,
        accessCode: dto.accessCode,
        lat: dto.lat,
        lng: dto.lng,
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
    return this.prisma.client.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.client.customer.delete({ where: { id } });
  }
}
