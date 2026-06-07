"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BookingWizard } from "@/components/booking/booking-wizard";

function EmbedBookingContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId") || undefined;

  return (
    <div className="min-h-screen bg-white py-6 px-4">
      <BookingWizard companyId={companyId} />
    </div>
  );
}

export default function EmbedBookingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Loading...</p></div>}>
      <EmbedBookingContent />
    </Suspense>
  );
}
