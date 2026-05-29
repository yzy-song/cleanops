import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  @Cron('0 8 * * *')
  async sendServiceReminders() {
    this.logger.log('Checking for upcoming service reminders...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(tomorrow.setHours(0, 0, 0, 0));
    const end = new Date(tomorrow.setHours(23, 59, 59, 999));

    const jobs = await this.prisma.client.job.findMany({
      where: {
        status: 'PENDING',
        scheduledStart: { gte: start, lte: end },
        reminderSentAt: null,
        customer: { email: { not: null } },
      },
      include: {
        customer: true,
        company: true,
        assignments: { include: { worker: true } },
      },
    });

    let sent = 0;
    for (const job of jobs) {
      try {
        await this.emailService.sendServiceReminderEmail(
          job.customer,
          job as any,
          job.company,
        );
        await this.prisma.client.job.update({
          where: { id: job.id },
          data: { reminderSentAt: new Date() },
        });
        sent++;
      } catch (err: any) {
        this.logger.error(
          `Failed to send reminder for job ${job.id}: ${err.message}`,
        );
      }
    }

    if (sent > 0) {
      this.logger.log(`Sent ${sent} service reminder(s)`);
    }
  }
}
