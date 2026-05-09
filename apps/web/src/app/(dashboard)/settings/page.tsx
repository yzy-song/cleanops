"use client";

import { useState, useEffect } from "react";
import { useCompany, useUpdateCompany, useStripeConnectStatus } from "@/hooks/use-company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Link2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { data: company, isLoading } = useCompany();
  const updateCompany = useUpdateCompany();
  const { data: connectStatus, isLoading: connectLoading, refetch: refetchStatus } = useStripeConnectStatus();
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const stripeResult = searchParams.get("stripe");
    if (stripeResult === "success") {
      toast.success("Stripe account connected successfully!");
      refetchStatus();
    } else if (stripeResult === "error") {
      toast.error("Failed to connect Stripe account. Please try again.");
    }
  }, [searchParams, refetchStatus]);

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      const res = await api.get("/company/stripe/connect");
      window.location.href = res.data.data.url;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to start Stripe connection");
      setConnecting(false);
    }
  };

  const [form, setForm] = useState({
    name: "",
    vatNumber: "",
    baseHourlyRate: "",
    pensionEnrollment: false,
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || "",
        vatNumber: company.vatNumber || "",
        baseHourlyRate: ((company.baseHourlyRate || 0) / 100).toFixed(2),
        pensionEnrollment: company.pensionEnrollment ?? false,
      });
    }
  }, [company]);

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCompany.mutateAsync({
        name: form.name,
        vatNumber: form.vatNumber || undefined,
        baseHourlyRate: Math.round(parseFloat(form.baseHourlyRate) * 100) || undefined,
        pensionEnrollment: form.pensionEnrollment,
      });
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" />
            <Link href="/settings/billing" className="hover:underline">Billing & Subscription</Link>
          </CardTitle>
          <CardDescription>Manage your plan, payment methods, and billing history</CardDescription>
        </CardHeader>
      </Card>

      {/* Stripe Connect */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-5 w-5" />
            Stripe Connect
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to receive payments directly from customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : connectStatus?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {connectStatus.status === "enabled" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="font-medium">
                  {connectStatus.status === "enabled"
                    ? "Connected"
                    : connectStatus.status === "restricted"
                    ? "Needs Attention"
                    : "Pending"}
                </span>
                {connectStatus.email && (
                  <span className="text-muted-foreground">· {connectStatus.email}</span>
                )}
              </div>
              {connectStatus.status === "restricted" && (
                <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md p-2">
                  Your Stripe account has verification requirements. Please check your Stripe dashboard.
                </p>
              )}
              <Button variant="outline" size="sm" onClick={handleConnectStripe} disabled={connecting}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                {connecting ? "Redirecting..." : "Reconnect Stripe Account"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Customers pay you directly via Stripe. CleanOps takes a 1% platform fee.
              </p>
              <Button onClick={handleConnectStripe} disabled={connecting}>
                {connecting ? "Redirecting..." : "Connect Stripe Account"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Manage your company profile</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company name</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">VAT number</Label>
              <Input id="vatNumber" value={form.vatNumber} onChange={(e) => set("vatNumber", e.target.value)} placeholder="IE1234567W" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Default hourly rate (EUR)</Label>
              <Input id="rate" type="number" min="14.80" step="0.01" value={form.baseHourlyRate} onChange={(e) => set("baseHourlyRate", e.target.value)} required />
              <p className="text-xs text-muted-foreground">Used when a worker has no custom rate. ERO minimum: €14.80/hr</p>
            </div>

            <hr />

            <CardTitle className="text-base">Compliance</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                id="pension"
                checked={form.pensionEnrollment}
                onCheckedChange={(v) => set("pensionEnrollment", !!v)}
              />
              <Label htmlFor="pension" className="text-sm">Auto-enrolment pension (1.5% contribution)</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Ireland&apos;s Auto-Enrolment Retirement Savings System (2026). If enrolled, 1.5% is added to all invoices.
            </p>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={updateCompany.isPending}>
                {updateCompany.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
