"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCustomer, useUpdateCustomer } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressInput } from "@/components/ui/address-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: customer, isLoading } = useCustomer(id);
  const updateCustomer = useUpdateCustomer();

  const [form, setForm] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
    isCommercial: false,
    eircode: "",
  });

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        address: customer.address || "",
        lat: String(customer.lat ?? ""),
        lng: String(customer.lng ?? ""),
        isCommercial: customer.isCommercial ?? false,
        eircode: customer.eircode || "",
      });
    }
  }, [customer]);

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCustomer.mutateAsync({
        id,
        name: form.name,
        address: form.address,
        lat: parseFloat(form.lat) || undefined as any,
        lng: parseFloat(form.lng) || undefined as any,
        isCommercial: form.isCommercial,
        eircode: form.eircode || undefined,
      });
      toast.success("Customer updated");
      router.push("/customers");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update");
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

  if (!customer) {
    return <div className="text-center text-muted-foreground">Customer not found</div>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Customer</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
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
              <Button type="submit" disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? "Saving..." : "Save"}
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
