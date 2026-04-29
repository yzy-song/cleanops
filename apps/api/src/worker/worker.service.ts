import { Injectable, ConflictException } from '@nestjs/common';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { EmailService } from 'src/email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class WorkerService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // apps/api/src/modules/worker/worker.service.ts

  async create(companyId: string, dto: CreateWorkerDto) {
    const existing = await this.prisma.client.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    return this.prisma.client.$transaction(async (tx) => {
      // 1. 创建账号
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: 'WORKER',
          companyId: companyId,
        },
      });

      // 2. 创建档案
      const worker = await tx.worker.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          hourlyRate: dto.hourlyRate,
          // 使用关联写法，Prisma 会自动处理 userId
          user: {
            connect: { id: user.id },
          },
          company: {
            connect: { id: companyId },
          },
        },
      });

      // 3. 异步发送邮件 (发送原始 tempPassword)
      this.emailService.sendNewAccountInfoEmail(dto.email, dto.firstName, tempPassword, 'CleanOps');

      return worker;
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
