import { Injectable } from '@nestjs/common';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@Injectable()
export class WorkerService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWorkerDto) {
    return this.prisma.client.worker.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        companyId: dto.companyId,
        hourlyRate: dto.hourlyRate, // 如果传了就用专有时薪，没传 Prisma 自动用 null 或 DB 默认值
      },
    });
  }

  async findByCompany(companyId: string) {
    return this.prisma.client.worker.findMany({
      where: { companyId },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} worker`;
  }

  update(id: number, updateWorkerDto: UpdateWorkerDto) {
    return `This action updates a #${id} worker`;
  }

  remove(id: number) {
    return `This action removes a #${id} worker`;
  }
}
