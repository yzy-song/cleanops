import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'CleanOps API';
  }

  async healthCheck() {
    let dbOk = false;
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {}

    return {
      status: dbOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage().heapUsed,
      database: dbOk ? 'connected' : 'disconnected',
    };
  }
}
