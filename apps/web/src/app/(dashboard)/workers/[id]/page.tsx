"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorker, useUpdateWorker } from "@/hooks/use-workers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: worker, isLoading } = useWorker(id);
  const updateWorker = useUpdateWorker();

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

  useEffect(() => {
    if (worker) {
      setForm({
        firstName: worker.firstName || "",
        lastName: worker.lastName || "",
        phone: worker.phone || "",
        email: worker.user?.email || "",
        hourlyRate: worker.hourlyRate ? (worker.hourlyRate / 100).toFixed(2) : "",
        postalCode: worker.postalCode || "",
        skills: (worker.skills as string[]) || [],
        workDays: (worker.workDays as number[]) || [1, 2, 3, 4, 5],
      });
    }
  }, [worker]);

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
      await updateWorker.mutateAsync({
        id,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        hourlyRate: form.hourlyRate ? Math.round(parseFloat(form.hourlyRate) * 100) : undefined,
        postalCode: form.postalCode || undefined,
        skills: form.skills,
        workDays: form.workDays,
      });
      toast.success("Worker updated");
      router.push("/workers");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!worker) {
    return <div className="text-center text-muted-foreground">Worker not found</div>;
  }

  const displayName = `${worker.firstName} ${worker.lastName}`;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Worker</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{displayName}</CardTitle>
          <CardDescription>Personal info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code (e.g. Eircode)</Label>
            <Input id="postalCode" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="D02 X123" />
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
            <p className="text-xs text-muted-foreground">Leave empty for company default</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
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
        <Button type="submit" onClick={handleSubmit} disabled={updateWorker.isPending}>
          {updateWorker.isPending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/workers">Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
