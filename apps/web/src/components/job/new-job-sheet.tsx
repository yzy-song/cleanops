"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomers } from "@/hooks/use-customers";
import { useWorkers } from "@/hooks/use-workers";
import { useServices } from "@/hooks/use-services";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function NewJobSheet({ open, onOpenChange, onCreated }: Props) {
  const { data: customers } = useCustomers();
  const { data: workers } = useWorkers();
  const { data: services } = useServices();
  const [loading, setLoading] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const [notes, setNotes] = useState("");

  // Auto-fill duration from selected service
  useEffect(() => {
    if (serviceId && services) {
      const svc = services.find((s) => s.id === serviceId);
      if (svc) setEstimatedDuration(svc.durationMin);
    }
  }, [serviceId, services]);

  const handleCreate = async () => {
    if (!customerId || !date) return;
    setLoading(true);
    try {
      const body: any = { customerId, scheduledStart: new Date(date).toISOString(), estimatedDuration, notes: notes || undefined };
      if (workerId) body.workerIds = [workerId];
      if (serviceId) body.serviceId = serviceId;
      await api.post("/jobs", body);
      toast.success("Job created");
      onOpenChange(false);
      onCreated?.();
      // Reset form
      setCustomerId(""); setServiceId(""); setWorkerId(""); setNotes("");
      setDate(new Date().toISOString().slice(0, 16)); setEstimatedDuration(60);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> New Job</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-6">
          <div className="space-y-1.5">
            <Label>Customer *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select a customer..." /></SelectTrigger>
              <SelectContent>
                {customers?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Service</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue placeholder="Select a service..." /></SelectTrigger>
              <SelectContent>
                {services?.filter((s) => s.isActive).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.durationMin}min, €{(s.basePrice/100).toFixed(2)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Schedule *</Label>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={estimatedDuration} onChange={(e) => setEstimatedDuration(Number(e.target.value) || 60)} />
          </div>
          <div className="space-y-1.5">
            <Label>Assign Worker</Label>
            <Select value={workerId} onValueChange={setWorkerId}>
              <SelectTrigger><SelectValue placeholder="Optional — assign later..." /></SelectTrigger>
              <SelectContent>
                {workers?.filter((w: any) => w.isActive).map((w: any) => (
                  <SelectItem key={w.id} value={w.id}>{w.firstName} {w.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions..." />
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button onClick={handleCreate} disabled={!customerId || !date || loading} className="w-full">
            {loading ? "Creating..." : "Create Job"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
