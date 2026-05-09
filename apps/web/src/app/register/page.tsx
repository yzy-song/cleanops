"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
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
      toast.success("Company registered! Redirecting...");
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
          <CardDescription>Create your CleanOps account</CardDescription>
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
