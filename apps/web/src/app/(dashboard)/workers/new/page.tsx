"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateWorker } from "@/hooks/use-workers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRoleGuard } from "@/hooks/use-role-guard";

const SKILLS = [
  { value: "REGULAR", label: "Regular Cleaning" },
  { value: "DEEP_CLEAN", label: "Deep Clean" },
  { value: "END_OF_TENANCY", label: "End of Tenancy" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "WINDOW", label: "Window" },
  { value: "CARPET", label: "Carpet" },
  { value: "OVEN", label: "Oven" },
];

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export default function NewWorkerPage() {
  const router = useRouter();
  useRoleGuard(["ADMIN", "MANAGER"]);
  const createWorker = useCreateWorker();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    hourlyRate: "",
    postalCode: "",
    skills: [] as string[],
    workDays: [1, 2, 3, 4, 5] as number[],
  });

  const toggleSkill = (skill: string) => {
    setForm((p) => ({
      ...p,
      skills: p.skills.includes(skill) ? p.skills.filter((s) => s !== skill) : [...p.skills, skill],
    }));
  };

  const toggleDay = (day: number) => {
    setForm((p) => ({
      ...p,
      workDays: p.workDays.includes(day) ? p.workDays.filter((d) => d !== day) : [...p.workDays, day].sort(),
    }));
  };

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWorker.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        hourlyRate: form.hourlyRate ? Math.round(parseFloat(form.hourlyRate) * 100) : undefined,
        postalCode: form.postalCode || undefined,
        skills: form.skills.length > 0 ? form.skills : undefined,
        workDays: form.workDays,
      });
      toast.success("Worker added");
      router.push("/workers");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add worker");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Add Worker</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal info</CardTitle>
          <CardDescription>Basic contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code (e.g. Eircode)</Label>
            <Input id="postalCode" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="D02 X123" />
            <p className="text-xs text-muted-foreground">Used for scheduling — lat/lng auto-resolved</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="rate">Hourly rate (EUR)</Label>
            <Input id="rate" type="number" min="14.80" step="0.01" value={form.hourlyRate} onChange={(e) => set("hourlyRate", e.target.value)} />
            <p className="text-xs text-muted-foreground">Minimum €14.80/hr. Leave empty for company default.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>What services can this worker perform?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {SKILLS.map((s) => (
              <label key={s.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={form.skills.includes(s.value)} onCheckedChange={() => toggleSkill(s.value)} />
                {s.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Days</CardTitle>
          <CardDescription>Which days is this worker available?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {DAYS.map((d) => (
              <label key={d.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={form.workDays.includes(d.value)} onCheckedChange={() => toggleDay(d.value)} />
                {d.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" onClick={handleSubmit} disabled={createWorker.isPending}>
          {createWorker.isPending ? "Adding..." : "Add Worker"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/workers">Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
