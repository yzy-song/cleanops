"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 29,
    yearlyPrice: 290,
    description: "For independent cleaners just getting started",
    features: [
      "Up to 5 workers",
      "Job scheduling & calendar",
      "Customer management",
      "Basic invoicing",
      "WhatsApp notifications",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    monthlyPrice: 69,
    yearlyPrice: 690,
    description: "For growing cleaning companies",
    features: [
      "Up to 20 workers",
      "Everything in Starter",
      "GPS check-in / check-out",
      "Payroll & VAT reports",
      "Customer self-service portal",
      "Deposit management",
      "Unlimited customers",
    ],
    highlight: true,
  },
  {
    name: "Business",
    monthlyPrice: 129,
    yearlyPrice: 1290,
    description: "For established cleaning businesses",
    features: [
      "Unlimited workers",
      "Everything in Pro",
      "Priority support",
      "API access",
      "Xero integration (coming soon)",
      "Custom onboarding",
    ],
    highlight: false,
  },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            Simple pricing for your cleaning business
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All plans include a 14-day free trial. No credit card required.
            Upgrade, downgrade, or cancel anytime.
          </p>

          <div className="inline-flex items-center gap-3 mt-6">
            <span className={!yearly ? "font-semibold" : "text-muted-foreground"}>
              Monthly
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              onClick={() => setYearly(!yearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                yearly ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  yearly ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={yearly ? "font-semibold" : "text-muted-foreground"}>
              Yearly <span className="text-sm text-emerald-600 font-medium">Save 2 months</span>
            </span>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlight ? "border-primary shadow-lg ring-1 ring-primary" : ""}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.highlight && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">
                      Popular
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold">
                    €{yearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">
                    /{yearly ? "yr" : "mo"}
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button className="w-full" variant={plan.highlight ? "default" : "outline"} asChild>
                  <Link href="/register">Start Free Trial</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
