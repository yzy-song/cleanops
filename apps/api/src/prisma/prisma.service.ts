import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { prisma, PrismaClient } from '@cleanops/db';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public client: PrismaClient = prisma;

  async onModuleInit() {
    const maxRetries = 10;
    const baseDelay = 1000;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.client.$connect();
        this.logger.log('Database connected');
        return;
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        const delay = baseDelay * Math.pow(2, i);
        this.logger.warn(`Database connection failed, retrying in ${delay}ms (${i + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
