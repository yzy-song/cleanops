"use client";

import Link from "next/link";
import { useState } from "react";
import { useJobs, useCancelJob, useSendInvoice, type JobQuery } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, MapPin, Clock, XCircle, Mail, RefreshCw, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function JobsPage() {
  const [filter, setFilter] = useState<string>("");
  const query: JobQuery = filter ? { status: filter } : {};
  const { data, isLoading } = useJobs(query);
  const cancelJob = useCancelJob();
  const sendInvoice = useSendInvoice();

  const jobs = data?.data ?? [];

  const handleSendInvoice = async (id: string) => {
    try {
      await sendInvoice.mutateAsync(id);
      toast.success("Invoice email sent");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send invoice");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this job?")) return;
    try {
      await cancelJob.mutateAsync(id);
      toast.success("Job cancelled");
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel job");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/jobs/calendar">
              <Calendar className="mr-1 h-4 w-4" />
              Calendar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {["", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s || "All"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs?.map((job: any) => (
            <Card key={job.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                        {job.customer?.name ?? "Unknown"}
                      </Link>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[job.status] || "bg-gray-100")}>
                        {job.status}
                      </span>
                      {job.isRecurring && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {job.recurrenceRule === "BI-WEEKLY" ? "2W" : "1W"}
                        </span>
                      )}
                      {job.depositAmount > 0 && !job.isDepositPaid && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          Deposit €{(job.depositAmount / 100).toFixed(0)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(job.scheduledStart).toLocaleDateString()}
                      </span>
                      {job.estimatedDuration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {job.estimatedDuration} min
                        </span>
                      )}
                      {job.customer?.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.customer.address}
                        </span>
                      )}
                    </div>
                    {job.assignments?.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Workers: {job.assignments.map((a: any) => `${a.worker?.firstName || ""} ${a.worker?.lastName || ""}`.trim() || a.worker?.user?.email).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {job.status === "COMPLETED" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSendInvoice(job.id)}
                      disabled={sendInvoice.isPending}
                      title="Send invoice email"
                    >
                      <Mail className="h-4 w-4 text-primary" />
                    </Button>
                  )}
                  {job.status === "PENDING" && (
                    <Button variant="ghost" size="icon" onClick={() => handleCancel(job.id)}>
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!jobs?.length && (
            <div className="py-8 text-center text-muted-foreground">
              No jobs found. <Link href="/jobs/new" className="text-primary hover:underline">Create your first job</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
