"use client";

import Link from "next/link";
import { useDashboard, useOverview } from "@/hooks/use-reports";
import { useStripeConnectStatus } from "@/hooks/use-company";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Euro,
  FileText,
  Users,
  Clock,
  AlertTriangle,
  ChevronRight,
  MapPin,
  ArrowRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isPast } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  IN_PROGRESS: { color: "bg-blue-100 text-blue-800", label: "Working" },
  COMPLETED: { color: "bg-emerald-100 text-emerald-800", label: "Done" },
  CANCELLED: { color: "bg-red-100 text-red-800", label: "Cancelled" },
};

const CHART_COLORS = {
  teal: "oklch(0.55 0.115 175)",
  gold: "oklch(0.75 0.13 75)",
  blue: "oklch(0.50 0.14 248)",
  green: "oklch(0.55 0.14 155)",
  red: "oklch(0.577 0.245 27.325)",
  purple: "oklch(0.50 0.14 300)",
  tealLight: "oklch(0.55 0.115 175 / 0.2)",
};

function TrendPill({ current, previous }: { current: number; previous: number }) {
  if (!previous) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-2 py-0.5",
      up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
    )}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { data: overview } = useOverview();
  const { data: connectStatus } = useStripeConnectStatus();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const weekTrend = overview
    ? { current: overview.thisWeekRevenue, previous: overview.lastWeekRevenue }
    : null;

  const chartRevenue = overview?.revenueByDay.map(d => ({
    date: format(new Date(d.date), "M/d"),
    amount: d.amount / 100,
  })) ?? [];

  const pieData = overview ? [
    { name: "Paid", value: overview.invoiceBreakdown.paid, color: CHART_COLORS.teal },
    { name: "Unpaid", value: overview.invoiceBreakdown.unpaid, color: CHART_COLORS.gold },
  ] : [];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">
              <FileText className="mr-1.5 h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/jobs/new">
              <Calendar className="mr-1.5 h-4 w-4" />
              New Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Alert bar */}
      {(!connectStatus?.connected || (data?.overdueInvoicesCount ?? 0) > 0 || (data?.missingCheckIns ?? 0) > 0 || (data?.pendingDepositsCount ?? 0) > 0) && (
        <div className="flex flex-wrap gap-2">
          {!connectStatus?.connected && (
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 hover:bg-blue-100 transition-colors"
            >
              <Link2 className="h-4 w-4" />
              <span className="font-medium">Connect Stripe to receive payments</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {(data?.pendingDepositsCount ?? 0) > 0 && (
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-800 hover:bg-orange-100 transition-colors"
            >
              <Wallet className="h-4 w-4" />
              <span className="font-medium">
                {data!.pendingDepositsCount} deposit{data!.pendingDepositsCount > 1 ? "s" : ""} pending · {eur(data!.pendingDepositsAmount)}
              </span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {(data?.overdueInvoicesCount ?? 0) > 0 && (
            <Link
              href="/invoices"
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                {data!.overdueInvoicesCount} overdue · {eur(data!.overdueInvoicesAmount)}
              </span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {(data?.missingCheckIns ?? 0) > 0 && (
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800 hover:bg-yellow-100 transition-colors"
            >
              <Clock className="h-4 w-4" />
              <span className="font-medium">{data!.missingCheckIns} missing check-in{data!.missingCheckIns > 1 ? "s" : ""}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-teal-500 rounded-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100">
                  <Calendar className="h-4.5 w-4.5 text-teal-600" />
                </div>
                <span className="text-sm font-medium">Today&apos;s Jobs</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{data?.todayJobs ?? 0}</span>
              {(data?.todayCompletedCount ?? 0) > 0 && (
                <span className="text-sm font-medium text-emerald-600">{data!.todayCompletedCount} done</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 rounded-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <Euro className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium">This Week</span>
              </div>
              {weekTrend && (
                <TrendPill current={weekTrend.current} previous={weekTrend.previous} />
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{eur(overview?.thisWeekRevenue ?? 0)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs {eur(overview?.lastWeekRevenue ?? 0)} last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 rounded-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                <Activity className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <span className="text-sm font-medium">Working Now</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{data?.inProgressCount ?? 0}</span>
              {data?.inProgressJobs && data.inProgressJobs.length > 0 && (
                <span className="text-sm text-blue-600 truncate max-w-[140px]">
                  {data.inProgressJobs.map(j => j.workers.join(", ")).join(" · ")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 rounded-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                <Euro className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium">This Month</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{eur(data?.thisMonthRevenue ?? 0)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{data?.pendingInvoices ?? 0} invoices unpaid · {eur(data?.pendingInvoicesAmount ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Bar Chart */}
        <Card className="lg:col-span-2 rounded-xl bg-muted/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue · Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {chartRevenue.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                No paid invoices in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartRevenue} margin={{ top: 4, left: 0, right: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "oklch(0.65 0.02 240)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "oklch(0.65 0.02 240)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.25 0.02 180 / 0.96)",
                      color: "oklch(0.92 0.01 175)",
                      borderRadius: "0.75rem",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                      fontSize: "13px",
                    }}
                    formatter={(value: any) => [`€${Number(value).toFixed(2)}`, "Revenue"]}
                  />
                  <Bar dataKey="amount" fill={CHART_COLORS.teal} radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status Pie */}
        <Card className="rounded-xl bg-muted/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Invoice Status</CardTitle>
          </CardHeader>
          <CardContent>
            {(pieData[0]?.value ?? 0) === 0 && (pieData[1]?.value ?? 0) === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                No invoices yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart style={{ background: "transparent" }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.25 0.02 180 / 0.96)",
                      color: "oklch(0.92 0.01 175)",
                      borderRadius: "0.75rem",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                      fontSize: "13px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span style={{ color: "oklch(0.35 0.03 180)", fontSize: "13px" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex justify-around mt-2 text-sm">
              <div className="text-center">
                <p className="font-bold text-lg text-teal-600">{pieData[0]?.value ?? 0}</p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg text-amber-600">{pieData[1]?.value ?? 0}</p>
                <p className="text-xs text-muted-foreground">Unpaid</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{data?.activeWorkers ?? 0}</p>
                <p className="text-xs text-muted-foreground">Workers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom: Schedule + Overdue */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Today&apos;s Schedule</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/jobs/new">
                <Calendar className="mr-1 h-4 w-4" />
                Add
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!data?.todayJobDetails?.length ? (
              <div className="py-10 text-center">
                <Calendar className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No jobs today</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/jobs/new">Schedule one</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                {data.todayJobDetails.map((job) => {
                  const isLate = job.status === "PENDING" && isPast(parseISO(job.scheduledStart));
                  const config = statusConfig[job.status] || statusConfig.PENDING;
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex items-center gap-3 rounded-lg border border-transparent hover:border-border hover:bg-accent/40 p-2.5 transition-all -mx-2"
                    >
                      <div className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                        isLate ? "bg-red-100 text-red-600" : "bg-teal-50 text-teal-700"
                      )}>
                        {format(parseISO(job.scheduledStart), "HH")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{job.customer.name}</span>
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0", config.color)}>
                            {config.label}
                          </span>
                          {isLate && (
                            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 shrink-0">Late</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{format(parseISO(job.scheduledStart), "HH:mm")}</span>
                          {job.estimatedDuration && <span>· {job.estimatedDuration}m</span>}
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{job.customer.address}</span>
                          </span>
                        </div>
                        {job.assignments?.[0]?.worker && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {job.assignments.map(a => `${a.worker.firstName} ${a.worker.lastName}`).join(", ")}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Overdue */}
          {data?.overdueInvoices && data.overdueInvoices.length > 0 && (
            <Card className="rounded-xl border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  Overdue Invoices
                  <span className="ml-auto text-sm font-normal text-red-600">{eur(data.overdueInvoicesAmount)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {data.overdueInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between rounded-lg border border-red-100 hover:bg-red-50/50 p-2.5 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{inv.customerName}</p>
                      <p className="text-xs text-muted-foreground">Due since {format(new Date(inv.createdAt), "MMM d")}</p>
                    </div>
                    <span className="font-semibold text-sm text-red-700">{eur(inv.amount)}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Upcoming</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[240px] overflow-y-auto">
              {!data?.upcomingJobs?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No upcoming jobs</p>
              ) : (
                <div className="space-y-1.5">
                  {data.upcomingJobs.slice(0, 6).map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex items-center gap-3 rounded-lg hover:bg-accent/40 p-2.5 transition-all -mx-2"
                    >
                      <div className="w-12 text-right shrink-0">
                        <p className="text-xs font-medium">{format(parseISO(job.scheduledStart), "EEE")}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(job.scheduledStart), "d/M")}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{job.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(job.scheduledStart), "HH:mm")} · {job.workerNames.join(", ")}
                        </p>
                      </div>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", statusConfig[job.status]?.color)}>
                        {statusConfig[job.status]?.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" asChild className="justify-start h-auto py-3 flex-col gap-1">
              <Link href="/workers">
                <span className="text-lg font-bold">{data?.activeWorkers ?? 0}</span>
                <span className="text-[10px] text-muted-foreground">Workers</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start h-auto py-3 flex-col gap-1">
              <Link href="/customers">
                <span className="text-lg font-bold">{data?.totalCustomers ?? 0}</span>
                <span className="text-[10px] text-muted-foreground">Customers</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start h-auto py-3 flex-col gap-1">
              <Link href="/reports">
                <FileText className="h-4 w-4 mb-0.5" />
                <span className="text-[10px] text-muted-foreground">Reports</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
