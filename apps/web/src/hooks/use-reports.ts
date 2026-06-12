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
  sentQuotesCount: number;
  sentQuotesValue: number;
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
      const raw = res.data.data;
      raw.todayJobs = raw.todayJobDetails?.length ?? 0;
      raw.overdueInvoicesCount = raw.overdueInvoices?.length ?? 0;
      raw.overdueInvoicesAmount = raw.overdueInvoices?.reduce((s: number, inv: any) => s + inv.amount, 0) ?? 0;
      raw.pendingInvoices = raw.pendingInvoicesCount ?? 0;
      raw.pendingInvoicesAmount = raw.pendingInvoicesAmount ?? 0;
      raw.todayRevenue = raw.todayRevenue ?? raw.todayExpectedRevenue ?? 0;
      raw.pendingDepositsCount = raw.pendingDeposits?.length ?? 0;
      raw.pendingDepositsAmount = raw.pendingDeposits?.reduce((s: number, d: any) => s + d.amount, 0) ?? 0;
      raw.inProgressCount = raw.inProgressJobs?.length ?? 0;
      raw.missingCheckIns = raw.missingCheckIns ?? 0;
      return raw as DashboardData;
    },
  });
}

export function usePayroll(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "payroll", from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) { params.set("from", from) };
      if (to) { params.set("to", to) };
      const res = await api.get(`/report/payroll?${params.toString()}`);
      return res.data.data as {
        payroll: { workerId: string; workerName: string; totalHours: number; hourlyRate: number; grossPay: number; pensionAmount: number; prsiEstimate: number; netPay: number; jobCount: number }[];
        totals: { grossPay: number; pensionAmount: number; prsiEstimate: number; netPay: number };
        eroMinimum: number;
      };
    },
  });
}

export function useVatReport(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "vat", from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) { params.set("from", from) };
      if (to) { params.set("to", to) };
      const res = await api.get(`/report/vat?${params.toString()}`);
      return res.data.data;
    },
  });
}

export function useTimesheet(workerId?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "timesheet", workerId, from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workerId) { params.set("workerId", workerId) };
      if (from) { params.set("from", from) };
      if (to) { params.set("to", to) };
      const res = await api.get(`/report/timesheet?${params.toString()}`);
      return res.data.data;
    },
  });
}

export interface OverviewData {
  thisWeekRevenue: number;
  lastWeekRevenue: number;
  thisMonthRevenue: number;
  workingNowCount: number;
  workingNowNames: string[];
  revenueByDay: { date: string; amount: number }[];
  paid: number;
  unpaid: number;
  revenue: any[];
  invoiceStatus: any;
  [key: string]: any;
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

export function useProfitability(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "profitability", from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await api.get(`/report/profitability?${params.toString()}`);
      return res.data.data as {
        jobs: { jobId: string; customer: string; date: string; revenue: number; laborCost: number; grossProfit: number; margin: number; minutes: number; workers: string }[];
        summary: { totalJobs: number; totalRevenue: number; totalLaborCost: number; totalGrossProfit: number; totalMargin: number; totalHours: number; avgRevenuePerJob: number; avgLaborPerJob: number };
      };
    },
  });
}
