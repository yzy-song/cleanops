"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

const roomTypes: { label: string; key: string; base: number }[] = [
  { label: "Bedroom", key: "bedroom", base: 20 },
  { label: "Bathroom", key: "bathroom", base: 15 },
  { label: "Kitchen", key: "kitchen", base: 25 },
  { label: "Living Room", key: "living", base: 20 },
  { label: "Hallway", key: "hallway", base: 10 },
];

const sizeMultiplier: Record<string, number> = { Small: 0.7, Medium: 1.0, Large: 1.5, "Very Large": 2.0 };

export default function TimeEstimator() {
  const [size, setSize] = useState("Medium");
  const [rooms, setRooms] = useState<Record<string, number>>({ bedroom: 2, bathroom: 1, kitchen: 1, living: 1, hallway: 1 });
  const [teamSize, setTeamSize] = useState(1);
  const [condition, setCondition] = useState("Moderate");

  const baseMinutes = roomTypes.reduce((sum, r) => sum + r.base * (rooms[r.key] || 0), 0);
  const adjusted = baseMinutes * (sizeMultiplier[size] || 1) * (condition === "Dirty" ? 1.5 : condition === "Very Dirty" ? 2 : 1);
  const minutesPerPerson = Math.round(adjusted / teamSize);
  const hours = Math.floor(minutesPerPerson / 60);
  const mins = minutesPerPerson % 60;

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Tools
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cleaning Time Estimator</h1>
            <p className="text-sm text-slate-700 dark:text-slate-300">Estimate job duration by room and size</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-5">
            <div>
              <Label className="text-sm mb-2 block">Property Size</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(sizeMultiplier).map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`rounded-full px-4 py-1.5 text-sm border transition-colors ${size === s ? "bg-primary text-primary-foreground border-primary" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-primary/50"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Condition</Label>
              <div className="flex flex-wrap gap-2">
                {["Clean", "Moderate", "Dirty", "Very Dirty"].map((c) => (
                  <button key={c} onClick={() => setCondition(c)} className={`rounded-full px-4 py-1.5 text-sm border transition-colors ${condition === c ? "bg-primary text-primary-foreground border-primary" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-primary/50"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Rooms</Label>
              <div className="space-y-2">
                {roomTypes.map((r) => (
                  <div key={r.key} className="flex items-center justify-between">
                    <span className="text-sm">{r.label}</span>
                    <Input type="number" min={0} max={20} value={rooms[r.key] || 0} onChange={(e) => setRooms({ ...rooms, [r.key]: Number(e.target.value) || 0 })} className="w-20 text-right" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Team Size</Label>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-slate-400" />
                <input type="range" min={1} max={5} value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} className="flex-1" />
                <span className="text-sm font-medium w-6 text-center">{teamSize}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-900">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-sm text-slate-700 dark:text-slate-300">Estimated Cleaning Time</p>
            <p className="text-3xl font-bold">{hours}h {mins}m</p>
            <p className="text-xs text-slate-400">per person · {teamSize} cleaner{teamSize > 1 ? "s" : ""} · {size} · {condition}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
