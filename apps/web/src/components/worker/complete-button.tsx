"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface CompleteButtonProps {
  jobId: string;
  onSuccess?: () => void;
}

export function CompleteButton({ jobId, onSuccess }: CompleteButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.patch(`/jobs/${jobId}/complete`);
      toast.success("Job completed!");
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to complete";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleComplete}
      disabled={loading}
      variant="default"
      className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700"
      size="lg"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle className="mr-2 h-4 w-4" />
      )}
      {loading ? "Completing..." : "Complete Job"}
    </Button>
  );
}
