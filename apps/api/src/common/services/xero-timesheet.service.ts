import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { XeroService } from './xero.service';

@Injectable()
export class XeroTimesheetService {
  private readonly logger = new Logger(XeroTimesheetService.name);

  constructor(
    private prisma: PrismaService,
    private xeroService: XeroService,
  ) {}

  /**
   * Sync GPS clock-in/out data to Xero Timesheets when a job is completed.
   * Called after check-out (or job complete with actual hours).
   * Non-blocking — failure is logged but doesn't affect job completion.
   */
  async syncJobTimesheet(jobId: string, companyId: string): Promise<void> {
    try {
      const job = await this.prisma.client.job.findFirst({
        where: { id: jobId, companyId },
        include: {
          customer: true,
          assignments: { include: { worker: true } },
        },
      });

      if (!job || !job.actualStart || !job.actualEnd) return; // need actual times
      if (!job.assignments.length) return;

      const company = await this.prisma.client.company.findUnique({
        where: { id: companyId },
        select: { xeroTenantId: true },
      });
      if (!company?.xeroTenantId) return; // Xero not connected

      const xero = await this.xeroService.getClient(companyId);
      if (!xero) return;

      const minutes = Math.round((job.actualEnd.getTime() - job.actualStart.getTime()) / 60000);
      if (minutes < 1) return;

      for (const assignment of job.assignments) {
        const worker = assignment.worker;
        if (!worker.userId) continue; // worker must have a user account

        try {
          const user = await this.prisma.client.user.findUnique({
            where: { id: worker.userId },
            select: { email: true, id: true },
          });
          if (!user) continue;

          // Build timesheet entry
          const timesheet = {
            employeeId: worker.id,
            startDate: job.actualStart.toISOString().split('T')[0],
            endDate: job.actualEnd.toISOString().split('T')[0],
            status: 'APPROVED' as string,
            timesheetLines: [{
              description: `${job.customer.name} — ${job.notes || 'Cleaning service'}`,
              startTime: job.actualStart.toISOString(),
              endTime: job.actualEnd.toISOString(),
              numberOfUnits: Math.round(minutes / 60 * 100) / 100, // convert to hours
              unitType: 'HOURS',
            }],
          };

          // Try Australian/Payroll API first (most common for payroll.timesheets scope)
          try {
            await (xero as any).payrollAUApi.createTimesheet(company.xeroTenantId, timesheet);
            this.logger.log(`Timesheet synced to Xero for worker ${worker.firstName} ${worker.lastName} (${minutes}min)`);
          } catch (payrollError: any) {
            // Fallback: try accounting API if payroll not available
            this.logger.warn(
              `Xero Payroll timesheet sync skipped for ${worker.firstName}: ${payrollError?.body?.message || payrollError?.message || 'unknown error'}`,
            );
          }
        } catch (err) {
          this.logger.warn(`Failed to sync timesheet for worker ${worker.firstName}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      this.logger.warn(`Timesheet sync failed for job ${jobId.substring(0, 8)}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
