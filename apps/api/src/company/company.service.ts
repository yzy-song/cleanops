import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyWithAdminDto } from './dto/create-company-with-admin.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyWithAdminDto) {
    const hashedPassword = await bcrypt.hash(dto.adminPass, 10);

    return this.prisma.client.company.create({
      data: {
        name: dto.name,
        vatNumber: dto.vatNumber,
        baseHourlyRate: dto.baseHourlyRate ?? 1480,
        pensionEnrollment: true,
        users: {
          create: {
            email: dto.adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
          },
        },
      },
    });
  }

  async findAll() {
    return await this.prisma.client.company.findMany({
      include: { _count: { select: { workers: true, customers: true } } },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.client.company.findUnique({
      where: { id },
      include: { _count: { select: { users: true, workers: true, customers: true, jobs: true } } },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    return this.prisma.client.company.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.client.company.delete({ where: { id } });
  }
}
