"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Map,
  FileText,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "WORKER"] },
  { href: "/workers", label: "Workers", icon: Users, roles: ["ADMIN", "MANAGER"] },
  { href: "/customers", label: "Customers", icon: Building2, roles: ["ADMIN", "MANAGER"] },
  { href: "/jobs", label: "Jobs", icon: Calendar, roles: ["ADMIN", "MANAGER", "WORKER"] },
  { href: "/map", label: "Map", icon: Map, roles: ["ADMIN", "MANAGER", "WORKER"] },
  { href: "/invoices", label: "Invoices", icon: FileText, roles: ["ADMIN", "MANAGER"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const filteredNav = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          CO
        </div>
        <span className="font-semibold">CleanOps</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
