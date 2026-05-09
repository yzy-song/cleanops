"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface CheckOutButtonProps {
  jobId: string;
  onSuccess?: () => void;
  complete?: boolean;
}

export function CheckOutButton({ jobId, onSuccess, complete }: CheckOutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckOut = async () => {
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

      await api.patch(`/jobs/${jobId}/check-out`, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        complete: complete ?? false,
      });

      toast.success(complete ? "Job completed!" : "Checked out successfully");
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Check-out failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckOut}
      disabled={loading}
      className="w-full min-h-[48px]"
      variant={complete ? "default" : "outline"}
      size="lg"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      {loading
        ? (complete ? "Completing..." : "Checking out...")
        : (complete ? "Complete & Check Out" : "Check Out")}
    </Button>
  );
}
