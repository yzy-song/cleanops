"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TrendingUp, ArrowLeft, Clock, CreditCard, Receipt } from "lucide-react";
import Link from "next/link";

const eur = (v: number) => `€${v.toFixed(0)}`;

export default function RoiCalculator() {
  const [clients, setClients] = useState(30);
  const [avgJobValue, setAvgJobValue] = useState(80);
  const [adminHours, setAdminHours] = useState(15);
  const [hourlyAdminCost, setHourlyAdminCost] = useState(22);

  const result = useMemo(() => {
    const timeSavedHrs = adminHours * 0.75; // 75% time saved
    const adminCostSaved = timeSavedHrs * hourlyAdminCost * 4; // per month
    const revenueUplift = clients * avgJobValue * 0.1 * 12; // 10% more jobs
    const paymentRecovery = clients * avgJobValue * 0.03 * 12; // 3% fewer unpaid
    const total = adminCostSaved * 12 + revenueUplift + paymentRecovery;
    return { timeSavedHrs: timeSavedHrs.toFixed(1), adminCostSaved, revenueUplift: revenueUplift.toFixed(0), paymentRecovery: paymentRecovery.toFixed(0), total: total.toFixed(0) };
  }, [clients, avgJobValue, adminHours, hourlyAdminCost]);

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Tools
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Software ROI Calculator</h1>
            <p className="text-sm text-slate-700">See how much you save by switching to CleanOps</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm">Active Clients: {clients}</Label>
              <input type="range" min={5} max={200} value={clients} onChange={(e) => setClients(Number(e.target.value))} className="w-full" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Avg Job Value: €{avgJobValue}</Label>
              <input type="range" min={30} max={300} value={avgJobValue} onChange={(e) => setAvgJobValue(Number(e.target.value))} className="w-full" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Admin Hours/Week: {adminHours}h</Label>
              <input type="range" min={5} max={60} value={adminHours} onChange={(e) => setAdminHours(Number(e.target.value))} className="w-full" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Hourly Admin Cost: €{hourlyAdminCost}</Label>
              <input type="range" min={10} max={50} value={hourlyAdminCost} onChange={(e) => setHourlyAdminCost(Number(e.target.value))} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm font-medium text-purple-800">Estimated Annual Benefit</p>
            <p className="text-4xl font-bold text-purple-900">{eur(Number(result.total))}/year</p>
            <div className="space-y-2 pt-2">
              <Row icon={<Clock className="h-4 w-4" />} label="Time Saved" value={`${result.timeSavedHrs} hrs/week`} />
              <Row icon={<TrendingUp className="h-4 w-4" />} label="Revenue Uplift" value={eur(Number(result.revenueUplift))} />
              <Row icon={<CreditCard className="h-4 w-4" />} label="Payment Recovery" value={eur(Number(result.paymentRecovery))} />
              <Row icon={<Receipt className="h-4 w-4" />} label="Admin Cost Saved" value={eur(Number(result.adminCostSaved) * 12)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm py-1 border-b border-purple-100 last:border-0">
      <span className="flex items-center gap-2 text-purple-700">{icon}{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
