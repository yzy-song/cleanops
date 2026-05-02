import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
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
      include: { user: { select: { id: true, email: true, role: true } } },
    });
  }

  async findOne(id: string) {
    const worker = await this.prisma.client.worker.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, role: true } }, assignments: true },
    });
    if (!worker) throw new NotFoundException('Worker not found');
    return worker;
  }

  async update(id: string, dto: UpdateWorkerDto) {
    const data: any = { ...dto };
    // 如果更新了 email，同步更新 User
    if (dto.email) {
      const worker = await this.prisma.client.worker.findUnique({ where: { id } });
      if (worker) {
        await this.prisma.client.user.update({
          where: { id: worker.userId },
          data: { email: dto.email },
        });
      }
    }
    return this.prisma.client.worker.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.client.worker.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getMyEarnings(userId: string, from?: string, to?: string) {
    // Find worker by userId
    const worker = await this.prisma.client.worker.findFirst({
      where: { userId },
      include: { company: true },
    });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const where: any = {
      companyId: worker.companyId,
      status: 'COMPLETED',
      assignments: { some: { workerId: worker.id } },
    };
    if (from || to) {
      where.actualEnd = {};
      if (from) where.actualEnd.gte = new Date(from);
      if (to) where.actualEnd.lte = new Date(to);
    }

    const jobs = await this.prisma.client.job.findMany({
      where,
      include: { customer: true },
    });

    const hourlyRate = worker.hourlyRate ?? worker.company.baseHourlyRate;
    let totalMinutes = 0;
    for (const job of jobs) {
      if (job.actualStart && job.actualEnd) {
        totalMinutes += Math.round((job.actualEnd.getTime() - job.actualStart.getTime()) / 60000);
      } else if (job.estimatedDuration) {
        totalMinutes += job.estimatedDuration;
      }
    }

    const hours = totalMinutes / 60;
    return {
      workerId: worker.id,
      name: `${worker.firstName} ${worker.lastName}`,
      hourlyRate,
      totalHours: Math.round(hours * 100) / 100,
      totalEarnings: Math.round(hours * hourlyRate),
      jobCount: jobs.length,
      jobs,
    };
  }

  async getMyJobs(userId: string) {
    const worker = await this.prisma.client.worker.findFirst({
      where: { userId },
    });
    if (!worker) throw new NotFoundException('Worker profile not found');

    return this.prisma.client.job.findMany({
      where: {
        companyId: worker.companyId,
        assignments: { some: { workerId: worker.id } },
      },
      include: { customer: true, assignments: { include: { worker: true } } },
      orderBy: { scheduledStart: 'desc' },
      take: 50,
    });
  }
}
