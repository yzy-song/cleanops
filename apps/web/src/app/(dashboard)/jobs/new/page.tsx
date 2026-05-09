"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateJob } from "@/hooks/use-jobs";
import { useCustomers, useCustomersCreditRisk } from "@/hooks/use-customers";
import { useWorkers } from "@/hooks/use-workers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createJob = useCreateJob();
  const { data: customers } = useCustomers();
  const { data: creditRisks } = useCustomersCreditRisk();
  const { data: workers } = useWorkers();

  const selectedCustomerRisk = creditRisks?.find((r) => r.id === form.customerId);

  const [form, setForm] = useState({
    customerId: "",
    scheduledStart: "",
    estimatedDuration: "",
    notes: "",
    isRecurring: false,
    recurrenceRule: "WEEKLY" as string,
    depositAmount: "",
  });

  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setForm((prev) => ({ ...prev, scheduledStart: dateParam }));
    }
  }, [searchParams]);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);

  const toggleWorker = (id: string) => {
    setSelectedWorkers((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newJob = await createJob.mutateAsync({
        customerId: form.customerId,
        scheduledStart: new Date(form.scheduledStart).toISOString(),
        estimatedDuration: form.estimatedDuration ? parseInt(form.estimatedDuration) : undefined,
        notes: form.notes || undefined,
        workerIds: selectedWorkers.length ? selectedWorkers : undefined,
        isRecurring: form.isRecurring || undefined,
        recurrenceRule: form.isRecurring ? form.recurrenceRule : undefined,
        depositAmount: form.depositAmount ? Math.round(parseFloat(form.depositAmount) * 100) : undefined,
      });
      toast.success("Job created");
      if (form.depositAmount && newJob?.id) {
        router.push(`/jobs/${newJob.id}`);
      } else {
        router.push("/jobs");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create job");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobs"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Create Job</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job details</CardTitle>
          <CardDescription>Schedule a new cleaning job</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <select
                id="customer"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.customerId}
                onChange={(e) => setForm((p) => ({ ...p, customerId: e.target.value }))}
                required
              >
                <option value="">Select a customer...</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.address}</option>
                ))}
              </select>
            </div>
            {selectedCustomerRisk && selectedCustomerRisk.riskLevel !== "LOW" && (
              <div className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                selectedCustomerRisk.riskLevel === "HIGH"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-yellow-200 bg-yellow-50 text-yellow-800"
              }`}>
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {selectedCustomerRisk.riskLevel === "HIGH" ? "High Risk Customer" : "Credit Warning"}
                  </p>
                  <p>
                    This customer has {selectedCustomerRisk.unpaidCount} unpaid invoice{selectedCustomerRisk.unpaidCount > 1 ? "s" : ""}
                    {" "}totalling €{(selectedCustomerRisk.totalUnpaid / 100).toFixed(2)}.
                    Consider collecting payment or requiring a deposit before sending a worker.
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="date">Scheduled date & time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={form.scheduledStart}
                onChange={(e) => setForm((p) => ({ ...p, scheduledStart: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated duration (minutes)</Label>
              <Input id="duration" type="number" value={form.estimatedDuration} onChange={(e) => setForm((p) => ({ ...p, estimatedDuration: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any special instructions..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Deposit (€) — optional</Label>
              <Input
                id="deposit"
                type="number"
                min="0"
                step="0.01"
                value={form.depositAmount}
                onChange={(e) => setForm((p) => ({ ...p, depositAmount: e.target.value }))}
                placeholder="e.g. 50 for end-of-tenancy"
              />
              <p className="text-xs text-muted-foreground">Charge a deposit upfront for one-off / end-of-tenancy jobs</p>
            </div>

            <div className="space-y-3 border rounded-lg p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => setForm((p) => ({ ...p, isRecurring: e.target.checked }))}
                  className="h-4 w-4"
                />
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recurring job</span>
              </label>
              {form.isRecurring && (
                <div className="flex items-center gap-2 ml-8">
                  <Label htmlFor="recurrence" className="text-xs">Repeat every</Label>
                  <select
                    id="recurrence"
                    value={form.recurrenceRule}
                    onChange={(e) => setForm((p) => ({ ...p, recurrenceRule: e.target.value }))}
                    className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="WEEKLY">Week</option>
                    <option value="BI-WEEKLY">2 Weeks</option>
                  </select>
                </div>
              )}
            </div>

            {workers && workers.length > 0 && (
              <div className="space-y-2">
                <Label>Assign workers</Label>
                <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2">
                  {workers.filter((w) => w.isActive).map((w) => (
                    <label key={w.id} className="flex items-center gap-2 cursor-pointer text-sm py-1">
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(w.id)}
                        onChange={() => toggleWorker(w.id)}
                        className="h-4 w-4"
                      />
                      {w.firstName} {w.lastName}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={createJob.isPending}>
                {createJob.isPending ? "Creating..." : "Create Job"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/jobs">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
