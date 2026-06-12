import { BadRequestException } from '@nestjs/common';

export interface PlanLimits {
  maxWorkers: number;
  maxBookingForms: number;
  features: string[];
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  NONE: { maxWorkers: 0, maxBookingForms: 0, features: [] },
  TRIALING: { maxWorkers: 10, maxBookingForms: 2, features: ['jobs', 'customers', 'invoicing', 'quotes', 'gps', 'reports'] },
  STARTER: { maxWorkers: 5, maxBookingForms: 1, features: ['jobs', 'customers', 'invoicing', 'quotes'] },
  PRO: { maxWorkers: 20, maxBookingForms: 5, features: ['jobs', 'customers', 'invoicing', 'quotes', 'gps', 'reports', 'portal', 'automations'] },
  BUSINESS: { maxWorkers: Infinity, maxBookingForms: Infinity, features: ['jobs', 'customers', 'invoicing', 'quotes', 'gps', 'reports', 'portal', 'automations', 'xero', 'api'] },
};

/**
 * Check if a company's plan allows creating more workers.
 * Throws BadRequestException if limit is reached.
 */
export function assertWorkerLimit(currentCount: number, plan: string | null | undefined) {
  const limits = PLAN_LIMITS[plan || 'NONE'] || PLAN_LIMITS.NONE;
  if (currentCount >= limits.maxWorkers) {
    throw new BadRequestException(
      `Your ${plan || 'Free'} plan allows up to ${limits.maxWorkers} workers. Upgrade to add more.`,
    );
  }
}
