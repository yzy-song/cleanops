"use client";

import { useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { UserPlus, Search, Loader2 } from "lucide-react";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: () => void; }

const GEOCODE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export function NewCustomerSheet({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const handleEircodeLookup = useCallback(async () => {
    if (!postalCode || postalCode.length < 3 || !GEOCODE_KEY) return;
    setLookingUp(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postalCode + " Ireland")}&region=ie&key=${GEOCODE_KEY}`
      );
      const data = await res.json();
      if (data.status === "OK" && data.results?.length > 0) {
        const addr = data.results[0].formatted_address;
        setAddress(addr);
        toast.success("Address found");
      }
    } catch { /* silently fail */ }
    finally { setLookingUp(false); }
  }, [postalCode]);

  const handlePostalCodeBlur = () => {
    if (postalCode.length >= 3 && !address) {
      handleEircodeLookup();
    }
  };

  const handleCreate = async () => {
    if (!name || !address) return;
    setLoading(true);
    try {
      await api.post("/customer", {
        name, email, phone: phone || undefined,
        address, postalCode: postalCode || undefined,
      });
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
          <div className="space-y-1.5">
            <Label>Eircode</Label>
            <div className="flex gap-2">
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                onBlur={handlePostalCodeBlur}
                placeholder="e.g. D01 F5P2"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleEircodeLookup}
                disabled={lookingUp || postalCode.length < 3}
                title="Look up address from Eircode"
              >
                {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Address *</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        </div>
        <SheetFooter className="mt-6">
          <Button onClick={handleCreate} disabled={!name || !address || loading} className="w-full">{loading ? "Creating..." : "Create Customer"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
