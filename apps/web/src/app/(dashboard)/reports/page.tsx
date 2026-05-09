"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ReceiptText, Clock } from "lucide-react";

const items = [
  {
    href: "/reports/payroll",
    icon: DollarSign,
    title: "Payroll",
    desc: "Per-worker wages, pension, PRSI, and net pay summary.",
  },
  {
    href: "/reports/vat",
    icon: ReceiptText,
    title: "VAT Report",
    desc: "Residential (13.5%) vs commercial (23%) VAT breakdown.",
  },
  {
    href: "/reports/timesheet",
    icon: Clock,
    title: "Timesheet",
    desc: "Hours worked and earnings per worker and customer.",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full cursor-pointer transition-colors hover:border-primary/50 hover:shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <item.icon className="h-5 w-5 text-primary" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
