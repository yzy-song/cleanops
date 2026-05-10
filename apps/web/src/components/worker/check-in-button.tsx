"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MapPin, Loader2, Camera, X } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface CheckInButtonProps {
  jobId: string;
  onSuccess?: () => void;
}

export function CheckInButton({ jobId, onSuccess }: CheckInButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  };

  const clearSelfie = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleCheckIn = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    try {
      // 1. Get GPS
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        }
      );

      // 2. Upload selfie (optional, non-blocking)
      if (selfieFile) {
        try {
          const form = new FormData();
          form.append("file", selfieFile);
          form.append("type", "CHECKIN");
          await api.post(`/jobs/${jobId}/photos`, form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch {
          toast.warning("Selfie upload failed, continuing with check-in");
        }
      }

      // 3. Check in
      await api.patch(`/jobs/${jobId}/check-in`, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });

      toast.success("Checked in successfully");
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Check-in failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (loading) return;
    setOpen(isOpen);
    if (!isOpen) {
      clearSelfie();
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full min-h-[48px]"
        size="lg"
      >
        <MapPin className="mr-2 h-4 w-4" />
        Check In
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check In</DialogTitle>
            <DialogDescription>
              Take a selfie to verify your presence, then confirm your location.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selfie capture */}
            <div className="flex flex-col items-center gap-3">
              {selfiePreview ? (
                <div className="relative">
                  <img
                    src={selfiePreview}
                    alt="Selfie preview"
                    className="w-32 h-32 object-cover rounded-full border-2 border-primary"
                  />
                  <button
                    onClick={clearSelfie}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-full w-32 h-32 hover:border-primary transition-colors"
                  disabled={loading}
                >
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Selfie</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileSelect}
              />
              {!selfiePreview && (
                <p className="text-xs text-muted-foreground">
                  Optional but recommended
                </p>
              )}
            </div>

            <Button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              {loading ? "Checking in..." : "Confirm Check In"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
