"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Sparkles, MapPin, Calendar, Clock, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState<"form" | "submitted">("form");
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => { fetchCompany(); }, [slug]);

  const fetchCompany = async () => {
    try {
      const res = await api.get(`/portal/book-info/${slug}`);
      setCompanyName(res.data?.data?.companyName || "Cleaning Service");
      setServices(res.data?.data?.services || []);
    } catch { /* Portal not configured for this company */ }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.post("/portal/book", {
        slug,
        customerName: form.get("name"),
        customerEmail: form.get("email"),
        customerPhone: form.get("phone"),
        customerAddress: form.get("address"),
        serviceType: form.get("service"),
        preferredDate: form.get("date"),
        notes: form.get("notes"),
      });
      setStep("submitted");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit booking");
    } finally {
      setLoading(false);
    }
  };

  if (step === "submitted") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="space-y-4 pt-8 pb-8">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h1 className="text-2xl font-bold">Booking Request Sent!</h1>
            <p className="text-muted-foreground">
              {companyName} will confirm your booking shortly. You'll receive a confirmation email.
            </p>
            <Button variant="outline" onClick={() => setStep("form")}>
              Book Another Service
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary mb-2" />
          <CardTitle className="text-2xl">Book a Cleaning</CardTitle>
          <p className="text-sm text-muted-foreground">
            with <span className="font-medium text-foreground">{companyName}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Your Name *</Label>
                <Input id="name" name="name" required placeholder="John Murphy" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" placeholder="085 123 4567" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required placeholder="john@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">
                <MapPin className="inline h-3 w-3 mr-1" />
                Address *
              </Label>
              <Input id="address" name="address" required placeholder="12 Main Street, Dublin 2" />
            </div>
            {services.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="service">Service Type</Label>
                <select id="service" name="service" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select a service...</option>
                  {services.map((s: any) => (
                    <option key={s.id} value={s.name}>{s.name} — from €{(s.price / 100).toFixed(2)}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="date">
                <Calendar className="inline h-3 w-3 mr-1" />
                Preferred Date
              </Label>
              <Input id="date" name="date" type="date" min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" placeholder="Any special requirements..." />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Submitting..." : "Request Booking"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
