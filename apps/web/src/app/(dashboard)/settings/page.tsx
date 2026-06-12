"use client";

import { useState, useEffect, useRef } from "react";
import { useCompany, useUpdateCompany, useStripeStatus, useSaveStripeKey, useDisconnectStripe, useXeroConnectionStatus, useConnectXeroUrl, useDisconnectXero } from "@/hooks/use-company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Link2, CheckCircle2, ExternalLink, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useRoleGuard } from "@/hooks/use-role-guard";

export default function SettingsPage() {
  const { data: company, isLoading } = useCompany();
  useRoleGuard(["ADMIN", "MANAGER"]);
  const updateCompany = useUpdateCompany();
  const { data: stripeStatus, isLoading: stripeLoading, refetch: refetchStripe } = useStripeStatus();
  const saveStripeKey = useSaveStripeKey();
  const disconnectStripe = useDisconnectStripe();
  const { data: xeroStatus, isLoading: xeroLoading, refetch: refetchXero } = useXeroConnectionStatus();
  const { refetch: fetchXeroUrl } = useConnectXeroUrl();
  const disconnectXero = useDisconnectXero();
  const searchParams = useSearchParams();
  const [stripeKey, setStripeKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [connectingXero, setConnectingXero] = useState(false);
  const xeroToastShown = useRef(false);

  useEffect(() => {
    const xeroResult = searchParams.get("xero");
    if (xeroResult === "success" && !xeroToastShown.current) {
      xeroToastShown.current = true;
      toast.success("Xero account connected successfully!");
      refetchXero();
    } else if (xeroResult === "error" && !xeroToastShown.current) {
      xeroToastShown.current = true;
      const msg = searchParams.get("message");
      toast.error(msg || "Failed to connect Xero. Please try again.");
    }
  }, [searchParams, refetchXero]);

  const handleSaveStripeKey = async () => {
    if (!stripeKey.trim()) return;
    setSavingKey(true);
    try {
      const result = await saveStripeKey.mutateAsync(stripeKey.trim());
      if (result.success) {
        toast.success("Stripe key saved");
        setStripeKey("");
        refetchStripe();
      } else {
        toast.error(result.message || "Invalid key");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save Stripe key");
    } finally {
      setSavingKey(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!confirm("Remove Stripe key? Payment links will stop working.")) return;
    try {
      await disconnectStripe.mutateAsync();
      toast.success("Stripe key removed");
      refetchStripe();
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleConnectXero = async () => {
    setConnectingXero(true);
    try {
      const result = await fetchXeroUrl();
      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        toast.error("Failed to get Xero authorization URL");
        setConnectingXero(false);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to start Xero connection");
      setConnectingXero(false);
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

      {/* Stripe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" />
            Stripe Payments
          </CardTitle>
          <CardDescription>
            Enter your Stripe secret key to receive payments directly to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stripeLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : stripeStatus?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">Connected</span>
                <span className="text-muted-foreground">· {stripeStatus.mode === "live" ? "Live" : "Test"} mode</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDisconnectStripe}>
                  Remove Key
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder="sk_live_xxx or sk_test_xxx"
                    value={stripeKey}
                    onChange={(e) => setStripeKey(e.target.value)}
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={handleSaveStripeKey} disabled={savingKey || !stripeKey.trim()}>
                  {savingKey ? "Saving..." : "Save"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Find your key in the{" "}
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">
                  Stripe Dashboard
                </a>
                . Money goes directly to your account — no platform fees.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Xero Connect */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-5 w-5" />
            Xero Accounting
          </CardTitle>
          <CardDescription>
            Connect your Xero account to automatically sync invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {xeroLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : xeroStatus?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">Connected</span>
                {xeroStatus.tenantName && (
                  <span className="text-muted-foreground">· {xeroStatus.tenantName}</span>
                )}
              </div>
              {xeroStatus.connectedAt && (
                <p className="text-xs text-muted-foreground">
                  Connected since {new Date(xeroStatus.connectedAt).toLocaleDateString()}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleConnectXero} disabled={connectingXero}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  {connectingXero ? "Redirecting..." : "Reconnect Xero"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await disconnectXero.mutateAsync();
                      refetchXero();
                      toast.success("Xero disconnected");
                    } catch (err: any) {
                      toast.error(err?.message || "Failed to disconnect");
                    }
                  }}
                  disabled={disconnectXero.isPending}
                >
                  {disconnectXero.isPending ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sync paid invoices directly to your Xero accounting. Invoices are created as authorised sales invoices.
              </p>
              <Button onClick={handleConnectXero} disabled={connectingXero}>
                {connectingXero ? "Redirecting..." : "Connect Xero"}
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
