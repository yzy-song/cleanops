"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, Map, Users, Building2, FileText,
  ScrollText, BarChart3, Settings, Plus, Search
} from "lucide-react";

interface Command {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  const commands: Command[] = [
    { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard, category: "Navigate", action: () => router.push("/dashboard") },
    { id: "jobs", label: "Go to Jobs", icon: Calendar, category: "Navigate", action: () => router.push("/jobs") },
    { id: "map", label: "Go to Map", icon: Map, category: "Navigate", action: () => router.push("/map") },
    { id: "customers", label: "Go to Customers", icon: Building2, category: "Navigate", action: () => router.push("/customers") },
    { id: "quotes", label: "Go to Quotes", icon: ScrollText, category: "Navigate", action: () => router.push("/quotes") },
    { id: "invoices", label: "Go to Invoices", icon: FileText, category: "Navigate", action: () => router.push("/invoices") },
    { id: "workers", label: "Go to Workers", icon: Users, category: "Navigate", action: () => router.push("/workers") },
    { id: "reports", label: "Go to Reports", icon: BarChart3, category: "Navigate", action: () => router.push("/reports") },
    { id: "new-job", label: "Create New Job", icon: Plus, category: "Actions", action: () => router.push("/jobs/new") },
    { id: "settings", label: "Open Settings", icon: Settings, category: "Settings", action: () => router.push("/settings") },
  ];

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setActiveIdx(0);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Keyboard nav
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[activeIdx];
        if (cmd) { cmd.action(); setOpen(false); }
      }
      if (e.key === "Escape") setOpen(false);
    },
    [filtered, activeIdx]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-50 w-full max-w-lg rounded-xl border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => { cmd.action(); setOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  i === activeIdx ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                }`}
              >
                <cmd.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-left">{cmd.label}</span>
                <span className="text-[10px] text-muted-foreground">{cmd.category}</span>
              </button>
            ))
          )}
        </div>
        <div className="border-t px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span><kbd className="font-mono">↑↓</kbd> Navigate</span>
          <span><kbd className="font-mono">↵</kbd> Open</span>
          <span><kbd className="font-mono">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
