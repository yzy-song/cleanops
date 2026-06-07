import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  /** Daily at 10am — send review requests for jobs completed 1 day ago */
  @Cron('0 10 * * *')
  async sendReviewRequests() {
    this.logger.log('Checking for review requests...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const start = new Date(yesterday.setHours(0, 0, 0, 0));
    const end = new Date(yesterday.setHours(23, 59, 59, 999));

    const jobs = await this.prisma.client.job.findMany({
      where: {
        status: 'COMPLETED',
        actualEnd: { gte: start, lte: end },
        reviewSentAt: null,
        customer: { email: { not: null } },
      },
      include: { customer: true, company: true },
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    let sent = 0;

    for (const job of jobs) {
      try {
        await this.emailService.sendReviewRequestEmail(
          { name: job.customer.name, email: job.customer.email! },
          { id: job.id },
          job.company.name,
          frontendUrl,
        );
        await this.prisma.client.job.update({
          where: { id: job.id },
          data: { reviewSentAt: new Date() },
        });
        sent++;
      } catch (err: any) {
        this.logger.error(`Failed to send review request for job ${job.id}: ${err.message}`);
      }
    }

    if (sent > 0) this.logger.log(`Sent ${sent} review request(s)`);
  }

  /** Get job info for the public review page */
  async getReviewInfo(jobId: string) {
    const job = await this.prisma.client.job.findUnique({
      where: { id: jobId },
      include: { customer: true, company: true },
    });
    if (!job) return null;

    return {
      jobId: job.id,
      customerName: job.customer.name,
      companyName: job.company.name,
      googleReviewUrl: job.company.googleReviewUrl,
      completedAt: job.actualEnd,
    };
  }

  /** Submit internal feedback from unhappy customer */
  async submitFeedback(jobId: string, feedback: string) {
    const job = await this.prisma.client.job.findUnique({ where: { id: jobId } });
    if (!job) return null;

    const safe = feedback.trim().slice(0, 2000);
    await this.prisma.client.job.update({
      where: { id: jobId },
      data: {
        internalNotes: job.internalNotes
          ? `${job.internalNotes}\n[Customer Feedback] ${safe}`
          : `[Customer Feedback] ${safe}`,
      },
    });
    return { success: true };
  }
}
