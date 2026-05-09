"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useJobs, useUpdateJob } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  addWeeks,
  addMonths,
  addDays,
  addHours,
  setHours,
  setMinutes,
  format,
  isSameDay,
  isSameHour,
  isSameMonth,
  isToday,
  getDay,
  getDaysInMonth,
  parseISO,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type ViewMode = "day" | "week" | "month";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-300",
};

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00–22:00

function JobCard({ job, compact }: { job: any; compact?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: job.id, data: { job } });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined;

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={style}
        className={cn(
          "cursor-grab active:cursor-grabbing rounded border px-1.5 py-0.5 text-[10px] leading-tight truncate touch-manipulation",
          statusColors[job.status],
          isDragging && "opacity-50 shadow-lg"
        )}
        title={job.customer?.name + (job.isRecurring ? " (recurring)" : "")}
      >
        {job.isRecurring && <RefreshCw className="inline h-2.5 w-2.5 mr-0.5 text-purple-600" />}
        {job.customer?.name || "—"}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing rounded border px-2 py-1.5 text-xs touch-manipulation",
        statusColors[job.status] || "bg-gray-100",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-center gap-1">
        {job.isRecurring && <RefreshCw className="h-3 w-3 text-purple-600 shrink-0" />}
        <p className="font-medium truncate">{job.customer?.name || "No customer"}</p>
      </div>
      <p className="text-muted-foreground">
        {format(parseISO(job.scheduledStart), "HH:mm")}
        {job.estimatedDuration && ` · ${job.estimatedDuration}min`}
      </p>
      {job.assignments?.[0]?.worker && (
        <p className="text-muted-foreground truncate">
          {job.assignments[0].worker.firstName} {job.assignments[0].worker.lastName}
        </p>
      )}
    </div>
  );
}

/* ───────── Day View ───────── */

function HourSlot({
  date,
  jobs,
  onEmptyClick,
}: {
  date: Date;
  jobs: any[];
  onEmptyClick: (date: Date) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: date.toISOString() });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[40px] border-t border-dashed border-muted px-1 py-0.5 space-y-0.5 transition-colors",
        isOver && "bg-primary/10 border-primary"
      )}
      onDoubleClick={() => onEmptyClick(date)}
    >
      {jobs.map((job) => (
        <Link key={job.id} href={`/jobs/${job.id}`} className="block">
          <JobCard job={job} />
        </Link>
      ))}
    </div>
  );
}

/* ───────── Week View ───────── */

function DayColumn({
  date,
  jobs,
  onEmptyClick,
}: {
  date: Date;
  jobs: any[];
  onEmptyClick: (date: Date) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: date.toISOString() });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[200px] rounded-lg border border-dashed p-2 space-y-1 transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-transparent hover:border-muted-foreground/30"
      )}
      onDoubleClick={() => onEmptyClick(date)}
    >
      {jobs.length === 0 && (
        <button
          onClick={() => onEmptyClick(date)}
          className="w-full py-8 text-center text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <Plus className="mx-auto h-4 w-4 mb-1" />
          Add job
        </button>
      )}
      {jobs.map((job) => (
        <Link key={job.id} href={`/jobs/${job.id}`} className="block">
          <JobCard job={job} />
        </Link>
      ))}
    </div>
  );
}

/* ───────── Month View ───────── */

function MonthCell({
  date,
  jobs,
  isOutsideMonth,
  onEmptyClick,
  onDayClick,
}: {
  date: Date;
  jobs: any[];
  isOutsideMonth: boolean;
  onEmptyClick: (date: Date) => void;
  onDayClick: (date: Date) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: date.toISOString() });

  return (
    <div
      ref={setNodeRef}
      onClick={() => onDayClick(date)}
      className={cn(
        "min-h-[80px] border-r border-b p-0.5 cursor-pointer transition-colors",
        isOutsideMonth && "bg-muted/30 text-muted-foreground",
        isToday(date) && "bg-primary/5",
        isOver && "ring-2 ring-primary"
      )}
      onDoubleClick={(e) => { e.stopPropagation(); onEmptyClick(date); }}
    >
      <p className={cn(
        "text-xs font-medium px-1 py-0.5",
        isToday(date) && "rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center"
      )}>
        {format(date, "d")}
      </p>
      <div className="space-y-0.5">
        {jobs.slice(0, 3).map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="block" onClick={(e) => e.stopPropagation()}>
            <JobCard job={job} compact />
          </Link>
        ))}
        {jobs.length > 3 && (
          <p className="text-[10px] text-muted-foreground px-1">+{jobs.length - 3} more</p>
        )}
      </div>
    </div>
  );
}

