import Link from "next/link";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              CO
            </div>
            <span className="font-semibold text-slate-900">CleanOps</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/tools" className="text-slate-700 hover:text-slate-900 font-medium">Tools</Link>
            <Link href="/login" className="text-slate-700 hover:text-slate-900">Login</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
