"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, ArrowLeft } from "lucide-react";
import Link from "next/link";

const eur = (v: number) => `€${v.toFixed(0)}`;

export default function StartupCostCalculator() {
  const [equipment, setEquipment] = useState(1500);
  const [vehicle, setVehicle] = useState(3000);
  const [insurance, setInsurance] = useState(800);
  const [licenses, setLicenses] = useState(300);
  const [marketing, setMarketing] = useState(500);
  const [website, setWebsite] = useState(200);
  const [working, setWorking] = useState(2000);
  const [training, setTraining] = useState(400);

  const oneTime = equipment + vehicle + insurance + licenses + training;
  const monthly = marketing + website + working;
  const months = [1, 2, 3, 4, 5, 6];
  const projection = months.map((m) => {
    const cumulative = oneTime + monthly * m;
    return { month: m, cumulative, needed: cumulative > 0 ? cumulative : 0 };
  });

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Tools
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <Rocket className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Startup Cost Calculator</h1>
            <p className="text-sm text-slate-500">Estimate what it takes to start a cleaning business</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm font-medium text-slate-700">One-Time Costs</p>
            <Field label="Equipment & Supplies" value={equipment} onChange={setEquipment} />
            <Field label="Vehicle / Transport" value={vehicle} onChange={setVehicle} />
            <Field label="Insurance (Annual)" value={insurance} onChange={setInsurance} />
            <Field label="Licenses & Registration" value={licenses} onChange={setLicenses} />
            <Field label="Training & Certification" value={training} onChange={setTraining} />
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-slate-700">Monthly Costs</p>
            </div>
            <Field label="Marketing & Advertising" value={marketing} onChange={setMarketing} />
            <Field label="Website & Software" value={website} onChange={setWebsite} />
            <Field label="Working Capital Buffer" value={working} onChange={setWorking} />
          </CardContent>
        </Card>

        <Card className="mb-6 bg-slate-50">
          <CardContent className="pt-6 space-y-2">
            <Row label="One-Time Startup Cost" value={eur(oneTime)} bold />
            <Row label="Monthly Running Cost" value={eur(monthly)} />
            <div className="border-t pt-2">
              <Row label="6-Month Total Required" value={eur(oneTime + monthly * 6)} bold />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium mb-4">6-Month Cash Projection</p>
            <div className="space-y-2">
              {projection.map((p) => (
                <div key={p.month} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-16">Month {p.month}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-orange-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (p.cumulative / projection[5].cumulative) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-20 text-right">{eur(p.cumulative)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm shrink-0">{label}</Label>
      <Input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="w-32 text-right" />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? "font-semibold" : "text-slate-600"}>{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
