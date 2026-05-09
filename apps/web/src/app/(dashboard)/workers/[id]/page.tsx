"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorker, useUpdateWorker } from "@/hooks/use-workers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: worker, isLoading } = useWorker(id);
  const updateWorker = useUpdateWorker();

  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", hourlyRate: "" });

  useEffect(() => {
    if (worker) {
      setForm({
        firstName: worker.firstName || "",
        lastName: worker.lastName || "",
        phone: worker.phone || "",
        email: worker.user?.email || "",
        hourlyRate: ((worker.hourlyRate || 0) / 100).toFixed(2),
      });
    }
  }, [worker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateWorker.mutateAsync({
        id,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        hourlyRate: Math.round(parseFloat(form.hourlyRate) * 100),
      });
      toast.success("Worker updated");
      router.push("/workers");
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

  if (!worker) {
    return <div className="text-center text-muted-foreground">Worker not found</div>;
  }

  const displayName = `${worker.firstName} ${worker.lastName}`;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Worker</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{displayName}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Hourly rate (EUR)</Label>
              <Input id="rate" type="number" min="14.80" step="0.01" value={form.hourlyRate} onChange={(e) => setForm((p) => ({ ...p, hourlyRate: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={updateWorker.isPending}>
                {updateWorker.isPending ? "Saving..." : "Save"}
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
