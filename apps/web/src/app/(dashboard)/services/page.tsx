"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useServices, useCreateService, useUpdateService, useDeleteService, type ServiceItem } from "@/hooks/use-services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

const eur = (c: number) => `€${(c / 100).toFixed(2)}`;

const emptyForm = { name: "", description: "", pricingModel: "FIXED", basePrice: 0, durationMin: 60, category: "", isActive: true };

export default function ServicesPage() {
  const { data: services, isLoading } = useServices();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role === "WORKER") router.push("/dashboard");
  }, [user, router]);

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showNew, setShowNew] = useState(false);

  const reset = () => { setForm(emptyForm); setEditing(null); setShowNew(false); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing, name: form.name, description: form.description || null, pricingModel: form.pricingModel, basePrice: form.basePrice, durationMin: form.durationMin, category: form.category || null, isActive: form.isActive });
        toast.success("Service updated");
      } else {
        await createMutation.mutateAsync({ name: form.name, description: form.description || null, pricingModel: form.pricingModel, basePrice: form.basePrice, durationMin: form.durationMin, category: form.category || null, isActive: true });
        toast.success("Service created");
      }
      reset();
    } catch { toast.error("Failed to save"); }
  };

  const startEdit = (s: ServiceItem) => {
    setEditing(s.id);
    setForm({ name: s.name, description: s.description || "", pricingModel: s.pricingModel, basePrice: s.basePrice, durationMin: s.durationMin, category: s.category || "", isActive: s.isActive });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    try { await deleteMutation.mutateAsync(id); toast.success("Deleted"); } catch { toast.error("Failed to delete"); }
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground text-sm">Manage your cleaning service catalog and pricing</p>
        </div>
        <Button onClick={() => { reset(); setShowNew(true); }} className="gap-2"><Plus className="h-4 w-4" /> Add Service</Button>
      </div>

      {/* New/Edit Form */}
      {(showNew || editing) && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">{editing ? "Edit Service" : "New Service"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Regular, Deep Clean" /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Pricing Model</Label>
                <Select value={form.pricingModel} onValueChange={(v) => setForm({ ...form, pricingModel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed Price</SelectItem>
                    <SelectItem value="HOURLY">Per Hour</SelectItem>
                    <SelectItem value="PER_ROOM">Per Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Base Price (€)</Label><Input type="number" value={(form.basePrice / 100).toFixed(2)} onChange={(e) => setForm({ ...form, basePrice: Math.round(Number(e.target.value) * 100) })} /></div>
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) || 60 })} /></div>
            </div>
            {editing && (
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <Label>Active</Label>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} size="sm" className="gap-1" disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}>
                <Check className="h-4 w-4" /> Save
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}><X className="h-4 w-4 mr-1" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {!services?.length ? (
        <Card><CardContent className="py-12 text-center"><Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No services configured yet</p><p className="text-xs text-muted-foreground mt-1">Add your first service to start creating bookings.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className={!s.isActive ? "opacity-50" : ""}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    {s.category && <p className="text-xs text-muted-foreground">{s.category}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(s.id)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
                  </div>
                </div>
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold">{eur(s.basePrice)}</span>
                  <span className="text-muted-foreground">{s.pricingModel}</span>
                  <span className="text-muted-foreground">{s.durationMin}min</span>
                </div>
                {!s.isActive && <p className="text-xs text-amber-600">Inactive</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
