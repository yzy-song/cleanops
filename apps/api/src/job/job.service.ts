import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import * as geolib from 'geolib';
import { PrismaService } from 'src/prisma/prisma.service';
import { CheckInDto } from './dto/check-in.dto';

@Injectable()
export class JobService {
  constructor(private prisma: PrismaService) {}

  // 1. 创建任务并指派员工
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

  // 2. 地理围栏打卡逻辑
  async checkIn(jobId: string, workerId: string, location: CheckInDto) {
    const job = await this.prisma.client.job.findUnique({
      where: { id: jobId },
      include: { customer: true, assignments: true },
    });

    if (!job) throw new NotFoundException('任务不存在');

    // 安全检查：确认该员工是否被指派了此任务
    const isAssigned = job.assignments.some((a) => a.workerId === workerId);
    if (!isAssigned) throw new BadRequestException('您未被指派执行此任务');

    // 坐标校验
    const distance = geolib.getDistance(
      { latitude: location.lat, longitude: location.lng },
      { latitude: job.customer.lat, longitude: job.customer.lng },
    );

    const ALLOWED_METERS = 200; // 允许200米误差
    if (distance > ALLOWED_METERS) {
      throw new BadRequestException(`打卡失败：距离客户位置过远 (${distance}米)`);
    }

    return this.prisma.client.job.update({
      where: { id: jobId },
      data: {
        status: 'IN_PROGRESS',
        actualStart: new Date(),
      },
    });
  }

  // 3. 查询当前公司的所有任务
  async findAll(companyId: string) {
    return this.prisma.client.job.findMany({
      where: { companyId },
      include: { customer: true, assignments: { include: { worker: true } } },
      orderBy: { scheduledStart: 'desc' },
    });
  }
}
