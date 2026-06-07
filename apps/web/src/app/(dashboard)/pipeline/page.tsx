"use client";

import { useQuotes } from "@/hooks/use-quotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Columns3 } from "lucide-react";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const columns = [
  { key: "DRAFT", label: "Preparing", color: "bg-slate-100" },
  { key: "SENT", label: "Sent", color: "bg-blue-100" },
  { key: "ACCEPTED", label: "Won", color: "bg-emerald-100" },
  { key: "DECLINED", label: "Lost", color: "bg-red-50" },
  { key: "EXPIRED", label: "Expired", color: "bg-amber-50" },
];

export default function PipelinePage() {
  const { data, isLoading } = useQuotes({ limit: 200 });

  if (isLoading) return <Skeleton className="h-96" />;

  const quotes = (data as any)?.data || data || [];

  const grouped: Record<string, any[]> = {};
  columns.forEach((c) => { grouped[c.key] = []; });
  (Array.isArray(quotes) ? quotes : []).forEach((q: any) => {
    if (grouped[q.status]) grouped[q.status].push(q);
    else if (!grouped[q.status]) grouped[q.status] = [q];
  });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Columns3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground text-sm">Kanban view of your sales pipeline</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5 overflow-x-auto">
        {columns.map((col) => (
          <div key={col.key} className={`rounded-xl ${col.color} p-4 min-w-[200px]`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">{col.label}</p>
              <span className="text-xs text-muted-foreground bg-white/60 rounded-full px-2 py-0.5">{grouped[col.key].length}</span>
            </div>
            <div className="space-y-2">
              {grouped[col.key].map((q: any) => (
                <Link key={q.id} href={`/quotes/${q.id}`} className="block rounded-lg border bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium truncate">{q.customerName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{q.serviceType || "—"}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold">{eur(q.grandTotal || 0)}</span>
                    {q.depositRequired && <span className="text-[10px] text-amber-600 font-medium">Deposit</span>}
                  </div>
                </Link>
              ))}
              {grouped[col.key].length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No quotes</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
