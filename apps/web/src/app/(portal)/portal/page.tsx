"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuthStore } from "@/store/customer-auth.store";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Clock, Euro, FileText, LogOut, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const jobStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const invoiceStatusColors: Record<string, string> = {
  UNPAID: "bg-yellow-100 text-yellow-800",
  PAID: "bg-emerald-100 text-emerald-800",
  VOID: "bg-red-100 text-red-800",
};

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { token, name, logout } = useCustomerAuthStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/portal/login");
      return;
    }

    const fetchData = async () => {
      try {
        const apiWithAuth = (path: string) =>
          api.get(path, { headers: { Authorization: `Bearer ${token}` } });

        const [jobsRes, invoicesRes] = await Promise.all([
          apiWithAuth("/portal/jobs"),
          apiWithAuth("/portal/invoices"),
        ]);
        setJobs(jobsRes.data.data || []);
        setInvoices(invoicesRes.data.data || []);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          logout();
          router.push("/portal/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, router, logout]);

  const handleLogout = () => {
    logout();
    router.push("/portal/login");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const upcoming = jobs.filter((j: any) => j.status === "PENDING" || j.status === "IN_PROGRESS");
  const past = jobs.filter((j: any) => j.status === "COMPLETED" || j.status === "CANCELLED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {name}</h1>
          <p className="text-muted-foreground text-sm">Manage your cleaning services</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/book")}>
            <Calendar className="mr-2 h-4 w-4" />
            Book a service
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Upcoming jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Services</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming services</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((job: any) => (
                <div key={job.id} className="flex items-start gap-4 rounded-lg border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", jobStatusColors[job.status])}>
                        {job.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {format(parseISO(job.scheduledStart), "PPP 'at' HH:mm")}
                      {job.estimatedDuration && ` · ${job.estimatedDuration} min`}
                    </p>
                    {job.assignments?.[0]?.worker && (
                      <p className="text-xs text-muted-foreground">
                        Worker: {job.assignments[0].worker.firstName} {job.assignments[0].worker.lastName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Invoice #{inv.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(inv.createdAt), "PPP")}
                    </p>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", invoiceStatusColors[inv.status])}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="font-semibold">{eur(inv.amount)}</p>
                    {inv.paymentLink && inv.status === "UNPAID" && (
                      <a
                        href={inv.paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Open
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past jobs */}
      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {past.slice(0, 10).map((job: any) => (
                <div key={job.id} className="flex items-start gap-4 rounded-lg border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", jobStatusColors[job.status])}>
                      {job.status}
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {format(parseISO(job.scheduledStart), "PPP")}
                    </p>
                    {job.invoice && (
                      <p className="text-xs text-muted-foreground">
                        Invoice: {eur(job.invoice.amount)} ({job.invoice.status})
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
