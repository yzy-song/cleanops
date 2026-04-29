import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { EmailService } from '../email/email.service';
import * as geolib from 'geolib';
import { PrismaService } from 'src/prisma/prisma.service';
import { paginate } from '../common/utils/pagination.util';

@Injectable()
export class JobService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(companyId: string, dto: CreateJobDto) {
    return this.prisma.client.job.create({
      data: {
        scheduledStart: new Date(dto.scheduledStart),
        estimatedDuration: dto.estimatedDuration,
        notes: dto.notes,
        company: { connect: { id: companyId } },
        customer: { connect: { id: dto.customerId } },
        assignments: {
          create: dto.workerIds.map((workerId) => ({
            worker: { connect: { id: workerId } },
          })),
        },
      },
      include: { assignments: { include: { worker: true } }, customer: true },
    });
  }

  async findAll(companyId: string, query: QueryJobDto) {
    const where: any = { companyId };
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;
    if (query.fromDate || query.toDate) {
      where.scheduledStart = {};
      if (query.fromDate) where.scheduledStart.gte = new Date(query.fromDate);
      if (query.toDate) where.scheduledStart.lte = new Date(query.toDate);
    }
    if (query.workerId) {
      where.assignments = { some: { workerId: query.workerId } };
    }

    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.client.job.findMany({
        where,
        include: { customer: true, assignments: { include: { worker: true } }, _count: { select: { assignments: true } } },
        orderBy: { scheduledStart: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.job.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string, companyId: string) {
    const job = await this.prisma.client.job.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        assignments: { include: { worker: true } },
        invoice: true,
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async update(id: string, companyId: string, dto: UpdateJobDto) {
    const data: any = { ...dto };
    if (dto.scheduledStart) data.scheduledStart = new Date(dto.scheduledStart);

    // 如果传了 workerIds，重新同步 JobAssignment
    if (dto.workerIds) {
      await this.prisma.client.jobAssignment.deleteMany({ where: { jobId: id } });
      if (dto.workerIds.length > 0) {
        await this.prisma.client.jobAssignment.createMany({
          data: dto.workerIds.map((workerId) => ({ jobId: id, workerId })),
        });
      }
      delete data.workerIds;
    }

    return this.prisma.client.job.update({
      where: { id },
      data,
      include: { assignments: { include: { worker: true } }, customer: true },
    });
  }

  async cancel(id: string, companyId: string) {
    const job = await this.findOne(id, companyId);
    if (job.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed job');
    }
    return this.prisma.client.job.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async assignWorkers(id: string, companyId: string, workerIds: string[]) {
    await this.findOne(id, companyId);
    const existing = await this.prisma.client.jobAssignment.findMany({
      where: { jobId: id },
      select: { workerId: true },
    });
    const existingIds = existing.map((a) => a.workerId);
    const newIds = workerIds.filter((wid) => !existingIds.includes(wid));

    if (newIds.length > 0) {
      await this.prisma.client.jobAssignment.createMany({
        data: newIds.map((workerId) => ({ jobId: id, workerId })),
      });
    }
    return this.findOne(id, companyId);
  }

  async unassignWorker(id: string, companyId: string, workerId: string) {
    await this.findOne(id, companyId);
    await this.prisma.client.jobAssignment.deleteMany({
      where: { jobId: id, workerId },
    });
    return this.findOne(id, companyId);
  }

  // 1. 员工打卡逻辑 (Check-in)
  async checkIn(jobId: string, workerId: string, lat: number, lng: number) {
    const job = await this.prisma.client.job.findUnique({
      where: { id: jobId },
      include: { customer: true, assignments: true },
    });

    if (!job) throw new NotFoundException('Job not found');

    if (job.status !== 'PENDING') {
      throw new BadRequestException(`Cannot check in. Job is currently ${job.status}`);
    }

    // 安全检查：确认该员工是否被指派了此任务
    // 假设 User 表的 id 就是这里的 workerId
    const isAssigned = job.assignments.some((a) => a.workerId === workerId);
    if (!isAssigned) throw new BadRequestException('You are not assigned to this job');

    // 坐标校验
    const distance = geolib.getDistance(
      { latitude: lat, longitude: lng },
      { latitude: job.customer.lat, longitude: job.customer.lng },
    );

    const ALLOWED_METERS = 200; // 允许200米误差
    if (distance > ALLOWED_METERS) {
      throw new BadRequestException(`Check-in failed. You are ${distance}m away (allowed: ${ALLOWED_METERS}m)`);
    }

    return this.prisma.client.job.update({
      where: { id: jobId },
      data: {
        status: 'IN_PROGRESS',
        actualStart: new Date(),
        startLocationLat: lat,
        startLocationLng: lng,
      },
    });
  }

  // 2. 员工完成任务 (Complete) 并发邮件
  async complete(jobId: string, workerId: string, notes?: string) {
    const job = await this.prisma.client.job.findUnique({
      where: { id: jobId },
      include: {
        customer: true,
        company: true,
        assignments: true,
      },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Job must be IN_PROGRESS to mark as completed');
    }

    const isAssigned = job.assignments.some((a) => a.workerId === workerId);
    if (!isAssigned) throw new BadRequestException('You are not assigned to this job');

    // 更新任务状态
    const updatedJob = await this.prisma.client.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        actualEnd: new Date(),
        internalNotes: notes, // 可以记录一些纠纷或注意事项
      },
    });

    // 异步发送邮件给客户
    // 这里我们假设 EmailService 中已经有了类似 sendServiceCompletedEmail 的方法
    // 如果没有，你可以在 EmailService 中添加它，或者重用发确认信的方法稍作修改
    try {
      await this.emailService.sendJobConfirmationEmail(job.customer, job, job.company);
    } catch (error) {
      // 我们只记录日志，不让邮件发送失败影响整个 API 的返回
      console.error('Failed to send completion email', error);
    }

    return updatedJob;
  }
}
