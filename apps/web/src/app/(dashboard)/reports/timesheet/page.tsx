"use client";

import { useState } from "react";
import { useTimesheet } from "@/hooks/use-reports";
import { useWorkers } from "@/hooks/use-workers";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const tabs = [
  { href: "/reports/payroll", label: "Payroll" },
  { href: "/reports/vat", label: "VAT" },
  { href: "/reports/timesheet", label: "Timesheet" },
];

export default function TimesheetPage() {
  const pathname = usePathname();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [workerId, setWorkerId] = useState("");
  const { data: workers } = useWorkers();
  const { data, isLoading } = useTimesheet(workerId || undefined, from || undefined, to || undefined);

  const totalHours = data?.reduce((sum, t) => sum + t.hours, 0) ?? 0;
  const totalEarnings = data?.reduce((sum, t) => sum + t.earnings, 0) ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>

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
            <Label htmlFor="worker">Worker</Label>
            <select
              id="worker"
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
            >
              <option value="">All workers</option>
              {workers?.map((w) => (
                <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
              ))}
            </select>
          </div>
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-100 text-emerald-700 font-bold">€</div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold">{eur(totalEarnings)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Customer</th>
                    <th className="p-3 text-left font-medium">Date</th>
                    <th className="p-3 text-right font-medium">Hours</th>
                    <th className="p-3 text-right font-medium">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-3">{row.customerName}</td>
                      <td className="p-3">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="p-3 text-right">{row.hours.toFixed(1)}</td>
                      <td className="p-3 text-right">{eur(row.earnings)}</td>
                    </tr>
                  ))}
                  {(!data || data.length === 0) && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">
                        No timesheet data for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
