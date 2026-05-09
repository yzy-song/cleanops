"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomerAuthStore } from "@/store/customer-auth.store";
import { api } from "@/lib/api";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const setAuth = useCustomerAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No token provided");
      return;
    }

    api.post("/portal/verify", { token })
      .then((res) => {
        const data = res.data.data;
        setAuth({
          token: data.token,
          customerId: data.customerId,
          name: data.name,
          email: data.email,
        });
        router.push("/portal");
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || "Invalid or expired link");
      });
  }, [token, setAuth, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Login failed</h2>
          <p className="text-muted-foreground">{error}</p>
          <a href="/portal/login" className="text-primary hover:underline text-sm">
            Request a new link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Verifying your login link...</p>
      </div>
    </div>
  );
}

export default function PortalVerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
