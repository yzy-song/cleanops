"use client";

import { useState, useMemo } from "react";
import { useJobs, useAssignWorkers } from "@/hooks/use-jobs";
import { useWorkers } from "@/hooks/use-workers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { GoogleMap, Marker, InfoWindow, Polyline, useLoadScript } from "@react-google-maps/api";
import { format, parseISO, addDays, subDays } from "date-fns";
import { Navigation, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const mapContainerStyle = { width: "100%", height: "calc(100vh - 340px)" };
const dublinCenter = { lat: 53.3498, lng: -6.2603 };

const BLUE_MARKER = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
const GRAY_MARKER = "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";

const WORKER_ROUTE_COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c",
  "#0891b2", "#be185d", "#65a30d", "#d97706", "#4f46e5",
];

export default function MapPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [assignWorkerId, setAssignWorkerId] = useState("");

  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useJobs({
    fromDate: date,
    toDate: date,
  });

  const { data: workersData } = useWorkers();
  const assignWorkers = useAssignWorkers();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const jobs = useMemo(() => {
    const list = jobsData?.data ?? [];
    return list.filter(
      (j: any) => j.status !== "CANCELLED" && j.customer?.lat && j.customer?.lng
    );
  }, [jobsData]);

  const workers = useMemo(() => (workersData ?? []) as any[], [workersData]);

  const dayOfWeek = new Date(date + "T00:00:00").getDay();

  const workerDayStats = useMemo(() => {
    return workers.map((w: any) => {
      const workDays: number[] = w.workDays ?? [1, 2, 3, 4, 5];
      const isWorkDay = workDays.includes(dayOfWeek);
      const assignedCount = jobs.filter((j: any) =>
        j.assignments?.some((a: any) => a.workerId === w.id)
      ).length;
      return {
        id: w.id,
        name: `${w.firstName} ${w.lastName}`,
        initial: (w.firstName?.[0] || "") + (w.lastName?.[0] || ""),
        assignedCount,
        isWorkDay,
      };
    });
  }, [workers, jobs, dayOfWeek]);

  const handleAssign = async () => {
    if (!selectedJob || !assignWorkerId) return;
    try {
      await assignWorkers.mutateAsync({
        id: selectedJob.id,
        workerIds: [assignWorkerId],
      });
      toast.success("Worker assigned");
      setSelectedJob(null);
      setAssignWorkerId("");
      refetchJobs();
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign");
    }
  };

  const workerRoutes = useMemo(() => {
    const routes: { workerId: string; color: string; path: { lat: number; lng: number }[] }[] = [];
    const assignedWorkers = new Map<string, any[]>();

    for (const job of jobs) {
      const workerId = job.assignments?.[0]?.workerId;
      if (workerId && job.customer?.lat && job.customer?.lng) {
        if (!assignedWorkers.has(workerId)) assignedWorkers.set(workerId, []);
        assignedWorkers.get(workerId)!.push(job);
      }
    }

    let colorIdx = 0;
    for (const [workerId, workerJobs] of assignedWorkers) {
      if (workerJobs.length < 2) continue;
      // Sort by nearest-neighbor from a simple greedy approach
      const path: { lat: number; lng: number }[] = workerJobs.map((j: any) => ({
        lat: j.customer.lat,
        lng: j.customer.lng,
      }));
      routes.push({
        workerId,
        color: WORKER_ROUTE_COLORS[colorIdx % WORKER_ROUTE_COLORS.length],
        path,
      });
      colorIdx++;
    }
    return routes;
  }, [jobs]);

  const dateStr = useMemo(() => format(new Date(date + "T00:00:00"), "EEE, MMM d"), [date]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Map</h1>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local to enable the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Map</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => { setDate(format(subDays(new Date(date + "T00:00:00"), 1), "yyyy-MM-dd")); setSelectedJob(null); }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setSelectedJob(null); }}
            className="h-9 w-36"
          />
          <Button variant="outline" size="sm" onClick={() => { setDate(format(new Date(), "yyyy-MM-dd")); setSelectedJob(null); }}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => { setDate(format(addDays(new Date(date + "T00:00:00"), 1), "yyyy-MM-dd")); setSelectedJob(null); }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium text-sm text-foreground">{dateStr}</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Assigned
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-purple-400 inline-block" /> Unassigned
        </span>
        <span className="ml-auto">
          {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Map */}
      {jobsLoading || !isLoaded ? (
        <Skeleton className="w-full" style={{ height: "calc(100vh - 340px)" }} />
      ) : (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={12}
          center={jobs[0]?.customer?.lat ? { lat: jobs[0].customer.lat!, lng: jobs[0].customer.lng! } : dublinCenter}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {/* Worker route polylines */}
          {workerRoutes.map((route) => (
            <Polyline
              key={route.workerId}
              path={route.path}
              options={{
                strokeColor: route.color,
                strokeWeight: 3,
                strokeOpacity: 0.6,
                icons: [
                  {
                    icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                    offset: "50%",
                  },
                ],
              }}
            />
          ))}

          {jobs.map((job: any) => {
            const isAssigned = job.assignments?.length > 0;
            const workerName = isAssigned
              ? `${job.assignments[0].worker.firstName} ${job.assignments[0].worker.lastName}`
              : null;

            return (
              <Marker
                key={job.id}
                position={{ lat: job.customer.lat, lng: job.customer.lng }}
                icon={isAssigned ? BLUE_MARKER : GRAY_MARKER}
                label={
                  isAssigned
                    ? {
                        text: job.customer.name,
                        className: "map-marker-label",
                        color: "#2563eb",
                        fontSize: "11px",
                        fontWeight: "600",
                      }
                    : {
                        text: job.customer.name,
                        className: "map-marker-label",
                        color: "#6b7280",
                        fontSize: "11px",
                        fontWeight: "500",
                      }
                }
                onClick={() => { setSelectedJob(job); setAssignWorkerId(""); }}
              />
            );
          })}

          {selectedJob && (
            <InfoWindow
              position={{ lat: selectedJob.customer.lat, lng: selectedJob.customer.lng }}
              onCloseClick={() => { setSelectedJob(null); setAssignWorkerId(""); }}
            >
              <div className="text-sm min-w-[200px]">
                <p className="font-semibold text-base">{selectedJob.customer.name}</p>
                <p className="text-muted-foreground">{selectedJob.customer.address}</p>
                {selectedJob.customer.postalCode && (
                  <p className="text-muted-foreground">{selectedJob.customer.postalCode}</p>
                )}
                <hr className="my-1" />
                <p>
                  {format(parseISO(selectedJob.scheduledStart), "HH:mm")}
                  {selectedJob.estimatedDuration && ` · ${selectedJob.estimatedDuration} min`}
                </p>
                <p>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-muted">
                    {selectedJob.status}
                  </span>
                </p>

                {selectedJob.assignments?.length > 0 ? (
                  <>
                    <p className="mt-1 font-medium">
                      {selectedJob.assignments[0].worker.firstName}{" "}
                      {selectedJob.assignments[0].worker.lastName}
                    </p>
                  </>
                ) : (
                  <div className="mt-2 space-y-2">
                    <select
                      value={assignWorkerId}
                      onChange={(e) => setAssignWorkerId(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      <option value="">Select worker...</option>
                      {workers
                        .filter((w: any) => w.isActive)
                        .map((w: any) => (
                          <option key={w.id} value={w.id}>
                            {w.firstName} {w.lastName}
                          </option>
                        ))}
                    </select>
                    <Button size="sm" className="w-full" disabled={!assignWorkerId || assignWorkers.isPending} onClick={handleAssign}>
                      {assignWorkers.isPending ? "Assigning..." : "Assign"}
                    </Button>
                  </div>
                )}

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedJob.customer.lat},${selectedJob.customer.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                >
                  <Navigation className="h-3 w-3" />
                  Navigate
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      )}

      {/* Worker Panel */}
      <div className="border-t pt-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Workers — {dateStr}
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {workerDayStats.map((w) => (
            <div
              key={w.id}
              className={`flex-shrink-0 w-28 rounded-lg border p-2 text-center ${
                !w.isWorkDay
                  ? "bg-muted/50 border-muted"
                  : w.assignedCount > 0
                    ? "bg-blue-50 border-blue-200"
                    : "bg-emerald-50 border-emerald-200"
              }`}
            >
              <div
                className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  !w.isWorkDay
                    ? "bg-muted-foreground/20 text-muted-foreground"
                    : w.assignedCount > 0
                      ? "bg-blue-500 text-white"
                      : "bg-emerald-500 text-white"
                }`}
              >
                {w.initial}
              </div>
              <p className="text-xs mt-1 truncate">{w.name.split(" ")[0]}</p>
              <p className="text-[10px] text-muted-foreground">
                {!w.isWorkDay ? "Off" : `${w.assignedCount} job${w.assignedCount !== 1 ? "s" : ""}`}
              </p>
            </div>
          ))}
          {workerDayStats.length === 0 && (
            <p className="text-xs text-muted-foreground">No workers yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
