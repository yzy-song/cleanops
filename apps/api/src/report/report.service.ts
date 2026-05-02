import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const now = new Date();
    const overdueThreshold = new Date(now);
    overdueThreshold.setDate(overdueThreshold.getDate() - 7);

    const company = await this.prisma.client.company.findUnique({ where: { id: companyId } });

    const [
      todayJobDetails,
      todayCompletedCount,
      todayRevenueAgg,
      inProgressJobs,
      thisMonthPaidRevenue,
      overdueInvoices,
      pendingInvoicesAgg,
      totalWorkers,
      totalCustomers,
      upcomingJobs,
      pendingDeposits,
    ] = await Promise.all([
      this.prisma.client.job.findMany({
        where: { companyId, scheduledStart: { gte: today, lt: tomorrow }, status: { not: 'CANCELLED' } },
        include: { customer: true, assignments: { include: { worker: true } } },
        orderBy: { scheduledStart: 'asc' },
      }),
      this.prisma.client.job.count({
        where: { companyId, status: 'COMPLETED', actualEnd: { gte: today } },
      }),
      this.prisma.client.invoice.aggregate({
        where: { companyId, createdAt: { gte: today }, status: { not: 'VOID' } },
        _sum: { amount: true },
      }),
      this.prisma.client.job.findMany({
        where: { companyId, status: 'IN_PROGRESS' },
        include: { customer: true, assignments: { include: { worker: true } } },
      }),
      this.prisma.client.invoice.aggregate({
        where: {
          companyId,
          status: 'PAID',
          paidAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        },
        _sum: { amount: true },
      }),
      this.prisma.client.invoice.findMany({
        where: { companyId, status: 'UNPAID', createdAt: { lt: overdueThreshold } },
        include: { job: { include: { customer: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.client.invoice.aggregate({
        where: { companyId, status: 'UNPAID' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.client.worker.count({ where: { companyId, isActive: true } }),
      this.prisma.client.customer.count({ where: { companyId } }),
      this.prisma.client.job.findMany({
        where: {
          companyId,
          scheduledStart: { gte: tomorrow },
          status: { not: 'CANCELLED' },
        },
        include: { customer: true, assignments: { include: { worker: true } } },
        orderBy: { scheduledStart: 'asc' },
        take: 5,
      }),
      this.prisma.client.job.findMany({
        where: {
          companyId,
          depositAmount: { gt: 0 },
          isDepositPaid: false,
          status: { not: 'CANCELLED' },
        },
        include: { customer: true },
        orderBy: { scheduledStart: 'asc' },
        take: 10,
      }),
    ]);

    // Calculate today's expected revenue
    const hourlyRate = company.baseHourlyRate;
    let todayExpectedRevenue = 0;
    let missingCheckIns = 0;
    for (const job of todayJobDetails) {
      const minutes = job.estimatedDuration ?? 60;
      todayExpectedRevenue += Math.round((minutes / 60) * hourlyRate);
      if (job.status === 'PENDING' && new Date(job.scheduledStart) < now) {
        missingCheckIns++;
      }
    }

    return {
      todayJobs: todayJobDetails.length,
      todayJobDetails,
      todayCompletedCount,
      todayExpectedRevenue,
      todayRevenue: todayRevenueAgg._sum.amount ?? 0,
      thisMonthRevenue: thisMonthPaidRevenue._sum.amount ?? 0,
      pendingInvoices: pendingInvoicesAgg._count,
      pendingInvoicesAmount: pendingInvoicesAgg._sum.amount ?? 0,
      overdueInvoices: overdueInvoices.map((inv) => ({
        id: inv.id,
        amount: inv.amount,
        customerName: inv.job.customer.name,
        createdAt: inv.createdAt,
        jobCompletedAt: inv.job.actualEnd,
      })),
      overdueInvoicesCount: overdueInvoices.length,
      overdueInvoicesAmount: overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      inProgressJobs: inProgressJobs.map((j) => ({
        id: j.id,
        customerName: j.customer.name,
        address: j.customer.address,
        scheduledStart: j.scheduledStart,
        workers: j.assignments.map((a) => `${a.worker.firstName} ${a.worker.lastName}`),
      })),
      inProgressCount: inProgressJobs.length,
      missingCheckIns,
      pendingDeposits: pendingDeposits.map((j) => ({
        id: j.id,
        customerName: j.customer.name,
        amount: j.depositAmount,
        scheduledStart: j.scheduledStart,
        status: j.status,
      })),
      pendingDepositsCount: pendingDeposits.length,
      pendingDepositsAmount: pendingDeposits.reduce((sum, j) => sum + (j.depositAmount ?? 0), 0),
      activeWorkers: totalWorkers,
      totalCustomers,
      upcomingJobs: upcomingJobs.map((j) => ({
        id: j.id,
        customerName: j.customer.name,
        scheduledStart: j.scheduledStart,
        status: j.status,
        workerNames: j.assignments.map((a) => `${a.worker.firstName} ${a.worker.lastName}`),
      })),
    };
  }

  async getPayroll(companyId: string, from?: string, to?: string) {
    const where: any = {
      companyId,
      status: 'COMPLETED',
    };
    if (from || to) {
      where.actualEnd = {};
      if (from) where.actualEnd.gte = new Date(from);
      if (to) where.actualEnd.lte = new Date(to);
    }

    const company = await this.prisma.client.company.findUnique({ where: { id: companyId } });
    const jobs = await this.prisma.client.job.findMany({
      where,
      include: { assignments: { include: { worker: true } }, customer: true },
    });

    // Aggregate per worker
    const workerMap = new Map<string, { worker: any; totalMinutes: number; jobs: any[] }>();
    for (const job of jobs) {
      for (const assign of job.assignments) {
        const wid = assign.workerId;
        if (!workerMap.has(wid)) {
          workerMap.set(wid, { worker: assign.worker, totalMinutes: 0, jobs: [] });
        }
        const entry = workerMap.get(wid)!;
        let minutes = 0;
        if (job.actualStart && job.actualEnd) {
          minutes = Math.round((job.actualEnd.getTime() - job.actualStart.getTime()) / 60000);
        } else if (job.estimatedDuration) {
          minutes = job.estimatedDuration;
        }
        entry.totalMinutes += minutes;
        entry.jobs.push(job);
      }
    }

    const payroll = Array.from(workerMap.values()).map((entry) => {
      const hours = entry.totalMinutes / 60;
      const hourlyRate = entry.worker.hourlyRate ?? company.baseHourlyRate;
      const grossPay = Math.round(hours * hourlyRate);
      const pensionAmount = company.pensionEnrollment ? Math.round(grossPay * 0.015) : 0;
      const prsiEstimate = Math.round(grossPay * 0.1115);
      const netPay = grossPay - pensionAmount;

      return {
        workerId: entry.worker.id,
        name: `${entry.worker.firstName} ${entry.worker.lastName}`,
        workerName: `${entry.worker.firstName} ${entry.worker.lastName}`,
        hours: Math.round(hours * 100) / 100,
        totalHours: Math.round(hours * 100) / 100,
        hourlyRate,
        grossPay,
        pensionAmount,
        prsiEstimate,
        netPay,
        jobCount: entry.jobs.length,
      };
    });

    const totals = payroll.reduce(
      (acc, p) => ({
        grossPay: acc.grossPay + p.grossPay,
        pensionAmount: acc.pensionAmount + p.pensionAmount,
        prsiEstimate: acc.prsiEstimate + p.prsiEstimate,
        netPay: acc.netPay + p.netPay,
      }),
      { grossPay: 0, pensionAmount: 0, prsiEstimate: 0, netPay: 0 },
    );

    return { payroll, totals, eroMinimum: company.baseHourlyRate };
  }

  async getVatReport(companyId: string, from?: string, to?: string) {
    const where: any = {
      companyId,
      status: { in: ['PAID', 'UNPAID'] },
    };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const invoices = await this.prisma.client.invoice.findMany({
      where,
      include: { job: { include: { customer: true } } },
    });

    const residential = { count: 0, vatTotal: 0, amountTotal: 0 };
    const commercial = { count: 0, vatTotal: 0, amountTotal: 0 };

    for (const inv of invoices) {
      const isComm = inv.job.customer.isCommercial;
      if (isComm) {
        commercial.count++;
        commercial.vatTotal += inv.vatAmount;
        commercial.amountTotal += inv.amount;
      } else {
        residential.count++;
        residential.vatTotal += inv.vatAmount;
        residential.amountTotal += inv.amount;
      }
    }

    return {
      residential: { ...residential, vatRate: '13.5%' },
      commercial: { ...commercial, vatRate: '23%' },
      totalVatLiability: residential.vatTotal + commercial.vatTotal,
      totalRevenue: residential.amountTotal + commercial.amountTotal,
    };
  }

  async getTimesheet(companyId: string, workerId?: string, from?: string, to?: string) {
    const where: any = {
      companyId,
      status: { in: ['COMPLETED', 'IN_PROGRESS'] },
    };
    if (workerId) {
      where.assignments = { some: { workerId } };
    }
    if (from || to) {
      where.scheduledStart = {};
      if (from) where.scheduledStart.gte = new Date(from);
      if (to) where.scheduledStart.lte = new Date(to);
    }

    const jobs = await this.prisma.client.job.findMany({
      where,
      include: {
        customer: true,
        assignments: { include: { worker: true } },
      },
      orderBy: { scheduledStart: 'desc' },
    });

    const company = await this.prisma.client.company.findUnique({ where: { id: companyId } });

    return jobs.map((job) => {
      const worker = job.assignments[0]?.worker;
      let minutes = 0;
      if (job.actualStart && job.actualEnd) {
        minutes = Math.round((job.actualEnd.getTime() - job.actualStart.getTime()) / 60000);
      }
      const hours = minutes / 60;
      const hourlyRate = worker?.hourlyRate ?? company.baseHourlyRate;

      return {
        jobId: job.id,
        date: job.scheduledStart,
        customer: job.customer.name,
        customerName: job.customer.name,
        worker: worker ? `${worker.firstName} ${worker.lastName}` : 'Unassigned',
        hours: Math.round(hours * 100) / 100,
        hourlyRate,
        earnings: Math.round(hours * hourlyRate),
        status: job.status,
      };
    });
  }
}
