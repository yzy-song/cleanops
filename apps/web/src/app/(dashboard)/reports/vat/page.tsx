"use client";

import { useState } from "react";
import { useVatReport } from "@/hooks/use-reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2, Home, ReceiptText, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const tabs = [
  { href: "/reports/payroll", label: "Payroll" },
  { href: "/reports/vat", label: "VAT" },
  { href: "/reports/timesheet", label: "Timesheet" },
];

const DONUT_COLORS = [
  "oklch(0.55 0.115 175)",  // teal
  "oklch(0.50 0.14 248)",   // blue
];

export default function VatPage() {
  const pathname = usePathname();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading } = useVatReport(from || undefined, to || undefined);

  const pieData = data ? [
    { name: "Residential (13.5%)", value: data.residential.amountTotal, color: DONUT_COLORS[0] },
    { name: "Commercial (23%)", value: data.commercial.amountTotal, color: DONUT_COLORS[1] },
  ] : [];

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
        </div>
      ) : data ? (
        <>
          {/* KPI */}
          <div className="grid gap-4 grid-cols-3">
            <Card className="rounded-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <ReceiptText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total VAT Due</p>
                  <p className="text-xl font-bold">{eur(data.totalVatLiability)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold">{eur(data.totalRevenue)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Commercial Share</p>
                  <p className="text-xl font-bold">
                    {data.totalRevenue > 0
                      ? `${Math.round((data.commercial.amountTotal / data.totalRevenue) * 100)}%`
                      : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Donut Chart */}
            <Card className="rounded-xl md:col-span-1 bg-muted/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">VAT Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.every(d => d.value === 0) ? (
                  <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">No data</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart style={{ background: "transparent" }}>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "oklch(0.25 0.02 180 / 0.96)", color: "oklch(0.92 0.01 175)", borderRadius: "0.75rem", border: "1px solid oklch(1 0 0 / 0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.35)", fontSize: "13px" }} formatter={(value: any) => [eur(Number(value)), ""]} />
                        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-around text-sm mt-1">
                      <div className="text-center">
                        <p className="font-bold text-teal-600">{eur(data.residential.vatTotal)}</p>
                        <p className="text-xs text-muted-foreground">Res. VAT</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-blue-600">{eur(data.commercial.vatTotal)}</p>
                        <p className="text-xs text-muted-foreground">Comm. VAT</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Detail Cards */}
            <div className="space-y-4 md:col-span-2">
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Home className="h-4 w-4 text-teal-600" />
                    Residential · 13.5% VAT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="font-medium">{eur(data.residential.amountTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">VAT Amount</span>
                    <span className="font-medium text-teal-700">{eur(data.residential.vatTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Invoices</span>
                    <span className="font-medium">{data.residential.count}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Commercial · 23% VAT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="font-medium">{eur(data.commercial.amountTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">VAT Amount</span>
                    <span className="font-medium text-blue-700">{eur(data.commercial.vatTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Invoices</span>
                    <span className="font-medium">{data.commercial.count}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
