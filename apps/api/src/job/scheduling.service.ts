import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { haversineDistance, travelTimeMinutes } from 'src/common/utils/distance.util';

interface ScheduleRequest {
  startDate: string;
  endDate: string;
  companyId: string;
}

interface CandidateWorker {
  id: string;
  firstName: string;
  lastName: string;
  lat: number | null;
  lng: number | null;
  skills: string[];
  hourlyRate: number | null;
}

interface JobToSchedule {
  id: string;
  customerName: string;
  customerAddress: string;
  customerLat: number;
  customerLng: number;
  estimatedDuration: number;
  serviceType: string;
}

interface DailyAssignment {
  workerId: string;
  workerName: string;
  jobs: { jobId: string; customerName: string; order: number }[];
  totalDuration: number;
  travelMinutes: number;
  totalMinutes: number;
}

export interface ScheduleResult {
  date: string;
  assigned: DailyAssignment[];
  unassigned: { jobId: string; customerName: string }[];
}

const DAILY_CAPACITY_MINUTES = 480; // 8h

@Injectable()
export class SchedulingService {
  constructor(private prisma: PrismaService) {}

  async preview(dto: ScheduleRequest): Promise<ScheduleResult[]> {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    end.setHours(23, 59, 59, 999);

    const jobs = await this.prisma.client.job.findMany({
      where: {
        companyId: dto.companyId,
        status: 'PENDING',
        scheduledStart: { gte: start, lte: end },
        assignments: { none: {} },
      },
      include: { customer: true },
    });

    const workers = await this.prisma.client.worker.findMany({
      where: { companyId: dto.companyId, isActive: true },
    });

    const days = this.groupByDay(jobs, start, end);
    const results: ScheduleResult[] = [];

    for (const [dateKey, dayJobs] of Object.entries(days)) {
      const date = new Date(dateKey);
      const dayOfWeek = date.getDay();

      const availableWorkers = workers.filter(
        (w) => w.workDays.includes(dayOfWeek),
      );

      const result = this.scheduleDay(
        dayJobs.map((j) => ({
          id: j.id,
          customerName: j.customer.name,
          customerAddress: j.customer.address,
          customerLat: j.customer.lat,
          customerLng: j.customer.lng,
          estimatedDuration: j.estimatedDuration ?? 120,
          serviceType: '',
        })),
        availableWorkers.map((w) => ({
          id: w.id,
          firstName: w.firstName,
          lastName: w.lastName,
          lat: w.lat ?? null,
          lng: w.lng ?? null,
          skills: (w.skills as string[]) ?? [],
          hourlyRate: w.hourlyRate,
        })),
      );

      results.push({ date: dateKey, ...result });
    }

    return results;
  }

  async apply(dto: ScheduleRequest): Promise<{ applied: number }> {
    const results = await this.preview(dto);
    let applied = 0;

    for (const day of results) {
      for (const assignment of day.assigned) {
        for (const j of assignment.jobs) {
          try {
            const existing = await this.prisma.client.jobAssignment.findFirst({
              where: { jobId: j.jobId },
            });
            if (!existing) {
              await this.prisma.client.jobAssignment.create({
                data: { jobId: j.jobId, workerId: assignment.workerId },
              });
              applied++;
            }
          } catch {
            // skip conflicts
          }
        }
      }
    }

    return { applied };
  }

  async reassignDay(
    date: string,
    workerId: string,
    companyId: string,
  ): Promise<ScheduleResult> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Release this worker's jobs for the day
    const assignments = await this.prisma.client.jobAssignment.findMany({
      where: { workerId, job: { scheduledStart: { gte: dayStart, lte: dayEnd } } },
    });
    const releasedJobIds = assignments.map((a) => a.jobId);
    if (releasedJobIds.length > 0) {
      await this.prisma.client.jobAssignment.deleteMany({
        where: { id: { in: assignments.map((a) => a.id) } },
      });
    }

    // Re-schedule that day
    const scheduleResult = await this.preview({
      startDate: date,
      endDate: date,
      companyId,
    });

