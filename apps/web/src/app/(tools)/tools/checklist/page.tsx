"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckSquare, ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

const templates: Record<string, string[]> = {
  "Regular Clean": ["Dust all surfaces", "Vacuum carpets & rugs", "Mop hard floors", "Clean mirrors & glass", "Wipe kitchen counters", "Clean & sanitise bathrooms", "Empty bins", "Make beds (if requested)"],
  "Deep Clean": ["Dust all surfaces (incl. high)", "Vacuum carpets & rugs", "Mop hard floors", "Clean mirrors & glass", "Wipe kitchen counters & cabinets", "Clean inside microwave", "Clean oven", "Clean & sanitise bathrooms", "Descale shower heads & taps", "Clean skirting boards", "Wipe light switches & door handles", "Empty bins", "Clean inside windows"],
  "End of Tenancy": ["Dust all surfaces", "Vacuum carpets & rugs", "Mop hard floors", "Clean mirrors & glass", "Deep clean kitchen (all appliances inside)", "Clean oven", "Clean & sanitise bathrooms", "Descale shower heads & taps", "Clean skirting boards", "Wipe walls for marks", "Clean inside windows & frames", "Empty all bins", "Remove all cobwebs"],
  "Office Clean": ["Dust desks & surfaces", "Vacuum carpets & rugs", "Mop hard floors", "Clean mirrors & glass", "Wipe kitchen counters", "Clean & sanitise bathrooms", "Empty bins & recycling", "Wipe electronics (monitors, keyboards)"],
  Airbnb: ["Change bed linens", "Dust all surfaces", "Vacuum carpets & rugs", "Mop hard floors", "Clean mirrors & glass", "Wipe kitchen counters", "Clean & sanitise bathroom", "Empty bins", "Restock toilet paper & soap", "Check for damages"],
};

export default function ChecklistGenerator() {
  const [template, setTemplate] = useState("Regular Clean");
  const [items, setItems] = useState<string[]>(templates["Regular Clean"]);
  const [newItem, setNewItem] = useState("");
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const pickTemplate = (name: string) => {
    setTemplate(name);
    setItems([...templates[name]]);
    setChecked({});
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems([...items, newItem.trim()]);
    setNewItem("");
  };

  const completed = Object.values(checked).filter(Boolean).length;

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to Tools
          </Link>
          <button onClick={() => window.print()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-slate-900 dark:hover:text-white">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <CheckSquare className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Checklist Generator</h1>
            <p className="text-sm text-muted-foreground">Create custom cleaning checklists you can print</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Template</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(templates).map((t) => (
                  <button key={t} onClick={() => pickTemplate(t)} className={`rounded-full px-4 py-1.5 text-sm border transition-colors ${template === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">
                {completed}/{items.length} completed
              </p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Checkbox id={`check-${i}`} checked={checked[i] || false} onCheckedChange={(c) => setChecked({ ...checked, [i]: !!c })} />
                    <Label htmlFor={`check-${i}`} className={`text-sm cursor-pointer ${checked[i] ? "line-through text-muted-foreground" : ""}`}>{item}</Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add custom item..."
                  className="flex-1 rounded-md border px-3 py-1.5 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                />
                <Button variant="outline" size="sm" onClick={addItem}>Add</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
