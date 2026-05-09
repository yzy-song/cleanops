"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface CheckInButtonProps {
  jobId: string;
  onSuccess?: () => void;
}

export function CheckInButton({ jobId, onSuccess }: CheckInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      await api.patch(`/jobs/${jobId}/check-in`, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });

      toast.success("Checked in successfully");
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Check-in failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckIn}
      disabled={loading}
      className="w-full min-h-[48px]"
      size="lg"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="mr-2 h-4 w-4" />
      )}
      {loading ? "Checking location..." : "Check In"}
    </Button>
  );
}
