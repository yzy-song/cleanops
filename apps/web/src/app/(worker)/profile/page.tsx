"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Shield, LogOut, Euro } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

export default function WorkerProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const { data: earnings } = useQuery({
    queryKey: ["worker", "earnings"],
    queryFn: async () => {
      const res = await api.get("/worker/me/earnings");
      return res.data;
    },
  });

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Profile</h1>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{user?.email?.split("@")[0]}</CardTitle>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground capitalize">{user?.role?.toLowerCase()}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
              <Euro className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold">{eur(earnings?.grossPay || 0)}</p>
              <p className="text-xs text-muted-foreground">Total earnings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full min-h-[48px]" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
