"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

/**
 * Redirect workers to /dashboard if they try to access admin/manager pages.
 * Usage: useRoleGuard(["ADMIN", "MANAGER"]);
 */
export function useRoleGuard(allowedRoles: string[]) {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, router]);
}
