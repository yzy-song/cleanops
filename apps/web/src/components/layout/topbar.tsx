"use client";

import { useAuthStore } from "@/store/auth.store";

export function Topbar() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-end gap-4 border-b bg-background px-6">
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <span className="text-muted-foreground">{user?.email}</span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {user?.email?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
