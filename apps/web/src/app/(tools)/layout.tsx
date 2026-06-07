import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Free Tools — CleanOps", template: "%s — CleanOps" },
  description: "Free calculators and generators for cleaning businesses. No signup required.",
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#ffffff", color: "#0f172a" }}>
      <style>{`:root{color-scheme:light!important}`}</style>
      <header
        className="border-b sticky top-0 z-50"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg"
            style={{ color: "#0f172a" }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm" style={{ background: "#2563EB" }}>
              CO
            </div>
            CleanOps
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/tools"
              className="font-medium"
              style={{ color: "#475569" }}
            >
              Tools
            </Link>
            <Link
              href="/login"
              style={{ color: "#475569" }}
            >
              Login
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
