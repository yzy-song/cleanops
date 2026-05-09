"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { EarningsCard } from "@/components/worker/earnings-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

export default function WorkerTimesheetPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ["worker", "earnings", from, to],
    queryFn: async () => {
      const res = await api.get("/worker/me/earnings", { params: { from: from || undefined, to: to || undefined } });
      return res.data.data;
    },
  });

  const { data: timesheet, isLoading: timesheetLoading } = useQuery({
    queryKey: ["worker", "timesheet", from, to],
    queryFn: async () => {
      const res = await api.get("/report/timesheet", { params: { from: from || undefined, to: to || undefined } });
      return res.data.data;
    },
  });

  const totalHours = (earnings?.totalHours) || 0;
  const grossPay = (earnings?.totalEarnings) || 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Hours & Earnings</h1>
        <p className="text-sm text-muted-foreground">Track your time and pay</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-3 p-3">
          <div className="space-y-1 flex-1 min-w-[120px]">
            <Label htmlFor="from" className="text-xs">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1 flex-1 min-w-[120px]">
            <Label htmlFor="to" className="text-xs">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 text-sm" />
          </div>
        </CardContent>
      </Card>

      {earningsLoading ? (
        <Skeleton className="h-32" />
      ) : (
        <EarningsCard
          totalHours={totalHours}
          grossPay={grossPay}
          netPay={earnings?.totalEarnings}
          period={from ? `${from} — ${to || "now"}` : "All time"}
        />
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-medium">Recent entries</h2>
        {timesheetLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (timesheet || []).length > 0 ? (
          (timesheet || []).map((entry: any, i: number) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{entry.customerName}</p>
                  <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{eur(entry.earnings)}</p>
                <p className="text-xs text-muted-foreground">{entry.hours.toFixed(1)}h</p>
              </div>
            </div>
          ))
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No entries for this period</p>
        )}
      </div>
    </div>
  );
}
