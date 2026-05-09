"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateWorker } from "@/hooks/use-workers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewWorkerPage() {
  const router = useRouter();
  const createWorker = useCreateWorker();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", hourlyRate: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWorker.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        hourlyRate: Math.round(parseFloat(form.hourlyRate) * 100),
      });
      toast.success("Worker added");
      router.push("/workers");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add worker");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Add Worker</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Worker details</CardTitle>
          <CardDescription>Add a new cleaner to your team</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Hourly rate (EUR)</Label>
              <Input id="rate" type="number" min="14.80" step="0.01" value={form.hourlyRate} onChange={(e) => setForm((p) => ({ ...p, hourlyRate: e.target.value }))} required />
              <p className="text-xs text-muted-foreground">Minimum €14.80/hr (ERO 2026)</p>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={createWorker.isPending}>
                {createWorker.isPending ? "Adding..." : "Add Worker"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/workers">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
