"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: () => void; }

export function NewCustomerSheet({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !address) return;
    setLoading(true);
    try {
      await api.post("/customer", { name, email, phone: phone || undefined, address, postalCode: postalCode || undefined, lat: 53.3498, lng: -6.2603 });
      toast.success("Customer created");
      onOpenChange(false);
      setName(""); setEmail(""); setPhone(""); setAddress(""); setPostalCode("");
      onCreated?.();
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> New Customer</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Address *</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Eircode</Label><Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="e.g. D01 F5P2" /></div>
        </div>
        <SheetFooter className="mt-6">
          <Button onClick={handleCreate} disabled={!name || !address || loading} className="w-full">{loading ? "Creating..." : "Create Customer"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
