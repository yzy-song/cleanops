"use client";

import Link from "next/link";
import { useState } from "react";
import { useJobs, useCancelJob, useSendInvoice, type JobQuery } from "@/hooks/use-jobs";
import { useWorkers } from "@/hooks/use-workers";
import { NewJobSheet } from "@/components/job/new-job-sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, MapPin, Clock, XCircle, Mail, RefreshCw, Wallet, Wand2, FileText, CheckSquare, Square, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { format, addDays, startOfWeek } from "date-fns";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function JobsPage() {
  const [filter, setFilter] = useState<string>("");
  const query: JobQuery = filter ? { status: filter } : {};
  const { data, isLoading, refetch } = useJobs(query);
  const { data: workers } = useWorkers();
  const cancelJob = useCancelJob();
  const sendInvoice = useSendInvoice();

  // Auto-schedule state
  const nextMonday = format(startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const nextSunday = format(addDays(new Date(nextMonday + "T00:00:00"), 6), "yyyy-MM-dd");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleStart, setScheduleStart] = useState(nextMonday);
  const [scheduleEnd, setScheduleEnd] = useState(nextSunday);
  const [scheduleResult, setScheduleResult] = useState<any[] | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [applying, setApplying] = useState(false);
  const [jobSheetOpen, setJobSheetOpen] = useState(false);

  // Batch selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);
  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    const all = data?.data?.map((j: any) => j.id) || [];
    setSelected(selected.size === all.length ? new Set() : new Set(all));
  };

  const handleBatchAssign = async (workerId: string) => {
    setBatchBusy(true);
    try {
      await api.post("/jobs/batch/assign", { jobIds: [...selected], workerId });
      toast.success(`Assigned ${selected.size} job(s)`);
      setSelected(new Set());
      refetch();
    } catch { toast.error("Batch assign failed"); }
    finally { setBatchBusy(false); }
  };

  const handleBatchInvoice = async () => {
    setBatchBusy(true);
    try {
      const res = await api.post("/jobs/batch/invoice", { jobIds: [...selected] });
      toast.success(`Invoiced ${res.data.count}/${selected.size} job(s)`);
      setSelected(new Set());
      refetch();
    } catch { toast.error("Batch invoice failed"); }
    finally { setBatchBusy(false); }
  };

  const handleBatchCancel = async () => {
    if (!confirm(`Cancel ${selected.size} job(s)?`)) return;
    setBatchBusy(true);
    try {
      await api.post("/jobs/batch/cancel", { jobIds: [...selected] });
      toast.success(`Cancelled ${selected.size} job(s)`);
      setSelected(new Set());
      refetch();
    } catch { toast.error("Batch cancel failed"); }
    finally { setBatchBusy(false); }
  };

  const handleExportCsv = () => {
    window.open(`http://localhost:3000/jobs/export/csv`, "_blank");
  };

  const handlePreview = async () => {
    setScheduling(true);
    setScheduleResult(null);
    try {
      const res = await api.post("/jobs/auto-schedule", {
        startDate: scheduleStart,
        endDate: scheduleEnd,
      });
      setScheduleResult(res.data);
    } catch (err: any) {
      toast.error(err?.message || "Scheduling failed");
    } finally {
      setScheduling(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await api.post("/jobs/auto-schedule/apply", {
        startDate: scheduleStart,
        endDate: scheduleEnd,
      });
      toast.success(`${res.data.applied} job(s) assigned`);
      setScheduleOpen(false);
      setScheduleResult(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

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
          <Button variant="outline" size="sm" onClick={() => { setScheduleOpen(true); setScheduleResult(null); }}>
            <Wand2 className="mr-1 h-4 w-4" />
            Auto Schedule
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/jobs/calendar">
              <Calendar className="mr-1 h-4 w-4" />
              Calendar
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <FileText className="mr-1 h-4 w-4" />
            CSV
          </Button>
          <Button onClick={() => setJobSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      </div>

      {/* Batch action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-800">{selected.size} selected</span>
          <Select onValueChange={(wid) => handleBatchAssign(wid)} disabled={batchBusy}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Assign to..." /></SelectTrigger>
              <SelectContent>
                {workers?.filter((w: any) => w.isActive).map((w: any) => (
                  <SelectItem key={w.id} value={w.id}>{w.firstName} {w.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          <Button variant="outline" size="sm" onClick={handleBatchInvoice} disabled={batchBusy}>
            <Mail className="mr-1 h-3.5 w-3.5" /> Invoice All
          </Button>
          <Button variant="outline" size="sm" onClick={handleBatchCancel} disabled={batchBusy} className="text-red-600 border-red-200 hover:bg-red-50">
            <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel All
          </Button>
          <button className="ml-auto text-sm text-blue-600 hover:underline" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <button onClick={toggleAll} className="mr-1 shrink-0" title="Select all">
          {selected.size > 0 && selected.size === (data?.data?.length || 0)
            ? <CheckSquare className="h-5 w-5 text-primary" />
            : <Square className="h-5 w-5 text-muted-foreground" />}
        </button>
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
            <Card key={job.id} className={selected.has(job.id) ? "ring-2 ring-primary" : ""}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-start gap-4">
                  <button onClick={() => toggleSelect(job.id)} className="mt-2 shrink-0">
                    {selected.has(job.id)
                      ? <CheckSquare className="h-5 w-5 text-primary" />
                      : <Square className="h-5 w-5 text-muted-foreground" />}
                  </button>
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
              No jobs found. <button onClick={() => setJobSheetOpen(true)} className="text-primary hover:underline">Create your first job</button>
            </div>
          )}
        </div>
      )}

      {/* Auto Schedule Modal */}
      {scheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setScheduleOpen(false)}>
          <div className="bg-background rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Auto Schedule</h2>
              <Button variant="ghost" size="icon" onClick={() => setScheduleOpen(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-end gap-3 mb-4">
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} className="h-9" />
              </div>
              <Button onClick={handlePreview} disabled={scheduling}>
                {scheduling ? "Calculating..." : "Preview"}
              </Button>
            </div>

            {scheduleResult && (
              <div className="space-y-4">
                {scheduleResult.map((day: any) => (
                  <Card key={day.date}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-2">
                        {format(new Date(day.date + "T00:00:00"), "EEE, MMM d")}
                      </h3>

                      {day.assigned?.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {day.assigned.map((a: any) => (
                            <div key={a.workerId} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{a.workerName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {a.totalDuration}min work + {a.travelMinutes}min travel = {a.totalMinutes}min
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {a.jobs.map((j: any) => (
                                  <span key={j.jobId} className="text-xs bg-background rounded px-2 py-0.5 border">
                                    {j.order}. {j.customerName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {day.unassigned?.length > 0 && (
                        <div className="text-xs text-orange-600 bg-orange-50 rounded p-2">
                          Unassigned: {day.unassigned.map((u: any) => u.customerName).join(", ")}
                        </div>
                      )}

                      {!day.assigned?.length && !day.unassigned?.length && (
                        <p className="text-xs text-muted-foreground">No jobs this day</p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setScheduleResult(null); setScheduleOpen(false); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleApply} disabled={applying}>
                    {applying ? "Applying..." : "Confirm & Apply"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <NewJobSheet open={jobSheetOpen} onOpenChange={setJobSheetOpen} onCreated={() => refetch()} />
    </div>
  );
}
