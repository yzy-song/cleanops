import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(companyId: string, dto: CreateAutomationDto): Promise<any> {
    return this.prisma.client.automation.create({ data: { ...dto, companyId } });
  }

  async findAll(companyId: string): Promise<any> {
    return this.prisma.client.automation.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, companyId: string, data: Partial<CreateAutomationDto>) {
    return this.prisma.client.automation.updateMany({ where: { id, companyId }, data });
  }

  async remove(id: string, companyId: string) {
    return this.prisma.client.automation.deleteMany({ where: { id, companyId } });
  }

  /** Run all active JOB_COMPLETED automations */
  @Cron('0 9 * * *')
  async executePendingJobs() {
    const rules = await this.prisma.client.automation.findMany({
      where: { trigger: 'JOB_COMPLETED', isActive: true },
    });
    for (const rule of rules) {
      try {
        const jobs = await this.prisma.client.job.findMany({
          where: { companyId: rule.companyId, status: 'COMPLETED', actualEnd: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          include: { customer: true },
          take: 50,
        });
        for (const job of jobs) {
          const config = rule.config as any;
          await this.emailService.sendEmail(
            job.customer.email || '',
            config.subject || 'Your cleaning is complete!',
            (config.body || 'Thank you for choosing us!').replace('{{name}}', job.customer.name),
          );
        }
      } catch (err: any) {
        this.logger.error(`Automation ${rule.id} failed: ${err.message}`);
      }
    }
  }
}
