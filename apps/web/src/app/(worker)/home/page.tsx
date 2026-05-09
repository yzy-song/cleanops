"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function WorkerHomePage() {
  const router = useRouter();
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["worker", "my-jobs"],
    queryFn: async () => {
      const res = await api.get("/worker/me/jobs");
      return res.data.data;
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const todayJobs = (jobs || []).filter((j: any) =>
    j.scheduledStart?.startsWith(today)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Jobs</h1>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : todayJobs.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Today&apos;s jobs</h2>
          {todayJobs.map((job: any) => (
            <Card
              key={job.id}
              className="cursor-pointer active:scale-[0.98] transition-transform touch-manipulation"
              onClick={() => router.push(`/job/${job.id}`)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{job.customer?.name}</span>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-xs font-medium shrink-0", statusColors[job.status] || "bg-gray-100")}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(job.scheduledStart).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })}</span>
                    {job.estimatedDuration && <span>&middot; {job.estimatedDuration} min</span>}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{job.customer?.address}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">No jobs scheduled for today</p>
        </div>
      )}

      {(jobs || []).filter((j: any) => !j.scheduledStart?.startsWith(today)).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Upcoming</h2>
          {(jobs || [])
            .filter((j: any) => !j.scheduledStart?.startsWith(today))
            .map((job: any) => (
              <Card
                key={job.id}
                className="cursor-pointer active:scale-[0.98] transition-transform touch-manipulation"
                onClick={() => router.push(`/job/${job.id}`)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{job.customer?.name}</span>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-xs font-medium shrink-0", statusColors[job.status] || "bg-gray-100")}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(job.scheduledStart).toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })}
                      {job.customer?.address && <> &middot; {job.customer.address}</>}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
