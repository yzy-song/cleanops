"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCustomerAuthStore } from "@/store/customer-auth.store";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, MapPin, User, FileText, Download, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useCustomerAuthStore();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!token) { router.push("/portal/login"); return; }
    api.get(`/portal/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setJob(res.data.data || res.data))
      .catch(() => router.push("/portal"))
      .finally(() => setLoading(false));
  }, [id, token, router]);

  const handleDownload = async (invoiceId: string) => {
    setDownloadingPdf(true);
    try {
      const res = await api.get(`/portal/invoices/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoice.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/portal")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Service Details</h1>
          <p className="text-sm text-muted-foreground">{job.customer?.address}</p>
        </div>
      </div>

      {/* Status & Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[job.status])}>
              {job.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(parseISO(job.scheduledStart), "PPP 'at' HH:mm")}</span>
          </div>
          {job.estimatedDuration && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{job.estimatedDuration} minutes</span>
            </div>
          )}
          {job.customer?.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{job.customer.address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Worker */}
      {job.assignments?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assigned Cleaner</CardTitle>
          </CardHeader>
          <CardContent>
            {job.assignments.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{a.worker.firstName} {a.worker.lastName}</p>
                  {a.worker.phone && <p className="text-sm text-muted-foreground">{a.worker.phone}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Invoice */}
      {job.invoice && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{eur(job.invoice.amount)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Status: {job.invoice.status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {job.invoice.status === "UNPAID" && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={async () => {
                      try {
                        const res = await api.post(
                          `/portal/invoices/${job.invoice.id}/pay`,
                          {},
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        if (res.data.paymentUrl || res.data.data?.paymentUrl) {
                          window.location.href = res.data.paymentUrl || res.data.data.paymentUrl;
                        }
                      } catch (err: any) {
                        toast.error(err?.message || "Payment unavailable");
                      }
                    }}
                  >
                    <CreditCard className="mr-1 h-4 w-4" />
                    Pay Now
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={downloadingPdf}
                  onClick={() => handleDownload(job.invoice.id)}
                >
                  <Download className="mr-1 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      {job.photos?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {job.photos.map((photo: any) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.url}
                    alt={photo.type}
                    className="rounded-lg w-full h-40 object-cover"
                  />
                  <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                    {photo.type}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {job.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{job.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
