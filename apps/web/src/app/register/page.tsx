"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRegister } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const register = useRegister();
  const selectedPlan = searchParams.get("plan") || "";
  const selectedInterval = searchParams.get("interval") || "month";
  const [form, setForm] = useState({
    name: "",
    vatNumber: "",
    adminEmail: "",
    adminPass: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register.mutateAsync(form);
      toast.success("Company registered!");

      // If a plan was selected, redirect to Stripe checkout
      if (selectedPlan) {
        const res = await api.post("/billing/checkout", { plan: selectedPlan, interval: selectedInterval });
        if (res.data?.data?.url) {
          window.location.href = res.data.data.url;
          return;
        }
      }
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            CO
          </div>
          <CardTitle className="text-xl">Register Your Company</CardTitle>
          <CardDescription>
            {selectedPlan
              ? `${selectedPlan} plan · ${selectedInterval === 'year' ? 'Yearly' : 'Monthly'} · 14-day free trial`
              : "Create your CleanOps account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">VAT number</Label>
              <Input id="vatNumber" name="vatNumber" value={form.vatNumber} onChange={handleChange} placeholder="IE1234567W" />
            </div>
            <hr />
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin email</Label>
              <Input id="adminEmail" name="adminEmail" type="email" value={form.adminEmail} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPass">Admin password</Label>
              <PasswordInput id="adminPass" name="adminPass" value={form.adminPass} onChange={handleChange} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending ? "Registering..." : "Register"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
