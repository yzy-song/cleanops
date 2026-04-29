import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import * as geolib from 'geolib';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JobService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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
