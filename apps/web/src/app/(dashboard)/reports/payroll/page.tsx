"use client";

import { useState } from "react";
import { usePayroll } from "@/hooks/use-reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Euro, Users, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const tabs = [
  { href: "/reports/payroll", label: "Payroll" },
  { href: "/reports/vat", label: "VAT" },
  { href: "/reports/timesheet", label: "Timesheet" },
];

const CHART_COLORS = [
  "oklch(0.55 0.115 175)",
  "oklch(0.50 0.14 248)",
  "oklch(0.75 0.13 75)",
  "oklch(0.55 0.14 155)",
  "oklch(0.577 0.245 27.325)",
  "oklch(0.50 0.14 300)",
  "oklch(0.45 0.12 200)",
  "oklch(0.60 0.13 45)",
];

export default function PayrollPage() {
  const pathname = usePathname();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading } = usePayroll(from || undefined, to || undefined);

  const chartData = (data?.payroll ?? []).map((row, i) => ({
    name: row.workerName,
    gross: row.grossPay / 100,
    net: row.netPay / 100,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const totalHours = (data?.payroll ?? []).reduce((s, r) => s + r.totalHours, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Payroll, VAT, and worker analytics</p>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              pathname.startsWith(tab.href)
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-4 p-4">
          <div className="space-y-1">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-3">
            <Card className="rounded-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                  <Euro className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Gross Pay</p>
                  <p className="text-xl font-bold">{eur(data?.totals?.grossPay ?? 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Hours</p>
                  <p className="text-xl font-bold">{totalHours.toFixed(1)}h</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Rate</p>
                  <p className="text-xl font-bold">
                    {data?.payroll?.length
                      ? eur(Math.round(data.payroll.reduce((s, r) => s + (r.grossPay / Math.max(r.totalHours, 0.1)), 0) / data.payroll.length))
                      : "—"}
                    /hr
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Worker Earnings Bar Chart */}
          {chartData.length > 0 && (
            <Card className="rounded-xl bg-muted/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Worker Earnings Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 48)}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 4, left: 0, right: 20, bottom: 0 }} style={{ background: "transparent" }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(1 0 0 / 0.06)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "oklch(0.65 0.02 240)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "oklch(0.65 0.02 240)" }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.25 0.02 180 / 0.96)", color: "oklch(0.92 0.01 175)", borderRadius: "0.75rem", border: "1px solid oklch(1 0 0 / 0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.35)", fontSize: "13px" }}
                      formatter={(value: any) => [`€${Number(value).toFixed(2)}`, "Gross Pay"]}
                    />
                    <Bar dataKey="gross" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
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
                      <th className="p-3 text-left font-medium">Worker</th>
                      <th className="p-3 text-right font-medium">Hours</th>
                      <th className="p-3 text-right font-medium">Rate/hr</th>
                      <th className="p-3 text-right font-medium">Gross</th>
                      <th className="p-3 text-right font-medium">Pension</th>
                      <th className="p-3 text-right font-medium">PRSI est.</th>
                      <th className="p-3 text-right font-medium">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.payroll ?? []).map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{row.workerName}</td>
                        <td className="p-3 text-right">{row.totalHours.toFixed(1)}</td>
                        <td className="p-3 text-right">{eur(row.hourlyRate)}</td>
                        <td className="p-3 text-right">{eur(row.grossPay)}</td>
                        <td className="p-3 text-right">{eur(row.pensionAmount)}</td>
                        <td className="p-3 text-right">{eur(row.prsiEstimate)}</td>
                        <td className="p-3 text-right font-semibold">{eur(row.netPay)}</td>
                      </tr>
                    ))}
                    {(!data?.payroll || data.payroll.length === 0) && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">No payroll data for this period</td>
                      </tr>
                    )}
                  </tbody>
                  {data?.totals && data.payroll?.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 bg-muted/30 font-semibold">
                        <td className="p-3">Total</td>
                        <td className="p-3 text-right">{totalHours.toFixed(1)}</td>
                        <td />
                        <td className="p-3 text-right">{eur(data.totals.grossPay)}</td>
                        <td className="p-3 text-right">{eur(data.totals.pensionAmount)}</td>
                        <td className="p-3 text-right">{eur(data.totals.prsiEstimate)}</td>
                        <td className="p-3 text-right">{eur(data.totals.netPay)}</td>
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
