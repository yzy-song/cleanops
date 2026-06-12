"use client";

import { useState } from "react";
import { useQuotes, useUpdateQuote } from "@/hooks/use-quotes";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Columns3 } from "lucide-react";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { DndContext, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const columns = [
  { key: "DRAFT", label: "Preparing", border: "border-l-slate-400", bg: "bg-slate-50" },
  { key: "SENT", label: "Sent", border: "border-l-blue-500", bg: "bg-blue-50" },
  { key: "ACCEPTED", label: "Won", border: "border-l-emerald-500", bg: "bg-emerald-50" },
  { key: "DECLINED", label: "Lost", border: "border-l-red-400", bg: "bg-red-50" },
  { key: "EXPIRED", label: "Expired", border: "border-l-amber-400", bg: "bg-amber-50" },
];

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT", "DECLINED", "EXPIRED"],
  SENT: ["ACCEPTED", "DECLINED", "EXPIRED", "DRAFT"],
  ACCEPTED: ["DRAFT"],
  DECLINED: ["DRAFT"],
  EXPIRED: ["DRAFT", "SENT"],
};

function QuoteCard({ quote, isDragging }: { quote: any; isDragging?: boolean }) {
  return (
    <div className={cn("rounded-lg border bg-white p-3 shadow-sm", isDragging && "opacity-50 shadow-lg")}>
      <p className="text-sm font-medium truncate">{quote.customerName}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{quote.serviceType || "—"}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold">{eur(quote.grandTotal || 0)}</span>
        {quote.depositRequired && <span className="text-[10px] text-amber-600 font-medium">Deposit</span>}
      </div>
    </div>
  );
}

function DraggableQuote({ quote }: { quote: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: quote.id, data: { quote } });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : undefined;
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style} className="cursor-grab active:cursor-grabbing touch-manipulation">
      <QuoteCard quote={quote} isDragging={isDragging} />
    </div>
  );
}

function DroppableColumn({ col, quotes, onNavigate }: { col: typeof columns[0]; quotes: any[]; onNavigate: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${col.key}` });
  const total = quotes.reduce((sum: number, q: any) => sum + (q.grandTotal || 0), 0);
  return (
    <div ref={setNodeRef} className={cn("rounded-xl border-l-4 p-4 min-w-[200px] transition-colors", col.border, col.bg, isOver && "ring-2 ring-primary")}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold">{col.label}</p>
          <p className="text-xs text-muted-foreground">{quotes.length} · {eur(total)}</p>
        </div>
        <span className="text-xs bg-white/70 rounded-full px-2 py-0.5">{quotes.length}</span>
      </div>
      <div className="space-y-2">
        {quotes.map((q) => (
          <div key={q.id} onClick={() => onNavigate(q.id)}>
            <DraggableQuote quote={q} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { data, isLoading, refetch } = useQuotes({ limit: 200 });
  const updateQuote = useUpdateQuote();
  useRoleGuard(["ADMIN", "MANAGER"]);
  const [activeQuote, setActiveQuote] = useState<any>(null);

  if (isLoading) return <Skeleton className="h-96" />;
  const quotes = (data as any)?.data || data || [];

  const grouped: Record<string, any[]> = {};
  columns.forEach((c) => { grouped[c.key] = []; });
  (Array.isArray(quotes) ? quotes : []).forEach((q: any) => {
    if (grouped[q.status]) grouped[q.status].push(q);
  });

  const handleDragEnd = async (event: any) => {
    setActiveQuote(null);
    const { active, over } = event;
    if (!over) return;
    const quote = active.data.current?.quote;
    if (!quote) return;
    const targetCol = over.id?.toString().replace("col-", "");
    if (!targetCol || targetCol === quote.status) return;
    if (!VALID_TRANSITIONS[quote.status]?.includes(targetCol)) {
      toast.error(`Can't move from ${quote.status} to ${targetCol}`);
      return;
    }
    try {
      await updateQuote.mutateAsync({ id: quote.id, status: targetCol });
      refetch();
      toast.success(`Moved to ${targetCol}`);
    } catch { toast.error("Failed to update"); }
  };

  const pipelineTotal = quotes.reduce((s: number, q: any) => s + (q.status !== "DECLINED" && q.status !== "EXPIRED" ? q.grandTotal || 0 : 0), 0);

  return (
    <DndContext onDragStart={(e) => setActiveQuote(e.active.data.current?.quote)} onDragEnd={handleDragEnd}>
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-3">
          <Columns3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
            <p className="text-muted-foreground text-sm">{eur(pipelineTotal)} active · Drag cards to move between stages</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-5 overflow-x-auto">
          {columns.map((col) => (
            <DroppableColumn key={col.key} col={col} quotes={grouped[col.key]} onNavigate={(id) => window.open(`/quotes/${id}`, "_blank")} />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeQuote ? <QuoteCard quote={activeQuote} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
