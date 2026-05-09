"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Euro } from "lucide-react";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

interface EarningsCardProps {
  totalHours: number;
  grossPay: number;
  pensionAmount?: number;
  netPay?: number;
  period?: string;
}

export function EarningsCard({ totalHours, grossPay, pensionAmount, netPay, period }: EarningsCardProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {period || "This period"}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
            <Euro className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold">{eur(grossPay)}</p>
          <p className="text-xs text-muted-foreground">{totalHours.toFixed(1)} hours</p>
        </div>
        {(pensionAmount !== undefined || netPay !== undefined) && (
          <div className="space-y-1 border-t pt-2 text-sm">
            {pensionAmount !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pension (1.5%)</span>
                <span>-{eur(pensionAmount)}</span>
              </div>
            )}
            {netPay !== undefined && (
              <div className="flex justify-between font-medium">
                <span>Net</span>
                <span>{eur(netPay)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
