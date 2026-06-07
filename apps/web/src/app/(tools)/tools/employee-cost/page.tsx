"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, ArrowLeft } from "lucide-react";
import Link from "next/link";

const eur = (v: number) => `€${v.toFixed(2)}`;
const eurm = (v: number) => `€${v.toFixed(2)}/mo`;

export default function EmployeeCostCalculator() {
  const [wage, setWage] = useState(14.5);
  const [hoursPerWeek, setHoursPerWeek] = useState(35);
  const [weeksPerYear, setWeeksPerYear] = useState(48);
  const [prsiRate, setPrsiRate] = useState(11.15);
  const [pensionRate, setPensionRate] = useState(1.5);
  const [equipmentMonth, setEquipmentMonth] = useState(50);
  const [insurancePerYear, setInsurancePerYear] = useState(500);
  const [adminOverhead, setAdminOverhead] = useState(100);

  const grossMonthly = (wage * hoursPerWeek * weeksPerYear) / 12;
  const prsiMonthly = (grossMonthly * prsiRate) / 100;
  const pensionMonthly = (grossMonthly * pensionRate) / 100;
  const insuranceMonthly = insurancePerYear / 12;
  const totalMonthly = grossMonthly + prsiMonthly + pensionMonthly + equipmentMonth + insuranceMonthly + adminOverhead;
  const totalYearly = totalMonthly * 12;
  const effectiveHourly = totalMonthly / (hoursPerWeek * weeksPerYear / 12);

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Tools
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <DollarSign className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Employee Cost Calculator</h1>
            <p className="text-sm text-slate-700">True cost per cleaner — wages + PRSI + pension + extras</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <Field label="Hourly Wage (€)" value={wage} onChange={setWage} step={0.5} />
            <Field label="Hours per Week" value={hoursPerWeek} onChange={setHoursPerWeek} />
            <Field label="Working Weeks per Year" value={weeksPerYear} onChange={setWeeksPerYear} />
            <Field label="Employer PRSI Rate (%)" value={prsiRate} onChange={setPrsiRate} step={0.1} />
            <Field label="Pension Contribution (%)" value={pensionRate} onChange={setPensionRate} step={0.1} />
            <Field label="Equipment & Supplies (€/mo)" value={equipmentMonth} onChange={setEquipmentMonth} />
            <Field label="Insurance (€/year)" value={insurancePerYear} onChange={setInsurancePerYear} />
            <Field label="Admin & Overhead (€/mo)" value={adminOverhead} onChange={setAdminOverhead} />
          </CardContent>
        </Card>

        <Card className="bg-slate-50">
          <CardContent className="pt-6 space-y-3">
            <Row label="Gross Monthly Pay" value={eur(grossMonthly)} />
            <Row label="Employer PRSI" value={eurm(prsiMonthly)} dim />
            <Row label="Pension" value={eurm(pensionMonthly)} dim />
            <Row label="Equipment" value={eurm(equipmentMonth)} dim />
            <Row label="Insurance" value={eurm(insuranceMonthly)} dim />
            <Row label="Admin Overhead" value={eurm(adminOverhead)} dim />
            <div className="border-t pt-3 space-y-1">
              <Row label="True Monthly Cost" value={eur(totalMonthly)} bold />
              <Row label="True Yearly Cost" value={eur(totalYearly)} bold />
              <p className="text-xs text-slate-700 mt-1">
                Effective hourly cost: {eur(effectiveHourly)}/hr — {((effectiveHourly / wage - 1) * 100).toFixed(0)}% above base wage
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm shrink-0">{label}</Label>
      <Input type="number" min={0} step={step || 1} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="w-32 text-right" />
    </div>
  );
}

function Row({ label, value, dim, bold }: { label: string; value: string; dim?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? "font-semibold" : dim ? "text-slate-700" : "text-slate-700"}>{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
