import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateServiceDto) {
    return this.prisma.client.service.create({
      data: { ...dto, companyId },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.client.service.findMany({
      where: { companyId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string, companyId: string) {
    const service = await this.prisma.client.service.findFirst({
      where: { id, companyId },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, companyId: string, dto: UpdateServiceDto) {
    await this.findOne(id, companyId);
    return this.prisma.client.service.update({ where: { id }, data: dto });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.client.service.delete({ where: { id } });
  }
}
