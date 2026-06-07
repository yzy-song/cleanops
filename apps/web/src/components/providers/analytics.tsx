"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Simple, privacy-friendly page view tracker.
 * Replace with Plausible/PostHog/GA4 when ready.
 * Tracks: page views, conversion events (signup, trial_start, quote_created)
 */

function track(event: string, props?: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] ${event}`, props);
      return;
    }
    // Production: send to your analytics endpoint or Plausible
    // fetch("/api/analytics", { method: "POST", body: JSON.stringify({ event, props }) });
  } catch {
    // Analytics should never break the app
  }
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views
  useEffect(() => {
    if (pathname) {
      track("pageview", { path: pathname });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}

/** Call this from conversion points: signup form, trial start, quote created */
export function trackConversion(event: string, props?: Record<string, string>) {
  track(event, props);
}
