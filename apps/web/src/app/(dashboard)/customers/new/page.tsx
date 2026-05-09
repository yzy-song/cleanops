"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateCustomer } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressInput } from "@/components/ui/address-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewCustomerPage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();
  const [form, setForm] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
    isCommercial: false,
    eircode: "",
  });

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomer.mutateAsync({
        name: form.name,
        address: form.address,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        isCommercial: form.isCommercial,
        eircode: form.eircode || undefined,
      });
      toast.success("Customer added");
      router.push("/customers");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add customer");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Add Customer</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer details</CardTitle>
          <CardDescription>Add a new client location</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer name</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <AddressInput
                id="address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                onPlaceSelect={(place) => {
                  set("address", place.address);
                  set("lat", place.lat.toString());
                  set("lng", place.lng.toString());
                  if (place.eircode) set("eircode", place.eircode);
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eircode">Eircode</Label>
              <Input id="eircode" value={form.eircode} onChange={(e) => set("eircode", e.target.value)} placeholder="Auto-detected from address" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isCommercial"
                checked={form.isCommercial}
                onCheckedChange={(v) => set("isCommercial", !!v)}
              />
              <Label htmlFor="isCommercial" className="text-sm">Commercial property (VAT 23%)</Label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={createCustomer.isPending}>
                {createCustomer.isPending ? "Adding..." : "Add Customer"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/customers">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
