import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardData {
  todayJobs: number;
  todayJobDetails: {
    id: string;
    status: string;
    scheduledStart: string;
    estimatedDuration: number | null;
    customer: { name: string; address: string };
    assignments: { worker: { firstName: string; lastName: string } }[];
  }[];
  todayCompletedCount: number;
  todayExpectedRevenue: number;
  todayRevenue: number;
  thisMonthRevenue: number;
  pendingInvoices: number;
  pendingInvoicesAmount: number;
  overdueInvoices: {
    id: string;
    amount: number;
    customerName: string;
    createdAt: string;
    jobCompletedAt: string | null;
  }[];
  overdueInvoicesCount: number;
  overdueInvoicesAmount: number;
  inProgressJobs: {
    id: string;
    customerName: string;
    address: string;
    scheduledStart: string;
    workers: string[];
  }[];
  inProgressCount: number;
  missingCheckIns: number;
  pendingDeposits: {
    id: string;
    customerName: string;
    amount: number;
    scheduledStart: string;
    status: string;
  }[];
  pendingDepositsCount: number;
  pendingDepositsAmount: number;
  activeWorkers: number;
  totalCustomers: number;
  upcomingJobs: {
    id: string;
    customerName: string;
    scheduledStart: string;
    status: string;
    workerNames: string[];
  }[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: async () => {
      const res = await api.get("/report/dashboard");
      return res.data.data as DashboardData;
    },
  });
}

export interface PayrollItem {
  workerId: string;
  workerName: string;
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
  pensionAmount: number;
  prsiEstimate: number;
  netPay: number;
}

export interface PayrollData {
  payroll: PayrollItem[];
  totals: { grossPay: number; pensionAmount: number; prsiEstimate: number; netPay: number };
  eroMinimum: number;
}

export function usePayroll(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "payroll", from, to],
    queryFn: async () => {
      const res = await api.get("/report/payroll", { params: { from, to } });
      return res.data.data as PayrollData;
    },
  });
}

export interface VatReport {
  residential: { count: number; vatTotal: number; amountTotal: number; vatRate: string };
  commercial: { count: number; vatTotal: number; amountTotal: number; vatRate: string };
  totalVatLiability: number;
  totalRevenue: number;
}

export function useVatReport(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "vat", from, to],
    queryFn: async () => {
      const res = await api.get("/report/vat", { params: { from, to } });
      return res.data.data as VatReport;
    },
  });
}

export interface TimesheetItem {
  jobId: string;
  customerName: string;
  date: string;
  hours: number;
  earnings: number;
}

export function useTimesheet(workerId?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "timesheet", workerId, from, to],
    queryFn: async () => {
      const res = await api.get("/report/timesheet", { params: { workerId, from, to } });
      return res.data.data as TimesheetItem[];
    },
  });
}

export interface OverviewData {
  revenueByDay: { date: string; amount: number }[];
  invoiceBreakdown: { paid: number; unpaid: number };
  thisWeekRevenue: number;
  lastWeekRevenue: number;
}

export function useOverview() {
  return useQuery({
    queryKey: ["reports", "overview"],
    queryFn: async () => {
      const res = await api.get("/report/overview");
      return res.data.data as OverviewData;
    },
  });
}
