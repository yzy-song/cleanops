"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar, CheckCircle, ChevronLeft, ChevronRight,
  Home, Building2, Sparkles, Briefcase, SprayCanIcon as Spray,
  Bath, CookingPot, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ==================== Constants ====================

const serviceTypes = [
  { value: "REGULAR", label: "Regular Cleaning", icon: Home, desc: "Routine home upkeep" },
  { value: "DEEP_CLEAN", label: "Deep Clean", icon: Sparkles, desc: "Thorough top-to-bottom clean" },
  { value: "END_OF_TENANCY", label: "End of Tenancy", icon: Building2, desc: "Full move-out clean" },
  { value: "COMMERCIAL", label: "Commercial", icon: Briefcase, desc: "Office & business spaces" },
  { value: "WINDOW", label: "Window Cleaning", icon: Spray, desc: "Interior & exterior windows" },
  { value: "CARPET", label: "Carpet Cleaning", icon: Bath, desc: "Deep carpet shampoo" },
  { value: "OVEN", label: "Oven Cleaning", icon: CookingPot, desc: "Professional oven detailing" },
] as const;

const propertySizes = [
  { value: "STUDIO", label: "Studio" },
  { value: "ONE_BED", label: "1 Bedroom" },
  { value: "TWO_BED", label: "2 Bedrooms" },
  { value: "THREE_BED", label: "3 Bedrooms" },
  { value: "FOUR_BED", label: "4 Bedrooms" },
  { value: "FIVE_PLUS_BED", label: "5+ Bedrooms" },
] as const;

const frequencies = [
  { value: "ONE_OFF", label: "One-time" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BI_WEEKLY", label: "Every 2 weeks" },
  { value: "MONTHLY", label: "Monthly" },
] as const;

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

interface BookingWizardProps {
  companyId?: string;
}

// ==================== Component ====================

export function BookingWizard({ companyId }: BookingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<any>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const [serviceType, setServiceType] = useState("");
  const [propertySize, setPropertySize] = useState("");
  const [bathrooms, setBathrooms] = useState(1);
  const [frequency, setFrequency] = useState("ONE_OFF");
  const [isCommercial, setIsCommercial] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch real-time pricing when step 2 selections change
  useEffect(() => {
    if (!serviceType || !propertySize) return;
    setPricingLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.post("/portal/quote/calculate", {
          serviceType,
          propertySize,
          bathrooms,
          frequency,
          isCommercial,
          ...(companyId ? { companyId } : {}),
        });
        setPricing(res.data);
      } catch {
        setPricing(null);
      } finally {
        setPricingLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [serviceType, propertySize, bathrooms, frequency, isCommercial, companyId]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post("/portal/quote", {
        serviceType,
        propertySize,
        bathrooms,
        frequency,
        isCommercial,
        notes,
        name,
        email,
        phone: phone || undefined,
        address,
        postalCode: postalCode || undefined,
        accessCode: accessCode || undefined,
        lat: 53.3498,
        lng: -6.2603,
        ...(companyId ? { companyId } : {}),
      });
      const quote = res.data;
      router.push(`/portal/quote/${quote.publicToken}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create quote. Please try again.");
      setLoading(false);
    }
  };

  const canGoStep1 = serviceType;
  const canGoStep2 = propertySize && frequency && scheduledDate;
  const canGoStep3 = name && email && address;

  const steps = ["Service", "Details", "Address", "Review"];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Book a Cleaning Service</h1>
        <p className="text-muted-foreground text-sm">Get an instant quote in under 2 minutes</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div
              className={cn(
                "flex items-center justify-center rounded-full w-8 h-8 text-xs font-medium shrink-0 transition-colors",
                step > i + 1
                  ? "bg-emerald-500 text-white"
                  : step === i + 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {step > i + 1 ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn("text-xs hidden sm:inline", step === i + 1 ? "text-foreground font-medium" : "text-muted-foreground")}>
              {label}
            </span>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-border hidden sm:block" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* ===== STEP 1: Service Type ===== */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">What service do you need?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serviceTypes.map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-4 text-left transition-all hover:border-primary/50",
                      serviceType === st.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border",
                    )}
                    onClick={() => setServiceType(st.value)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <st.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{st.label}</p>
                      <p className="text-xs text-muted-foreground">{st.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===== STEP 2: Property Details ===== */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Tell us about the property</h2>

              <div className="space-y-3">
                <Label>Property Size</Label>
                <div className="flex flex-wrap gap-2">
                  {propertySizes.map((ps) => (
                    <button
                      key={ps.value}
                      type="button"
                      className={cn(
                        "rounded-full px-4 py-2 text-sm border transition-colors",
                        propertySize === ps.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50",
                      )}
                      onClick={() => setPropertySize(ps.value)}
                    >
                      {ps.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min={1}
                    max={10}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Preferred Date *</Label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>How often?</Label>
                <div className="flex flex-wrap gap-2">
                  {frequencies.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      className={cn(
                        "rounded-full px-4 py-2 text-sm border transition-colors",
                        frequency === f.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50",
                      )}
                      onClick={() => setFrequency(f.value)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isCommercial"
                  checked={isCommercial}
                  onCheckedChange={(checked) => setIsCommercial(!!checked)}
                />
                <Label htmlFor="isCommercial" className="text-sm cursor-pointer">
                  This is a commercial property (VAT 23%)
                </Label>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Address & Contact ===== */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Where should we come?</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Eircode</Label>
                  <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="e.g. D01 F5P2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Access Code</Label>
                  <Input id="accessCode" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Gate code / key location" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Special Instructions</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Areas to focus on, pets, parking..." />
              </div>
            </div>
          )}

          {/* ===== STEP 4: Review & Confirm ===== */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Review your booking</h2>

              {/* Service summary */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{serviceTypes.find((s) => s.value === serviceType)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property</span>
                  <span className="font-medium">{propertySizes.find((s) => s.value === propertySize)?.label} · {bathrooms} bath</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-medium">{frequencies.find((f) => f.value === frequency)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{scheduledDate ? new Date(scheduledDate).toLocaleDateString("en-IE", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-right max-w-[60%]">{address}</span>
                </div>
                {postalCode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eircode</span>
                    <span className="font-medium">{postalCode}</span>
                  </div>
                )}
              </div>

              {/* Pricing card */}
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="font-medium text-sm">Price Breakdown</h3>
                {pricingLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : pricing ? (
                  <>
                    {pricing.lineItems?.map((li: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{li.description}</span>
                        <span>{eur(li.totalPrice)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{eur(pricing.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        VAT ({isCommercial ? "23%" : "13.5%"})
                      </span>
                      <span>{eur(pricing.vatAmount)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{eur(pricing.grandTotal)}</span>
                    </div>
                    {pricing.depositRequired && (
                      <div className="flex justify-between text-sm text-amber-600">
                        <span>Deposit required</span>
                        <span className="font-medium">{eur(pricing.depositAmount)}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Estimated duration: {pricing.estimatedDuration} minutes
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Pricing unavailable</p>
                )}
              </div>

              {/* Contact summary */}
              <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact</span>
                  <span className="font-medium">{name} · {email}{phone ? ` · ${phone}` : ""}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6 border-t mt-6">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !canGoStep1) ||
                  (step === 2 && !canGoStep2) ||
                  (step === 3 && !canGoStep3)
                }
              >
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || !pricing}>
                {loading ? "Creating Quote..." : "Get Quote"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
