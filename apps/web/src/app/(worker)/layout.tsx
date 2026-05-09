"use client";

import { BottomNav } from "@/components/worker/bottom-nav";
import { AuthGuard } from "@/components/layout/auth-guard";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 px-4 pb-20 pt-4">{children}</main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
