import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { EmailService } from '../email/email.service';
import { InvoiceService } from '../invoice/invoice.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import * as geolib from 'geolib';
import { PrismaService } from 'src/prisma/prisma.service';
import { paginate } from '../common/utils/pagination.util';

@Injectable()
export class JobService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private invoiceService: InvoiceService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(companyId: string, dto: CreateJobDto) {
    return this.prisma.client.job.create({
      data: {
        scheduledStart: new Date(dto.scheduledStart),
        estimatedDuration: dto.estimatedDuration,
        notes: dto.notes,
        isRecurring: dto.isRecurring ?? false,
        recurrenceRule: dto.recurrenceRule ?? null,
        depositAmount: dto.depositAmount ?? null,
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
  async checkIn(jobId: string, userId: string, lat: number, lng: number) {
    const job = await this.prisma.client.job.findUnique({
      where: { id: jobId },
      include: { customer: true, assignments: true },
    });

    if (!job) throw new NotFoundException('Job not found');

    if (job.status !== 'PENDING') {
      throw new BadRequestException(`Cannot check in. Job is currently ${job.status}`);
    }

    // 通过 userId 找到对应的 worker
    const worker = await this.prisma.client.worker.findUnique({ where: { userId } });
    if (!worker) throw new BadRequestException('Worker profile not found');

    const isAssigned = job.assignments.some((a) => a.workerId === worker.id);
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
  async complete(jobId: string, userId: string, notes?: string) {
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

    const worker = await this.prisma.client.worker.findUnique({ where: { userId } });
    if (!worker) throw new BadRequestException('Worker profile not found');

    const isAssigned = job.assignments.some((a) => a.workerId === worker.id);
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

    // 自动生成 invoice 并发账单邮件给客户
    try {
      const invoice = await this.invoiceService.generateFromJob(job.companyId, jobId);

      let paymentLink: string | undefined;
      try {
        const result = await this.invoiceService.generatePaymentLink(invoice.id, job.companyId);
        paymentLink = result.paymentLink;
      } catch {
        // payment link generation is optional
      }

      await this.emailService.sendInvoiceEmail(job.customer, job, invoice, paymentLink);
    } catch (error) {
      console.error('Failed to generate invoice or send email', error);
    }

    // 重复任务：自动生成下一次任务
    if (job.isRecurring && job.recurrenceRule) {
      try {
        const nextStart = new Date(job.scheduledStart);
        const days = job.recurrenceRule === 'BI-WEEKLY' ? 14 : 7;
        nextStart.setDate(nextStart.getDate() + days);

        const workerIds = job.assignments.map((a) => a.workerId);

        await this.prisma.client.job.create({
          data: {
            scheduledStart: nextStart,
            estimatedDuration: job.estimatedDuration,
            notes: job.notes,
            isRecurring: true,
            recurrenceRule: job.recurrenceRule,
            customer: { connect: { id: job.customerId } },
            company: { connect: { id: job.companyId } },
            assignments: {
              create: workerIds.map((workerId) => ({
                worker: { connect: { id: workerId } },
              })),
            },
          },
        });
      } catch (error) {
        console.error('Failed to create recurring job instance', error);
      }
    }

    return updatedJob;
  }

  // 3. 员工签退 (Check-out)
  async checkOut(jobId: string, userId: string, lat: number, lng: number, complete?: boolean, notes?: string) {
    const job = await this.prisma.client.job.findUnique({
      where: { id: jobId },
      include: { customer: true, company: true, assignments: true },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Cannot check out. Job is currently ${job.status}`);
    }

    const worker = await this.prisma.client.worker.findUnique({ where: { userId } });
    if (!worker) throw new BadRequestException('Worker profile not found');

    const isAssigned = job.assignments.some((a) => a.workerId === worker.id);
    if (!isAssigned) throw new BadRequestException('You are not assigned to this job');

    const updateData: any = {
      actualEnd: new Date(),
      endLocationLat: lat,
      endLocationLng: lng,
    };

    if (complete) {
      updateData.status = 'COMPLETED';
    }

    const updatedJob = await this.prisma.client.job.update({
      where: { id: jobId },
      data: updateData,
    });

    if (complete) {
      try {
        const invoice = await this.invoiceService.generateFromJob(job.companyId, jobId);
        let paymentLink: string | undefined;
        try {
          const result = await this.invoiceService.generatePaymentLink(invoice.id, job.companyId);
          paymentLink = result.paymentLink;
        } catch { /* optional */ }
        await this.emailService.sendInvoiceEmail(job.customer, job, invoice, paymentLink);
      } catch (error) {
        console.error('Failed to generate invoice or send email on check-out', error);
      }

      // 重复任务自动生成
      if (job.isRecurring && job.recurrenceRule) {
        try {
          const nextStart = new Date(job.scheduledStart);
          const days = job.recurrenceRule === 'BI-WEEKLY' ? 14 : 7;
          nextStart.setDate(nextStart.getDate() + days);
          const workerIds = job.assignments.map((a) => a.workerId);

          await this.prisma.client.job.create({
            data: {
              scheduledStart: nextStart,
              estimatedDuration: job.estimatedDuration,
              notes: job.notes,
              isRecurring: true,
              recurrenceRule: job.recurrenceRule,
              customer: { connect: { id: job.customerId } },
              company: { connect: { id: job.companyId } },
              assignments: {
                create: workerIds.map((workerId) => ({
                  worker: { connect: { id: workerId } },
                })),
              },
            },
          });
        } catch (error) {
          console.error('Failed to create recurring job instance on check-out', error);
        }
      }
    }

    return updatedJob;
  }

  // 手动发送账单邮件给客户
  async sendInvoiceToCustomer(jobId: string, companyId: string) {
    const job = await this.prisma.client.job.findFirst({
      where: { id: jobId, companyId },
      include: { customer: true, company: true, invoice: true },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'COMPLETED') {
      throw new BadRequestException('Job must be completed to send invoice');
    }
    if (!job.invoice) {
      throw new BadRequestException('No invoice found for this job');
    }

    let paymentLink: string | undefined;
    try {
      const result = await this.invoiceService.generatePaymentLink(job.invoice.id, companyId);
      paymentLink = result.paymentLink;
    } catch {
      // payment link generation is optional
    }

    await this.emailService.sendInvoiceEmail(job.customer, job, job.invoice, paymentLink);
    return { success: true };
  }

  async uploadPhoto(jobId: string, companyId: string, file: Express.Multer.File, type: string) {
    const job = await this.findOne(jobId, companyId);
    const result = await this.cloudinaryService.uploadImage(file);

    return this.prisma.client.jobPhoto.create({
      data: {
        url: result.secure_url,
        type: type === 'AFTER' ? 'AFTER' : 'BEFORE',
        job: { connect: { id: jobId } },
      },
    });
  }

  async listPhotos(jobId: string, companyId: string) {
    await this.findOne(jobId, companyId);
    return this.prisma.client.jobPhoto.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePhoto(jobId: string, photoId: string, companyId: string) {
    await this.findOne(jobId, companyId);
    return this.prisma.client.jobPhoto.delete({ where: { id: photoId } });
  }
}
