"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function BookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    eircode: "",
    accessCode: "",
    scheduledDate: "",
    notes: "",
    isCommercial: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.address || !form.scheduledDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await api.post("/portal/book", {
        ...form,
        lat: 53.3498,  // Default Dublin coordinates — in production use geocoding
        lng: -6.2603,
      });
      setSuccess(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">Booking Request Sent!</h2>
            <p className="text-muted-foreground">
              We've received your booking request. Our team will confirm your appointment shortly via email.
            </p>
            <Button variant="outline" onClick={() => router.push("/book")}>
              Book another service
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Book a Cleaning Service</h1>
        <p className="text-muted-foreground text-sm">Fill in your details and we'll get back to you</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, City"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eircode">Eircode</Label>
                <Input
                  id="eircode"
                  value={form.eircode}
                  onChange={(e) => setForm({ ...form, eircode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  value={form.accessCode}
                  onChange={(e) => setForm({ ...form, accessCode: e.target.value })}
                  placeholder="Gate code / key location"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Preferred Date & Time *</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Special instructions, areas to focus on..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isCommercial"
                checked={form.isCommercial}
                onCheckedChange={(checked) => setForm({ ...form, isCommercial: !!checked })}
              />
              <Label htmlFor="isCommercial" className="text-sm cursor-pointer">
                This is a commercial property
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Calendar className="mr-2 h-4 w-4" />
              {loading ? "Submitting..." : "Request Booking"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
