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
  ScrollText,
  BarChart3,
  Settings,
  LogOut,
  User,
} from "lucide-react";

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navGroups: NavGroup[] = [
  {
    label: "CORE",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "WORKER"] },
      { href: "/jobs", label: "Jobs", icon: Calendar, roles: ["ADMIN", "MANAGER", "WORKER"] },
      { href: "/map", label: "Map", icon: Map, roles: ["ADMIN", "MANAGER", "WORKER"] },
      { href: "/customers", label: "Customers", icon: Building2, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "SALES & REVENUE",
    items: [
      { href: "/quotes", label: "Quotes", icon: ScrollText, roles: ["ADMIN", "MANAGER"] },
      { href: "/invoices", label: "Invoices", icon: FileText, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "TEAM & OPERATIONS",
    items: [
      { href: "/workers", label: "Workers", icon: Users, roles: ["ADMIN", "MANAGER"] },
      { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          CO
        </div>
        <span className="font-semibold">CleanOps</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => user && item.roles.includes(user.role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="space-y-1">
              <p className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                {group.label}
              </p>
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
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
          );
        })}
      </nav>

      <div className="border-t p-3 space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.email}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
        )}
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
