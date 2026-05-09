"use client";

import { useSubscription, useCreateCheckout, useCreatePortal } from "@/hooks/use-billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const planLabels: Record<string, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  BUSINESS: "Business",
};

export default function BillingPage() {
  const { data: sub, isLoading } = useSubscription();
  const checkout = useCreateCheckout();
  const portal = useCreatePortal();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription activated! Welcome aboard.");
    }
  }, [searchParams]);

  const handleUpgrade = async (plan: string) => {
    try {
      const result = await checkout.mutateAsync({ plan });
      window.location.href = result.url;
    } catch (err: any) {
      toast.error(err?.message || "Failed to start checkout");
    }
  };

  const handleManage = async () => {
    try {
      const result = await portal.mutateAsync();
      window.location.href = result.url;
    } catch (err: any) {
      toast.error(err?.message || "Failed to open billing portal");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const isTrialing = sub?.status === "TRIALING";
  const isActive = sub?.status === "ACTIVE";
  const trialDays = sub?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Billing</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTrialing && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-center gap-2 text-blue-800 font-medium">
                <CheckCircle className="h-4 w-4" />
                Free Trial — {trialDays} day{trialDays !== 1 ? "s" : ""} remaining
              </div>
              <p className="text-sm text-blue-600 mt-1">
                You are enjoying full Pro features. No credit card required.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => handleUpgrade("PRO")} disabled={checkout.isPending}>
                  {checkout.isPending ? "Redirecting..." : "Upgrade to Pro"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleUpgrade("BUSINESS")} disabled={checkout.isPending}>
                  Upgrade to Business
                </Button>
              </div>
            </div>
          )}

          {isActive && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <CheckCircle className="h-4 w-4" />
                {planLabels[sub?.plan || ""] || sub?.plan} Plan — Active
              </div>
              <p className="text-sm text-emerald-600 mt-1">
                {sub?.subscriptionEndsAt
                  ? `Next billing: ${new Date(sub.subscriptionEndsAt).toLocaleDateString()}`
                  : ""}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={handleManage}
                disabled={portal.isPending}
              >
                {portal.isPending ? "Redirecting..." : "Manage Billing"}
              </Button>
            </div>
          )}

          {sub?.status === "PAST_DUE" && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex items-center gap-2 text-red-800 font-medium">
                <AlertCircle className="h-4 w-4" />
                Payment Past Due
              </div>
              <p className="text-sm text-red-600 mt-1">
                Please update your payment method to continue using CleanOps.
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={handleManage}
                disabled={portal.isPending}
              >
                Update Payment Method
              </Button>
            </div>
          )}

          {sub?.status === "CANCELLED" || sub?.status === "NONE" && !isTrialing && (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
              <div className="flex items-center gap-2 text-yellow-800 font-medium">
                <AlertCircle className="h-4 w-4" />
                No Active Subscription
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                Choose a plan to continue using CleanOps.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => handleUpgrade("STARTER")} disabled={checkout.isPending}>
                  Starter — €29/mo
                </Button>
                <Button size="sm" onClick={() => handleUpgrade("PRO")} disabled={checkout.isPending}>
                  Pro — €69/mo
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleUpgrade("BUSINESS")} disabled={checkout.isPending}>
                  Business — €129/mo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
