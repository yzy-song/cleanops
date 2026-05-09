"use client";

import { useState, useMemo } from "react";
import { useJobs } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";
import { format, parseISO } from "date-fns";
import { Navigation, Route } from "lucide-react";

const mapContainerStyle = { width: "100%", height: "calc(100vh - 160px)" };
const dublinCenter = { lat: 53.3498, lng: -6.2603 };

const markerColors: Record<string, string> = {
  PENDING: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  IN_PROGRESS: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  COMPLETED: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
  CANCELLED: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
};

export default function MapPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const { data: jobsData, isLoading: jobsLoading } = useJobs({
    fromDate: date,
    toDate: date,
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const jobs = useMemo(() => {
    const list = jobsData?.data ?? [];
    return list.filter(
      (j: any) => j.status !== "CANCELLED" && j.customer?.lat && j.customer?.lng
    );
  }, [jobsData]);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Map</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <Label htmlFor="map-date" className="text-xs sr-only">Date</Label>
            <Input
              id="map-date"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setSelectedJob(null); }}
              className="h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => { setDate(format(new Date(), "yyyy-MM-dd")); }}>
            Today
          </Button>
          {jobs.length > 1 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const addresses = jobs
                  .filter((j: any) => j.customer?.address)
                  .map((j: any) => encodeURIComponent(j.customer.address));
                if (addresses.length >= 2) {
                  window.open(
                    `https://www.google.com/maps/dir/${addresses.join("/")}`,
                    "_blank"
                  );
                }
              }}
            >
              <Route className="mr-1 h-4 w-4" />
              Route ({jobs.length})
            </Button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Pending
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> In Progress
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Completed
        </span>
        <span className="ml-auto text-xs">
          {jobs.length} job{jobs.length !== 1 ? "s" : ""} on {format(new Date(date + "T00:00:00"), "MMM d")}
        </span>
      </div>

      {jobsLoading || !isLoaded ? (
        <Skeleton className="w-full" style={{ height: "calc(100vh - 260px)" }} />
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
          {jobs.map((job: any) => (
            <Marker
              key={job.id}
              position={{ lat: job.customer.lat, lng: job.customer.lng }}
              icon={markerColors[job.status] || markerColors.PENDING}
              title={job.customer.name}
              onClick={() => setSelectedJob(job)}
            />
          ))}

          {selectedJob && (
            <InfoWindow
              position={{ lat: selectedJob.customer.lat, lng: selectedJob.customer.lng }}
              onCloseClick={() => setSelectedJob(null)}
            >
              <div className="text-sm min-w-[180px]">
                <p className="font-semibold text-base">{selectedJob.customer.name}</p>
                <p className="text-muted-foreground">{selectedJob.customer.address}</p>
                {selectedJob.customer.eircode && (
                  <p className="text-muted-foreground">{selectedJob.customer.eircode}</p>
                )}
                <hr className="my-1" />
                <p>
                  {format(parseISO(selectedJob.scheduledStart), "HH:mm")}
                  {selectedJob.estimatedDuration && ` · ${selectedJob.estimatedDuration} min`}
                </p>
                {selectedJob.assignments?.[0]?.worker && (
                  <p>
                    {selectedJob.assignments[0].worker.firstName}{" "}
                    {selectedJob.assignments[0].worker.lastName}
                  </p>
                )}
                <p className="mt-1">
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-muted">
                    {selectedJob.status}
                  </span>
                </p>
                {selectedJob.customer.lat && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedJob.customer.lat},${selectedJob.customer.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
                  >
                    <Navigation className="h-3 w-3" />
                    Navigate
                  </a>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      )}
    </div>
  );
}
