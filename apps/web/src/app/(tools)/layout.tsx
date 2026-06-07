import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Free Tools — CleanOps", template: "%s — CleanOps" },
  description: "Free calculators and generators for cleaning businesses. No signup required.",
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              CO
            </div>
            CleanOps
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/tools" className="font-medium text-muted-foreground hover:text-foreground">
              Tools
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Login
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
