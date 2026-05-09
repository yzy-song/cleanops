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
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    try {
      const res = await api.get(`/jobs/${id}/photos`);
      setPhotos(res.data.data || []);
    } catch {}
  };

  useEffect(() => { fetchPhotos(); }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", "BEFORE");
      await api.post(`/jobs/${id}/photos`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Photo uploaded");
      fetchPhotos();
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="touch-manipulation"
            >
              <Camera className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Photo"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo: any) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt="Job photo"
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
          )}
          {photos.length === 0 && (
            <p className="text-xs text-muted-foreground">No photos yet. Take photos of your work!</p>
          )}
        </CardContent>
      </Card>

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
