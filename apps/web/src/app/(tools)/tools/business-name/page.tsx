"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowLeft, Copy, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const prefixes = ["Sparkle", "Crystal", "Elite", "Pure", "Fresh", "Prime", "Apex", "Eco", "Bright", "Royal", "Green", "Perfect"];
const suffixes = ["Clean", "Shine", "Maid", "Care", "Pro", "Wash", "Gleam", "Sweep", "Scrub", "Polish"];
const styles = ["Modern", "Professional", "Eco-Friendly", "Luxury", "Friendly"];

function generate(style: string) {
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const s = suffixes[Math.floor(Math.random() * suffixes.length)];
  const patterns = [
    `${p} ${s}`,
    `${p} ${s} Co.`,
    `${p} ${s} Services`,
    `The ${s} Company`,
    `${p} ${s} Dublin`,
    `${s} by ${p}`,
  ];
  return patterns[Math.floor(Math.random() * patterns.length)];
}

export default function BusinessNameGenerator() {
  const [style, setStyle] = useState("Modern");
  const [results, setResults] = useState<string[]>([]);

  const generateAll = () => {
    const names: string[] = [];
    for (let i = 0; i < 8; i++) names.push(generate(style));
    setResults(names);
  };

  const copyName = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success("Copied!");
  };

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Tools
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
            <Sparkles className="h-5 w-5 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Business Name Generator</h1>
            <p className="text-sm text-slate-700">Find the perfect name for your cleaning company</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Name Style</Label>
              <div className="flex flex-wrap gap-2">
                {styles.map((s) => (
                  <button key={s} onClick={() => setStyle(s)} className={`rounded-full px-4 py-1.5 text-sm border transition-colors ${style === s ? "bg-primary text-primary-foreground border-primary" : "bg-white border-slate-200 hover:border-primary/50"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={generateAll} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Generate Names
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-3">
                {results.map((name, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-4 hover:border-primary/30 transition-colors">
                    <span className="font-medium text-lg">{name}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyName(name)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
