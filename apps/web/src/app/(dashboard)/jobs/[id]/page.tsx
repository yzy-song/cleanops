"use client";

import { useParams } from "next/navigation";
import { useJob, useCancelJob, useAssignWorkers, useUnassignWorker, useMarkDepositPaid, useGenerateDepositLink } from "@/hooks/use-jobs";
import { useWorkers } from "@/hooks/use-workers";
import { useGenerateInvoice } from "@/hooks/use-invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, MapPin, User, FileText, MessageCircle, Wallet, CheckCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(id);
  const { data: workers } = useWorkers();
  const cancelJob = useCancelJob();
  const assignWorkers = useAssignWorkers();
  const unassignWorker = useUnassignWorker();
  const generateInvoice = useGenerateInvoice();
  const markDepositPaid = useMarkDepositPaid();
  const generateDepositLink = useGenerateDepositLink();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!job) {
    return <div className="text-center text-muted-foreground">Job not found</div>;
  }

  const assignedIds = job.assignments?.map((a) => a.workerId) ?? [];

  const handleAssign = async (workerId: string) => {
    try {
      await assignWorkers.mutateAsync({ id, workerIds: [...assignedIds, workerId] });
      toast.success("Worker assigned");
    } catch (err: any) {
      toast.error(err?.message || "Assignment failed");
    }
  };

  const handleUnassign = async (workerId: string) => {
    try {
      await unassignWorker.mutateAsync({ id, workerId });
      toast.success("Worker removed");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove worker");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this job?")) return;
    try {
      await cancelJob.mutateAsync(id);
      toast.success("Job cancelled");
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel");
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      await generateInvoice.mutateAsync(id);
      toast.success("Invoice generated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate invoice");
    }
  };

  const handleWhatsApp = () => {
    const phone = job.customer?.phone;
    if (!phone) {
      toast.error("Customer has no phone number");
      return;
    }
    const name = job.customer?.name || "there";
    const inv = job.invoice;
    const amount = inv ? `€${(inv.amount / 100).toFixed(2)}` : "";
    const link = inv?.paymentLink || "";
    const msg = encodeURIComponent(
      `Hi ${name}, your cleaning service is complete!` +
      (amount ? ` Invoice: ${amount}.` : "") +
      (link ? ` Pay online: ${link}` : "")
    );
    window.open(`https://wa.me/${phone.replace(/[^+0-9]/g, "")}?text=${msg}`, "_blank");
  };

  const handleMarkDepositPaid = async () => {
    try {
      await markDepositPaid.mutateAsync(id);
      toast.success("Deposit marked as paid");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleSendDepositLink = async () => {
    try {
      const result = await generateDepositLink.mutateAsync(id);
      if (result.paymentLink && result.customerPhone) {
        const msg = encodeURIComponent(
          `Hi ${result.customerName}, to confirm your cleaning booking, please pay the deposit of €${(result.depositAmount / 100).toFixed(2)} here: ${result.paymentLink}`
        );
        window.open(`https://wa.me/${result.customerPhone.replace(/[^+0-9]/g, "")}?text=${msg}`, "_blank");
        toast.success("Deposit link opened in WhatsApp");
      } else if (result.paymentLink) {
        window.open(result.paymentLink, "_blank");
        toast.success("Deposit payment link opened");
      } else {
        toast.error("Could not generate payment link. Check Stripe configuration.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate deposit link");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobs"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Job Detail</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Info</CardTitle>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[job.status] || "bg-gray-100")}>
                {job.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{job.customer?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{job.customer?.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(job.scheduledStart).toLocaleString()}</span>
            </div>
            {job.estimatedDuration && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{job.estimatedDuration} min estimated</span>
              </div>
            )}
            {job.notes && (
              <div className="rounded-md bg-muted p-2 text-sm">
                {job.notes}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {job.assignments?.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border p-2">
                <span className="text-sm">
                  {a.worker ? `${a.worker.firstName} ${a.worker.lastName}` : "Unknown"}
                </span>
                {job.status === "PENDING" && (
                  <Button variant="ghost" size="sm" onClick={() => handleUnassign(a.workerId)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {(!job.assignments || job.assignments.length === 0) && (
              <p className="text-sm text-muted-foreground">No workers assigned</p>
            )}

            {job.status === "PENDING" && workers && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Assign workers:</p>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {workers.filter((w) => w.isActive && !assignedIds.includes(w.id)).map((w) => (
                    <button
                      key={w.id}
                      className="w-full rounded p-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => handleAssign(w.id)}
                    >
                      + {w.firstName} {w.lastName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deposit section */}
      {job.depositAmount && job.depositAmount > 0 && (
        <Card className={job.isDepositPaid ? "border-emerald-200" : "border-orange-200"}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Deposit
              </CardTitle>
              {job.isDepositPaid ? (
                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Paid
                </span>
              ) : (
                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                  Unpaid
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              Amount: <span className="font-semibold">€{(job.depositAmount / 100).toFixed(2)}</span>
            </p>
            {!job.isDepositPaid && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSendDepositLink}
                  disabled={generateDepositLink.isPending}
                >
                  <MessageCircle className="mr-1 h-4 w-4" />
                  {generateDepositLink.isPending ? "Generating..." : "Send Deposit Link"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkDepositPaid}
                  disabled={markDepositPaid.isPending}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Mark as Paid
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {job.status === "PENDING" && (
          <Button variant="destructive" onClick={handleCancel} disabled={cancelJob.isPending}>
            Cancel Job
          </Button>
        )}
        {job.status === "COMPLETED" && (
          <>
            <Button onClick={handleGenerateInvoice} disabled={generateInvoice.isPending}>
              <FileText className="mr-2 h-4 w-4" />
              {generateInvoice.isPending ? "Generating..." : "Generate Invoice"}
            </Button>
            {job.customer?.phone && (
              <Button variant="outline" onClick={handleWhatsApp}>
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
