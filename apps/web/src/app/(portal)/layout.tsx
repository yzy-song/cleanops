export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            CO
          </div>
          <span className="font-semibold">CleanOps</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
