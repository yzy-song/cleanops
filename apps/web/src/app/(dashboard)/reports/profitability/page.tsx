"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfitability } from "@/hooks/use-reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Euro, TrendingUp, Users, DollarSign } from "lucide-react";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, parseISO } from "date-fns";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const tabs = [
  { href: "/reports/payroll", label: "Payroll" },
  { href: "/reports/vat", label: "VAT" },
  { href: "/reports/timesheet", label: "Timesheet" },
  { href: "/reports/profitability", label: "Profitability" },
];

const CHART_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

export default function ProfitabilityPage() {
  const pathname = usePathname();
  useRoleGuard(["ADMIN", "MANAGER"]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading } = useProfitability(from || undefined, to || undefined);

  const chartData = (data?.jobs ?? []).map((j) => ({
    name: j.customer,
    revenue: j.revenue / 100,
    profit: j.grossProfit / 100,
    labor: j.laborCost / 100,
  }));

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Profitability, payroll, VAT, and worker analytics</p>
      </div>

      <div className="flex gap-1 border-b flex-wrap">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              pathname.startsWith(tab.href) ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-4 p-4">
          <div className="space-y-1"><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="space-y-1"><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-4">{[1,2,3,4].map(i=><Skeleton key={i} className="h-24 rounded-xl"/>)}</div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="rounded-xl"><CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100"><Euro className="h-5 w-5 text-emerald-600"/></div>
              <div><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-xl font-bold">{eur(s?.totalRevenue ?? 0)}</p></div>
            </CardContent></Card>
            <Card className="rounded-xl"><CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100"><DollarSign className="h-5 w-5 text-red-600"/></div>
              <div><p className="text-xs text-muted-foreground">Labor Cost</p><p className="text-xl font-bold">{eur(s?.totalLaborCost ?? 0)}</p></div>
            </CardContent></Card>
            <Card className="rounded-xl"><CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100"><TrendingUp className="h-5 w-5 text-blue-600"/></div>
              <div><p className="text-xs text-muted-foreground">Gross Profit</p><p className="text-xl font-bold">{eur(s?.totalGrossProfit ?? 0)}</p></div>
            </CardContent></Card>
            <Card className="rounded-xl"><CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100"><Users className="h-5 w-5 text-purple-600"/></div>
              <div><p className="text-xs text-muted-foreground">Margin</p><p className="text-xl font-bold">{s?.totalMargin ?? 0}%</p></div>
            </CardContent></Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card className="rounded-xl">
              <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Revenue vs Profit by Job</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 4, left: 0, right: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(1 0 0 / 0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `€${v}`} />
                    <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: "13px" }} formatter={((v: number) => [`€${v.toFixed(2)}`, ""]) as any} />
                    <Bar dataKey="revenue" fill="#4f46e5" radius={[4,4,0,0]} maxBarSize={40} name="Revenue" />
                    <Bar dataKey="profit" fill="#10b981" radius={[4,4,0,0]} maxBarSize={40} name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card className="rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Customer</th>
                      <th className="p-3 text-right font-medium">Revenue</th>
                      <th className="p-3 text-right font-medium">Labor</th>
                      <th className="p-3 text-right font-medium">Profit</th>
                      <th className="p-3 text-right font-medium">Margin</th>
                      <th className="p-3 text-right font-medium">Workers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.jobs ?? []).map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">
                          <Link href={`/jobs/${row.jobId}`} className="hover:underline">{row.customer}</Link>
                          <p className="text-xs text-muted-foreground">{row.date ? format(parseISO(row.date), "dd/MM/yyyy") : ""}</p>
                        </td>
                        <td className="p-3 text-right">{eur(row.revenue)}</td>
                        <td className="p-3 text-right text-red-600">{eur(row.laborCost)}</td>
                        <td className={cn("p-3 text-right font-semibold", row.grossProfit >= 0 ? "text-emerald-600" : "text-red-600")}>{eur(row.grossProfit)}</td>
                        <td className="p-3 text-right">{row.margin}%</td>
                        <td className="p-3 text-right text-xs">{row.workers}</td>
                      </tr>
                    ))}
                  </tbody>
                  {s && (data?.jobs?.length ?? 0) > 0 && (
                    <tfoot>
                      <tr className="border-t-2 bg-muted/30 font-semibold">
                        <td className="p-3">{s.totalJobs} jobs · {s.totalHours.toFixed(1)}h</td>
                        <td className="p-3 text-right">{eur(s.totalRevenue)}</td>
                        <td className="p-3 text-right text-red-600">{eur(s.totalLaborCost)}</td>
                        <td className="p-3 text-right text-emerald-600">{eur(s.totalGrossProfit)}</td>
                        <td className="p-3 text-right">{s.totalMargin}%</td>
                        <td className="p-3 text-right text-xs">avg {eur(s.avgRevenuePerJob)}/job</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