/* ───────── Calendar Page ───────── */

const viewTabs: { mode: ViewMode; label: string }[] = [
  { mode: "day", label: "Day" },
  { mode: "week", label: "Week" },
  { mode: "month", label: "Month" },
];

export default function CalendarPage() {
  const router = useRouter();
  const updateJob = useUpdateJob();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [offset, setOffset] = useState(0);

  const today = new Date();
  let anchor: Date;
  if (viewMode === "day") anchor = addDays(today, offset);
  else if (viewMode === "month") anchor = addMonths(today, offset);
  else anchor = addWeeks(today, offset);

  // Compute date ranges per view
  let fromDate: string;
  let toDate: string;

  if (viewMode === "day") {
    fromDate = format(startOfDay(anchor), "yyyy-MM-dd'T'HH:mm");
    toDate = format(endOfDay(anchor), "yyyy-MM-dd'T'HH:mm");
  } else if (viewMode === "month") {
    const ms = startOfMonth(anchor);
    const me = endOfMonth(anchor);
    // Expand slightly to include padding days
    const padStart = getDay(ms); // 0=Sun
    fromDate = format(addDays(ms, -padStart), "yyyy-MM-dd");
    const padEnd = 6 - getDay(me);
    toDate = format(addDays(me, padEnd), "yyyy-MM-dd");
  } else {
    fromDate = format(startOfWeek(anchor, { weekStartsOn: 1 }), "yyyy-MM-dd");
    toDate = format(endOfWeek(anchor, { weekStartsOn: 1 }), "yyyy-MM-dd");
  }

  const { data, isLoading } = useJobs({ fromDate, toDate });

  /* ── Day view data ── */
  const dayJobsByHour = useMemo(() => {
    if (viewMode !== "day") return new Map();
    const map = new Map<string, any[]>();
    HOURS.forEach((h) => map.set(h.toString(), []));
    (data?.data ?? []).forEach((job: any) => {
      if (job.status === "CANCELLED") return;
      const h = parseISO(job.scheduledStart).getHours();
      if (HOURS.includes(h)) map.get(h.toString())?.push(job);
    });
    return map;
  }, [data, viewMode]);

  /* ── Week view data ── */
  const weekDays = useMemo(() => {
    const ws = startOfWeek(anchor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  }, [anchor]);

  const weekJobsByDay = useMemo(() => {
    if (viewMode !== "week") return new Map();
    const map = new Map<string, any[]>();
    weekDays.forEach((d) => map.set(d.toISOString(), []));
    (data?.data ?? []).forEach((job: any) => {
      if (job.status === "CANCELLED") return;
      const d = new Date(job.scheduledStart);
      const key = weekDays.find((day) => isSameDay(day, d))?.toISOString();
      if (key) map.get(key)?.push(job);
    });
    return map;
  }, [data, viewMode, weekDays]);

  /* ── Month view data ── */
  const monthCells = useMemo(() => {
    if (viewMode !== "month") return [];
    const ms = startOfMonth(anchor);
    const me = endOfMonth(anchor);
    const startDay = getDay(ms); // 0=Sun
    const gridStart = addDays(ms, -startDay);
    const totalDays = startDay + getDaysInMonth(anchor);
    const rows = Math.ceil(totalDays / 7);
    return Array.from({ length: rows * 7 }, (_, i) => addDays(gridStart, i));
  }, [anchor, viewMode]);

  const monthJobsByDay = useMemo(() => {
    if (viewMode !== "month") return new Map();
    const map = new Map<string, any[]>();
    monthCells.forEach((d) => map.set(d.toISOString(), []));
    (data?.data ?? []).forEach((job: any) => {
      if (job.status === "CANCELLED") return;
      const d = new Date(job.scheduledStart);
      const key = monthCells.find((cell) => isSameDay(cell, d))?.toISOString();
      if (key) map.get(key)?.push(job);
    });
    return map;
  }, [data, viewMode, monthCells]);

  /* ── Drag handler ── */
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    const job = active.data.current?.job;
    if (!job) return;

    const targetDate = new Date(over.id);
    const oldDate = new Date(job.scheduledStart);
    targetDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);

    updateJob.mutateAsync({
      id: job.id,
      scheduledStart: targetDate.toISOString(),
    }).then(() => {
      toast.success("Job rescheduled");
    }).catch((err: any) => {
      toast.error(err?.message || "Failed to reschedule");
    });
  };

  /* ── Day view: drag to specific hour ── */
  const handleDayDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    const job = active.data.current?.job;
    if (!job) return;

    const targetDate = new Date(over.id);
    const oldDate = new Date(job.scheduledStart);
    targetDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);

    updateJob.mutateAsync({
      id: job.id,
      scheduledStart: targetDate.toISOString(),
    }).then(() => {
      toast.success("Job rescheduled");
    }).catch((err: any) => {
      toast.error(err?.message || "Failed to reschedule");
    });
  };

  const handleEmptyClick = (date: Date) => {
    const d = format(date, "yyyy-MM-dd'T'HH:mm");
    router.push(`/jobs/new?date=${encodeURIComponent(d)}`);
  };

  /* ── Navigation labels ── */
  let navLabel: string;
  if (viewMode === "day") {
    navLabel = format(anchor, "EEEE, MMM d, yyyy");
  } else if (viewMode === "month") {
    navLabel = format(anchor, "MMMM yyyy");
  } else {
    const ws = startOfWeek(anchor, { weekStartsOn: 1 });
    const we = endOfWeek(anchor, { weekStartsOn: 1 });
    navLabel = `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
  }

  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    setOffset(0);
  };

  const navigateBack = () => setOffset((o) => o - 1);
  const navigateForward = () => setOffset((o) => o + 1);

  /* ── JSX ── */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Schedule</h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/jobs">
              <List className="mr-1 h-4 w-4" />
              List
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOffset(0)}>Today</Button>
          <Button variant="ghost" size="icon" onClick={navigateBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={navigateForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[180px] text-center">{navLabel}</span>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 border-b">
        {viewTabs.map((tab) => (
          <button
            key={tab.mode}
            onClick={() => switchView(tab.mode)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              viewMode === tab.mode
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <Skeleton className="h-[500px]" />
      ) : (
        <>
          {/* ── DAY VIEW ── */}
          {viewMode === "day" && (
            <DndContext onDragEnd={handleDayDragEnd}>
              <div className="border rounded-lg overflow-hidden">
                {HOURS.map((hour) => {
                  const slotDate = setMinutes(setHours(anchor, hour), 0);
                  const jobs = dayJobsByHour.get(hour.toString()) || [];
                  return (
                    <div key={hour} className="flex">
                      <div className="w-16 shrink-0 py-2 pr-2 text-right text-xs text-muted-foreground border-r border-dashed">
                        {String(hour).padStart(2, "0")}:00
                      </div>
                      <HourSlot
                        date={slotDate}
                        jobs={jobs}
                        onEmptyClick={handleEmptyClick}
                      />
                    </div>
                  );
                })}
              </div>
            </DndContext>
          )}

          {/* ── WEEK VIEW ── */}
          {viewMode === "week" && (
            <DndContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <div key={day.toISOString()}>
                    <div className="text-center mb-2">
                      <p className={cn("text-sm font-medium", isToday(day) && "text-primary")}>
                        {format(day, "EEE")}
                      </p>
                      <p className={cn(
                        "text-xs",
                        isToday(day) ? "text-primary font-bold" : "text-muted-foreground"
                      )}>
                        {format(day, "d")}
                      </p>
                    </div>
                    <DayColumn
                      date={day}
                      jobs={weekJobsByDay.get(day.toISOString()) || []}
                      onEmptyClick={handleEmptyClick}
                    />
                  </div>
                ))}
              </div>
            </DndContext>
          )}

          {/* ── MONTH VIEW ── */}
          {viewMode === "month" && (
            <DndContext onDragEnd={handleDragEnd}>
              <div className="border-t border-l">
                {/* Day-of-week headers */}
                <div className="grid grid-cols-7">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-xs font-medium text-muted-foreground text-center py-1 border-r border-b bg-muted/30">
                      {d}
                    </div>
                  ))}
                </div>
                {/* Cells */}
                <div className="grid grid-cols-7">
                  {monthCells.map((cellDate) => (
                    <MonthCell
                      key={cellDate.toISOString()}
                      date={cellDate}
                      jobs={monthJobsByDay.get(cellDate.toISOString()) || []}
                      isOutsideMonth={!isSameMonth(cellDate, anchor)}
                      onEmptyClick={handleEmptyClick}
                      onDayClick={(d) => { switchView("day"); }}
                    />
                  ))}
                </div>
              </div>
            </DndContext>
          )}
        </>
      )}
    </div>
  );
}