    return scheduleResult[0] ?? { date, assigned: [], unassigned: [] };
  }

  // --- Internal ---

  private groupByDay(
    jobs: any[],
    start: Date,
    end: Date,
  ): Record<string, typeof jobs> {
    const days: Record<string, any[]> = {};
    const d = new Date(start);
    while (d <= end) {
      const key = d.toISOString().slice(0, 10);
      days[key] = [];
      d.setDate(d.getDate() + 1);
    }
    for (const job of jobs) {
      const key = job.scheduledStart.toISOString().slice(0, 10);
      if (days[key]) {
        days[key].push(job);
      }
    }
    return days;
  }

  private scheduleDay(
    jobs: JobToSchedule[],
    workers: CandidateWorker[],
  ): { assigned: DailyAssignment[]; unassigned: { jobId: string; customerName: string }[] } {
    const workerState = new Map<
      string,
      {
        jobs: { jobId: string; customerName: string; lat: number; lng: number; duration: number }[];
        remainingMinutes: number;
      }
    >();

    for (const w of workers) {
      workerState.set(w.id, { jobs: [], remainingMinutes: DAILY_CAPACITY_MINUTES });
    }

    const unassigned: { jobId: string; customerName: string }[] = [];

    for (const job of jobs) {
      const candidates = this.scoreCandidates(job, workers, workerState);

      if (candidates.length === 0) {
        unassigned.push({ jobId: job.id, customerName: job.customerName });
        continue;
      }

      // Pick best candidate
      const best = candidates[0];
      const state = workerState.get(best.workerId)!;

      // Calculate travel time from last job (or from worker's home for first job)
      let travelMin = 0;
      const lastJob = state.jobs[state.jobs.length - 1];
      if (lastJob) {
        travelMin = travelTimeMinutes(
          { lat: lastJob.lat, lng: lastJob.lng },
          { lat: job.customerLat, lng: job.customerLng },
        );
      } else if (best.workerLat != null && best.workerLng != null) {
        travelMin = travelTimeMinutes(
          { lat: best.workerLat, lng: best.workerLng },
          { lat: job.customerLat, lng: job.customerLng },
        );
      }

      const totalMinutes = travelMin + job.estimatedDuration;

      if (totalMinutes > state.remainingMinutes) {
        // Try next candidate
        let assigned = false;
        for (const c of candidates.slice(1)) {
          const cs = workerState.get(c.workerId)!;
          const lt = cs.jobs.length > 0
            ? travelTimeMinutes(
                { lat: cs.jobs[cs.jobs.length - 1].lat, lng: cs.jobs[cs.jobs.length - 1].lng },
                { lat: job.customerLat, lng: job.customerLng },
              )
            : c.workerLat != null && c.workerLng != null
              ? travelTimeMinutes({ lat: c.workerLat, lng: c.workerLng }, { lat: job.customerLat, lng: job.customerLng })
              : 0;
          const tm = lt + job.estimatedDuration;
          if (tm <= cs.remainingMinutes) {
            cs.jobs.push({
              jobId: job.id,
              customerName: job.customerName,
              lat: job.customerLat,
              lng: job.customerLng,
              duration: job.estimatedDuration,
            });
            cs.remainingMinutes -= tm;
            assigned = true;
            break;
          }
        }
        if (!assigned) {
          unassigned.push({ jobId: job.id, customerName: job.customerName });
        }
      } else {
        state.jobs.push({
          jobId: job.id,
          customerName: job.customerName,
          lat: job.customerLat,
          lng: job.customerLng,
          duration: job.estimatedDuration,
        });
        state.remainingMinutes -= totalMinutes;
      }
    }

    // Build result: sort each worker's jobs by TSP (nearest-neighbor for simplicity)
    const assigned: DailyAssignment[] = [];
    for (const w of workers) {
      const state = workerState.get(w.id)!;
      if (state.jobs.length === 0) continue;

      const ordered = this.nearestNeighborOrder(state.jobs);

      let totalDuration = 0;
      let totalTravel = 0;
      for (let i = 0; i < ordered.length; i++) {
        totalDuration += ordered[i].duration;
        if (i > 0) {
          totalTravel += travelTimeMinutes(
            { lat: ordered[i - 1].lat, lng: ordered[i - 1].lng },
            { lat: ordered[i].lat, lng: ordered[i].lng },
          );
        }
      }

      assigned.push({
        workerId: w.id,
        workerName: `${w.firstName} ${w.lastName}`,
        jobs: ordered.map((j, idx) => ({
          jobId: j.jobId,
          customerName: j.customerName,
          order: idx + 1,
        })),
        totalDuration,
        travelMinutes: totalTravel,
        totalMinutes: totalDuration + totalTravel,
      });
    }

    return { assigned, unassigned };
  }

  private scoreCandidates(
    job: JobToSchedule,
    workers: CandidateWorker[],
    workerState: Map<string, { jobs: any[]; remainingMinutes: number }>,
  ): { workerId: string; score: number; workerLat: number | null; workerLng: number | null }[] {
    const results: { workerId: string; score: number; workerLat: number | null; workerLng: number | null }[] = [];

    for (const w of workers) {
      const state = workerState.get(w.id);
      if (!state || state.remainingMinutes <= 0) continue;

      let score = 0;

      // Distance score: closer = higher
      if (w.lat != null && w.lng != null) {
        const dist = haversineDistance(
          { lat: w.lat, lng: w.lng },
          { lat: job.customerLat, lng: job.customerLng },
        );
        score += Math.round(1 / (dist / 1000 + 1) * 100);
      }

      // Cluster bonus: already has jobs near this one
      for (const existing of state.jobs) {
        const dist = haversineDistance(
          { lat: existing.lat, lng: existing.lng },
          { lat: job.customerLat, lng: job.customerLng },
        );
        if (dist <= 3000) {
          score += 20;
        }
      }

      // Load balance: fewer jobs = higher
      score += Math.max(0, 50 - state.jobs.length * 10);

      results.push({
        workerId: w.id,
        score,
        workerLat: w.lat,
        workerLng: w.lng,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  private nearestNeighborOrder(
    jobs: { lat: number; lng: number; jobId: string; customerName: string; duration: number }[],
  ): typeof jobs {
    if (jobs.length <= 2) return jobs;

    const remaining = [...jobs];
    const ordered: typeof jobs = [];
    let current = remaining.shift()!;
    ordered.push(current);

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const dist = haversineDistance(
          { lat: current.lat, lng: current.lng },
          { lat: remaining[i].lat, lng: remaining[i].lng },
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }
      current = remaining.splice(nearestIdx, 1)[0];
      ordered.push(current);
    }

    return ordered;
  }
}
