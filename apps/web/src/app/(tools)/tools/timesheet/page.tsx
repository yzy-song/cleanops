"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TimesheetCalculator() {
  const [rate, setRate] = useState(14.5);
  const [overtimeRate, setOvertimeRate] = useState(21.75);
  const [hours, setHours] = useState<Record<string, string>>(
    Object.fromEntries(DAYS.map((d) => [d, d === "Sat" || d === "Sun" ? "" : "8"]))
  );

  const results = useMemo(() => {
    let regularHours = 0;
    let overtimeHours = 0;
    DAYS.forEach((d) => {
      const h = parseFloat(hours[d]) || 0;
      if (h > 8) { regularHours += 8; overtimeHours += h - 8; }
      else regularHours += h;
    });
    return {
      regular: regularHours,
      overtime: overtimeHours,
      total: regularHours + overtimeHours,
      regularPay: regularHours * rate,
      overtimePay: overtimeHours * overtimeRate,
      grossPay: regularHours * rate + overtimeHours * overtimeRate,
    };
  }, [hours, rate, overtimeRate]);

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Tools
        </Link>
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
              <Clock className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Timesheet Calculator</h1>
              <p className="text-sm text-slate-700 dark:text-slate-300">Track employee hours, overtime, and pay</p>
            </div>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-xs">Regular Rate (€/hr)</Label>
                <Input type="number" step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Overtime Rate (€/hr)</Label>
                <Input type="number" step={0.5} value={overtimeRate} onChange={(e) => setOvertimeRate(Number(e.target.value) || 0)} className="mt-1" />
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Day</th>
                  <th className="text-right py-2 font-medium">Hours</th>
                  <th className="text-right py-2 font-medium">Regular</th>
                  <th className="text-right py-2 font-medium">Overtime</th>
                  <th className="text-right py-2 font-medium">Pay</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d) => {
                  const h = parseFloat(hours[d]) || 0;
                  const reg = Math.min(h, 8);
                  const ot = Math.max(0, h - 8);
                  return (
                    <tr key={d} className="border-b last:border-0">
                      <td className="py-2 font-medium">{d}</td>
                      <td className="py-2 text-right">
                        <Input type="number" min={0} max={24} step={0.5} value={hours[d]} onChange={(e) => setHours({ ...hours, [d]: e.target.value })} className="w-16 text-right inline-block" />
                      </td>
                      <td className="py-2 text-right text-slate-700">{reg}</td>
                      <td className="py-2 text-right text-slate-700">{ot || "-"}</td>
                      <td className="py-2 text-right">€{(reg * rate + ot * overtimeRate).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-semibold border-t-2">
                  <td className="py-2">Totals</td>
                  <td className="py-2 text-right">{results.total}</td>
                  <td className="py-2 text-right">{results.regular}</td>
                  <td className="py-2 text-right">{results.overtime}</td>
                  <td className="py-2 text-right">€{results.grossPay.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
