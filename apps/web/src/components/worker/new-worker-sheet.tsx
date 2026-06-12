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

export function NewWorkerSheet({ open, onOpenChange, onCreated }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!firstName || !email) return;
    setLoading(true);
    try {
      await api.post("/worker", {
        firstName, lastName, email,
        phone: phone || undefined,
        postalCode: postalCode || undefined,
        hourlyRate: hourlyRate ? Math.round(Number(hourlyRate) * 100) : undefined,
      });
      toast.success("Worker created");
      onOpenChange(false);
      setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setPostalCode(""); setHourlyRate("");
      onCreated?.();
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> New Worker</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>First Name *</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Last Name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Eircode</Label><Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="e.g. D01 F5P2" /></div>
          <div className="space-y-1.5"><Label>Hourly Rate (€)</Label><Input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="14.80" /></div>
        </div>
        <SheetFooter className="mt-6">
          <Button onClick={handleCreate} disabled={!firstName || !email || loading} className="w-full">{loading ? "Creating..." : "Create Worker"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
