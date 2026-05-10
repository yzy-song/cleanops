"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckInButton } from "@/components/worker/check-in-button";
import { CheckOutButton } from "@/components/worker/check-out-button";
import { ArrowLeft, Calendar, Clock, MapPin, Phone, Camera, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const MAX_BEFORE = 5;
const MAX_AFTER = 5;

export default function WorkerJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ["worker", "jobs", id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const [photos, setPhotos] = useState<any[]>([]);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const fileRefBefore = useRef<HTMLInputElement>(null);
  const fileRefAfter = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    try {
      const res = await api.get(`/jobs/${id}/photos`);
      setPhotos(res.data.data || []);
    } catch {}
  };

  useEffect(() => { fetchPhotos(); }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxFiles = type === 'AFTER' ? MAX_AFTER : MAX_BEFORE;
    const existingCount = photos.filter((p) => p.type === type || (!p.type && type === 'BEFORE')).length;
    const available = maxFiles - existingCount;

    if (available <= 0) {
      toast.error(`Maximum ${maxFiles} ${type.toLowerCase()} photos already uploaded`);
      return;
    }

    const toUpload = files.slice(0, available);
    if (files.length > available) {
      toast.warning(`Only ${available} more ${type.toLowerCase()} photo(s) allowed. Uploading first ${available}.`);
    }

    if (type === 'AFTER') setUploadingAfter(true);
    else setUploadingBefore(true);

    let success = 0;
    let failed = 0;

    for (const file of toUpload) {
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("type", type);
        await api.post(`/jobs/${id}/photos`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        success++;
      } catch {
        failed++;
      }
    }

    if (success > 0) {
      toast.success(`${success} photo(s) uploaded`);
      fetchPhotos();
    }
    if (failed > 0) {
      toast.error(`${failed} photo(s) failed`);
    }

    setUploadingBefore(false);
    setUploadingAfter(false);
    if (fileRefBefore.current) fileRefBefore.current.value = "";
    if (fileRefAfter.current) fileRefAfter.current.value = "";
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await api.delete(`/jobs/${id}/photos/${photoId}`);
      toast.success("Photo deleted");
      fetchPhotos();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["worker", "my-jobs"] });
    qc.invalidateQueries({ queryKey: ["worker", "jobs", id] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  if (!job) {
    return <div className="py-12 text-center text-muted-foreground">Job not found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/home" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted touch-manipulation">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold truncate">{job.customer?.name}</h1>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[job.status] || "bg-gray-100")}>
            {job.status}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm">{job.customer?.address}</p>
              {job.customer?.eircode && <p className="text-xs text-muted-foreground">{job.customer.eircode}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm">{new Date(job.scheduledStart).toLocaleString()}</span>
          </div>
          {job.estimatedDuration && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">Estimated: {job.estimatedDuration} minutes</span>
            </div>
          )}
          {job.actualStart && (
            <div className="flex items-center gap-2 text-emerald-600">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="text-sm">Started: {new Date(job.actualStart).toLocaleTimeString()}</span>
            </div>
          )}
          {job.notes && (
            <div className="rounded-md bg-muted p-3 text-sm">
              {job.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Before Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Before Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRefBefore.current?.click()}
              disabled={uploadingBefore || photos.filter((p) => p.type === "BEFORE" || !p.type).length >= MAX_BEFORE}
              className="touch-manipulation"
            >
              <Camera className="mr-2 h-4 w-4" />
              {uploadingBefore ? "Uploading..." : `Upload Before (${photos.filter((p) => p.type === "BEFORE" || !p.type).length}/${MAX_BEFORE})`}
            </Button>
            <input
              ref={fileRefBefore}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e, "BEFORE")}
            />
          </div>
          {photos.filter((p) => p.type === "BEFORE" || !p.type).length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photos.filter((p) => p.type === "BEFORE" || !p.type).map((photo: any) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt="Before photo"
                    className="w-full h-24 object-cover rounded-lg"
                    onClick={() => window.open(photo.url, "_blank")}
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Take photos before starting work.</p>
          )}
        </CardContent>
      </Card>

      {/* After Photos */}
      {(job.status === "IN_PROGRESS" || job.status === "COMPLETED") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">After Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRefAfter.current?.click()}
                disabled={uploadingAfter || photos.filter((p) => p.type === "AFTER").length >= MAX_AFTER}
                className="touch-manipulation"
              >
                <Camera className="mr-2 h-4 w-4" />
                {uploadingAfter ? "Uploading..." : `Upload After (${photos.filter((p) => p.type === "AFTER").length}/${MAX_AFTER})`}
              </Button>
              <input
                ref={fileRefAfter}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e, "AFTER")}
              />
            </div>
            {photos.filter((p) => p.type === "AFTER").length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.filter((p) => p.type === "AFTER").map((photo: any) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt="After photo"
                      className="w-full h-24 object-cover rounded-lg"
                      onClick={() => window.open(photo.url, "_blank")}
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Take photos after completing work.</p>
            )}
          </CardContent>
        </Card>
      )}

      {job.customer?.phone && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer phone</p>
              <a href={`tel:${job.customer.phone}`} className="font-medium text-primary hover:underline">{job.customer.phone}</a>
            </div>
          </CardContent>
        </Card>
      )}

      {job.status === "PENDING" && (
        <CheckInButton jobId={id} onSuccess={refresh} />
      )}

      {job.status === "IN_PROGRESS" && (
        <div className="space-y-2">
          <CheckOutButton jobId={id} onSuccess={refresh} complete />
          <CheckOutButton jobId={id} onSuccess={refresh} />
        </div>
      )}

      {job.status === "COMPLETED" && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 p-4 text-center">
          <p className="font-medium text-emerald-700 dark:text-emerald-300">Job completed</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Great work!</p>
        </div>
      )}

      {job.status === "CANCELLED" && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 text-center">
          <p className="font-medium text-red-700 dark:text-red-300">This job was cancelled</p>
        </div>
      )}
    </div>
  );
}
