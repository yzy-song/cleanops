import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Free Tools — CleanOps", template: "%s — CleanOps" },
  description: "Free calculators and generators for cleaning businesses. No signup required.",
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 dark:text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              CO
            </div>
            CleanOps
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/tools" className="font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
              Tools
            </Link>
            <Link href="/login" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
              Login
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
