import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

const RECURRENCE_DAYS: Record<string, number> = {
  WEEKLY: 7,
  'BI-WEEKLY': 14,
};

@Injectable()
export class RecurringJobService {
  private readonly logger = new Logger(RecurringJobService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 3 * * *')
  async generateUpcomingInstances() {
    this.logger.log('Checking recurring jobs for instance generation...');

    const templates = await this.prisma.client.job.findMany({
      where: {
        isRecurring: true,
        status: { not: 'CANCELLED' },
        recurrenceRule: { in: ['WEEKLY', 'BI-WEEKLY'] },
      },
      include: { customer: true },
    });

    let generated = 0;

    for (const template of templates) {
      try {
        const intervalDays = RECURRENCE_DAYS[template.recurrenceRule!];
        if (!intervalDays) continue;

        const baseDate = template.recurrenceLastDate ?? template.scheduledStart;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + intervalDays);

        // Generate all overdue instances up to today
        while (nextDate <= today) {
          const exists = await this.prisma.client.job.findFirst({
            where: {
              companyId: template.companyId,
              customerId: template.customerId,
              scheduledStart: {
                gte: new Date(nextDate.setHours(0, 0, 0, 0)),
                lte: new Date(nextDate.setHours(23, 59, 59, 999)),
              },
              notes: template.notes,
            },
          });

          if (!exists) {
            await this.prisma.client.job.create({
              data: {
                scheduledStart: new Date(nextDate),
                estimatedDuration: template.estimatedDuration,
                notes: template.notes,
                status: 'PENDING',
                depositAmount: template.depositAmount,
                customerId: template.customerId,
                companyId: template.companyId,
              },
            });
            generated++;
          }

          // Advance to next instance
          nextDate.setDate(nextDate.getDate() + intervalDays);
        }

        // Update the template's last recurrence date
        const latestBaseDate = new Date(baseDate);
        while (latestBaseDate <= today) {
          latestBaseDate.setDate(latestBaseDate.getDate() + intervalDays);
        }
        latestBaseDate.setDate(latestBaseDate.getDate() - intervalDays);

        if (latestBaseDate > baseDate) {
          await this.prisma.client.job.update({
            where: { id: template.id },
            data: { recurrenceLastDate: latestBaseDate },
          });
        }
      } catch (err: any) {
        this.logger.error(
          `Failed to generate recurring instance for job ${template.id}: ${err.message}`,
        );
      }
    }

    if (generated > 0) {
      this.logger.log(`Generated ${generated} recurring job instance(s)`);
    }
  }
}
