"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, ArrowLeft } from "lucide-react";
import Link from "next/link";

const eur = (v: number) => `€${v.toFixed(2)}`;

export default function ProfitMarginCalculator() {
  const [price, setPrice] = useState(120);
  const [labor, setLabor] = useState(50);
  const [supplies, setSupplies] = useState(10);
  const [travel, setTravel] = useState(5);
  const [insurance, setInsurance] = useState(3);
  const [other, setOther] = useState(0);

  const totalCost = labor + supplies + travel + insurance + other;
  const profit = price - totalCost;
  const margin = price > 0 ? ((profit / price) * 100) : 0;
  const isHealthy = margin >= 30;

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Tools
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <Calculator className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Profit Margin Calculator</h1>
            <p className="text-sm text-slate-700">See your true profit per job</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <Field label="Job Price (€)" value={price} onChange={setPrice} />
            <Field label="Labor Cost (€)" value={labor} onChange={setLabor} />
            <Field label="Cleaning Supplies (€)" value={supplies} onChange={setSupplies} />
            <Field label="Travel Cost (€)" value={travel} onChange={setTravel} />
            <Field label="Insurance per Job (€)" value={insurance} onChange={setInsurance} />
            <Field label="Other Costs (€)" value={other} onChange={setOther} />
          </CardContent>
        </Card>

        <Card className="bg-slate-50">
          <CardContent className="pt-6 space-y-3">
            <Row label="Total Revenue" value={eur(price)} />
            <Row label="Total Costs" value={eur(totalCost)} />
            <Row label="Net Profit" value={eur(profit)} bold />
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Profit Margin</span>
                <span className={`text-xl font-bold ${isHealthy ? "text-emerald-600" : "text-amber-600"}`}>
                  {margin.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1">
                {isHealthy ? "✅ Healthy margin (≥30%)" : "⚠️ Below target — consider adjusting pricing or reducing costs"}
              </p>
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
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-32 text-right"
      />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? "font-semibold" : "text-slate-700"}>{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
