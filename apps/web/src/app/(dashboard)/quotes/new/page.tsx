"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateQuote } from "@/hooks/use-quotes";
import { useCustomers } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useRoleGuard } from "@/hooks/use-role-guard";

const SERVICE_TYPES = [
  { value: "REGULAR", label: "Regular House Cleaning" },
  { value: "DEEP_CLEAN", label: "Deep Clean" },
  { value: "END_OF_TENANCY", label: "End of Tenancy Cleaning" },
  { value: "COMMERCIAL", label: "Commercial Cleaning" },
  { value: "WINDOW", label: "Window Cleaning" },
  { value: "CARPET", label: "Carpet Cleaning" },
  { value: "OVEN", label: "Oven Cleaning" },
];

const PROPERTY_SIZES = [
  { value: "STUDIO", label: "Studio" },
  { value: "ONE_BED", label: "1 Bedroom" },
  { value: "TWO_BED", label: "2 Bedrooms" },
  { value: "THREE_BED", label: "3 Bedrooms" },
  { value: "FOUR_BED", label: "4 Bedrooms" },
  { value: "FIVE_PLUS_BED", label: "5+ Bedrooms" },
  { value: "COMMERCIAL_SMALL", label: "Small Office" },
  { value: "COMMERCIAL_LARGE", label: "Large Office" },
];

const FREQUENCIES = [
  { value: "ONE_OFF", label: "One-off" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BI_WEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

export default function NewQuotePage() {
  const router = useRouter();
  useRoleGuard(["ADMIN", "MANAGER"]);
  const createQuote = useCreateQuote();
  const { data: customers } = useCustomers();
  const customerList = customers ?? [];

  const [form, setForm] = useState({
    serviceType: "REGULAR",
    propertySize: "TWO_BED",
    bathrooms: "",
    frequency: "ONE_OFF",
    isCommercial: false,
    notes: "",
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerPostalCode: "",
    customerAccessCode: "",
  });

  const [pricing, setPricing] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const fetchPricing = async () => {
      setCalculating(true);
      try {
        const res = await api.post("/portal/quote/calculate", {
          serviceType: form.serviceType,
          propertySize: form.propertySize,
          bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
          frequency: form.frequency,
          isCommercial: form.isCommercial,
        });
        setPricing(res.data.data);
      } catch {
        // silently fail — pricing is informational
      } finally {
        setCalculating(false);
      }
    };
    fetchPricing();
  }, [form.serviceType, form.propertySize, form.bathrooms, form.frequency, form.isCommercial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        serviceType: form.serviceType,
        propertySize: form.propertySize,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        frequency: form.frequency,
        isCommercial: form.isCommercial,
        estimatedDuration: pricing?.estimatedDuration ?? 120,
        notes: form.notes || undefined,
      };

      if (form.customerId) {
        payload.customerId = form.customerId;
      } else {
        if (!form.customerName || !form.customerEmail || !form.customerAddress) {
          toast.error("Customer name, email, and address are required");
          return;
        }
        payload.customerName = form.customerName;
        payload.customerEmail = form.customerEmail;
        payload.customerPhone = form.customerPhone || undefined;
        payload.customerAddress = form.customerAddress;
        payload.customerPostalCode = form.customerPostalCode || undefined;
        payload.customerAccessCode = form.customerAccessCode || undefined;
      }

      await createQuote.mutateAsync(payload);
      toast.success("Quote created");
      router.push("/quotes");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create quote");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/quotes"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">New Quote</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Service Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <select
                id="serviceType"
                value={form.serviceType}
                onChange={(e) => set("serviceType", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {SERVICE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertySize">Property Size</Label>
              <select
                id="propertySize"
                value={form.propertySize}
                onChange={(e) => set("propertySize", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PROPERTY_SIZES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms (optional)</Label>
              <Input
                id="bathrooms"
                type="number"
                min="0"
                max="10"
                value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
                placeholder="e.g. 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <select
                id="frequency"
                value={form.frequency}
                onChange={(e) => set("frequency", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isCommercial"
                checked={form.isCommercial}
                onCheckedChange={(v) => set("isCommercial", !!v)}
              />
              <Label htmlFor="isCommercial" className="text-sm">Commercial property (23% VAT)</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Preview */}
        {pricing && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {calculating ? "Calculating..." : "Pricing Preview"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Estimated duration</span>
                <span>{pricing.estimatedDuration} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{eur(pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT ({form.isCommercial ? "23%" : "13.5%"})</span>
                <span>{eur(pricing.vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold text-sm">
                <span>Total</span>
                <span>{eur(pricing.grandTotal)}</span>
              </div>
              {pricing.depositRequired && (
                <p className="text-xs text-yellow-700 bg-yellow-50 rounded p-2 mt-2">
                  A {eur(pricing.depositAmount)} deposit is required for this one-off service.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Customer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Select existing customer</Label>
              <select
                id="customerId"
                value={form.customerId}
                onChange={(e) => set("customerId", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">New customer (fill below)</option>
                {customerList.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <hr />

            <div className="space-y-2">
              <Label htmlFor="customerName">Name *</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                required={!form.customerId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={form.customerEmail}
                onChange={(e) => set("customerEmail", e.target.value)}
                required={!form.customerId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                value={form.customerPhone}
                onChange={(e) => set("customerPhone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerAddress">Address *</Label>
              <Input
                id="customerAddress"
                value={form.customerAddress}
                onChange={(e) => set("customerAddress", e.target.value)}
                required={!form.customerId}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerPostalCode">Eircode</Label>
                <Input
                  id="customerPostalCode"
                  value={form.customerPostalCode}
                  onChange={(e) => set("customerPostalCode", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAccessCode">Access Code</Label>
                <Input
                  id="customerAccessCode"
                  value={form.customerAccessCode}
                  onChange={(e) => set("customerAccessCode", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={createQuote.isPending}>
          {createQuote.isPending ? "Creating..." : "Create Quote"}
        </Button>
      </form>
    </div>
  );
}
