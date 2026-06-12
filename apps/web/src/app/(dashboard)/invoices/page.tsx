"use client";

import Link from "next/link";
import { useState } from "react";
import { useInvoices, useVoidInvoice, useMarkAsPaid, usePaymentLink, formatInvoiceNumber } from "@/hooks/use-invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle, XCircle, ExternalLink, Download, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRoleGuard } from "@/hooks/use-role-guard";

const statusColors: Record<string, string> = {
  UNPAID: "bg-yellow-100 text-yellow-800",
  PAID: "bg-emerald-100 text-emerald-800",
  VOID: "bg-red-100 text-red-800",
};

const paymentMethodLabels: Record<string, string> = {
  STRIPE: "Stripe",
  CASH: "Cash",
  REVOLUT: "Revolut",
  BANK_TRANSFER: "Bank Transfer",
};

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

export default function InvoicesPage() {
  const [filter, setFilter] = useState<string>("");
  useRoleGuard(["ADMIN", "MANAGER"]);
  const { data, isLoading } = useInvoices(filter ? { status: filter } : undefined);
  const markAsPaid = useMarkAsPaid();
  const voidInvoice = useVoidInvoice();
  const paymentLink = usePaymentLink();

  const invoices = data?.data ?? [];
  const totalUnpaid = invoices.filter((i: any) => i.status === 'UNPAID').reduce((s: number, i: any) => s + i.amount, 0);
  const totalOverdue = invoices.filter((i: any) => i.status === 'UNPAID' && new Date(i.createdAt) < new Date(Date.now() - 30*86400000)).reduce((s: number, i: any) => s + i.amount, 0);
  const totalPaid = invoices.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + i.amount, 0);

  const handleDownloadPdf = async (id: string) => {
    try {
      const res = await api.get(`/invoice/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = `invoice-${id.slice(0,8)}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error("Failed to download PDF"); }
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm("Mark as paid?")) return;
    try {
      await markAsPaid.mutateAsync({ id });
      toast.success("Invoice marked as paid");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleVoid = async (id: string) => {
    if (!confirm("Void this invoice?")) return;
    try {
      await voidInvoice.mutateAsync(id);
      toast.success("Invoice voided");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handlePaymentLink = async (id: string) => {
    try {
      const result: any = await paymentLink.mutateAsync(id);
      if (result?.paymentLink) {
        window.open(result.paymentLink, "_blank");
      }
      toast.success("Payment link generated");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
      </div>

      <div className="flex gap-2">
        {["", "UNPAID", "PAID", "VOID"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s || "All"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <>
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3">
              <p className="text-xs text-red-600 font-medium">Overdue</p>
              <p className="text-lg font-bold text-red-700">{eur(totalOverdue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-3">
              <p className="text-xs text-yellow-600 font-medium">Unpaid</p>
              <p className="text-lg font-bold text-yellow-700">{eur(totalUnpaid)}</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-3">
              <p className="text-xs text-emerald-600 font-medium">Paid</p>
              <p className="text-lg font-bold text-emerald-700">{eur(totalPaid)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {invoices?.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">
                          {inv.job?.customer?.name || formatInvoiceNumber(inv)}
                        </Link>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[inv.status] || "bg-gray-100")}>
                          {inv.status}
                        </span>
                        {inv.paymentMethod && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                            {paymentMethodLabels[inv.paymentMethod] || inv.paymentMethod}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total: {eur(inv.amount)} &middot; VAT: {eur(inv.vatAmount)}
                        {inv.pensionAmount > 0 && <> &middot; Pension: {eur(inv.pensionAmount)}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {inv.status === "UNPAID" && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handlePaymentLink(inv.id)}>
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Pay Link
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadPdf(inv.id)} title="Download PDF">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        {inv.xeroInvoiceId && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1" title="Synced to Xero">
                            <Building2 className="h-3 w-3 text-blue-500" />
                          </span>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(inv.id)}>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Paid
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleVoid(inv.id)}>
                          <XCircle className="mr-1 h-3 w-3 text-destructive" />
                          Void
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {!invoices?.length && (
                <div className="p-6 text-center text-muted-foreground">
                  No invoices yet. Complete a job to generate one.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
