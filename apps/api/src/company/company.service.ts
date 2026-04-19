import { Injectable } from '@nestjs/common';
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

  findOne(id: number) {
    return `This action returns a #${id} company`;
  }

  update(id: number, updateCompanyDto: UpdateCompanyDto) {
    return `This action updates a #${id} company`;
  }

  remove(id: number) {
    return `This action removes a #${id} company`;
  }
}
