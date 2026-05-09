"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Clock, Euro, User, ClipboardList } from "lucide-react";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/timesheet", label: "Hours", icon: Clock },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t bg-card safe-area-bottom">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-1 min-h-[48px]",
              "touch-manipulation transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
