"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useInvoice, useMarkAsPaid, useVoidInvoice, usePaymentLink, useSendReminder, formatInvoiceNumber } from "@/hooks/use-invoices";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Euro, CheckCircle, XCircle, ExternalLink, Building2, User, Calendar, Users, Download, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

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

const PAYMENT_METHODS = ["STRIPE", "CASH", "REVOLUT", "BANK_TRANSFER"];

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading } = useInvoice(id);
  const markAsPaid = useMarkAsPaid();
  const voidInvoice = useVoidInvoice();
  const paymentLink = usePaymentLink();
  const sendReminder = useSendReminder();
  const [markPaidMethod, setMarkPaidMethod] = useState<string>("STRIPE");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center text-muted-foreground">Invoice not found</div>;
  }

  const handleMarkPaid = async () => {
    if (!confirm("Mark as paid?")) return;
    try {
      await markAsPaid.mutateAsync({ id, paymentMethod: markPaidMethod });
      toast.success("Invoice marked as paid");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleVoid = async () => {
    if (!confirm("Void this invoice?")) return;
    try {
      await voidInvoice.mutateAsync(id);
      toast.success("Invoice voided");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get(`/invoice/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${formatInvoiceNumber(invoice).replace("#", "")}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err?.message || "Failed to download PDF");
    }
  };

  const handlePaymentLink = async () => {
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

  const handleSendReminder = async () => {
    try {
      await sendReminder.mutateAsync(id);
      toast.success("Reminder sent");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reminder");
    }
  };

  const handleWhatsApp = () => {
    const phone = invoice.job?.customer?.phone;
    if (!phone) {
      toast.error("Customer has no phone number");
      return;
    }
    const name = invoice.job?.customer?.name || "there";
    const link = invoice.paymentLink || "";
    const msg = encodeURIComponent(
      `Hi ${name}, your cleaning service is complete! ${formatInvoiceNumber(invoice)}: ${eur(invoice.amount)}.` +
      (link ? ` Pay online: ${link}` : " We'll send payment details separately.")
    );
    window.open(`https://wa.me/${phone.replace(/[^+0-9]/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Invoice</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{formatInvoiceNumber(invoice)}</CardTitle>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[invoice.status] || "bg-gray-100")}>
              {invoice.status}
            </span>
            {invoice.paymentMethod && (
              <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                {paymentMethodLabels[invoice.paymentMethod] || invoice.paymentMethod}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PDF download */}
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-4 rounded-md bg-muted p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" /> From
              </div>
              <p className="text-sm font-medium">{invoice.company?.name || "CleanOps"}</p>
              {invoice.company?.vatNumber && (
                <p className="text-xs text-muted-foreground">VAT: {invoice.company.vatNumber}</p>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" /> To
              </div>
              <p className="text-sm font-medium">{invoice.job?.customer?.name || "—"}</p>
              {invoice.job?.customer?.address && (
                <p className="text-xs text-muted-foreground">{invoice.job.customer.address}</p>
              )}
            </div>
          </div>

          {/* Service details */}
          <div className="space-y-1.5 text-sm">
            {invoice.job?.scheduledStart && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{format(parseISO(invoice.job.scheduledStart), "PPP 'at' HH:mm")}</span>
                {invoice.job.estimatedDuration && (
                  <span className="text-muted-foreground">· {invoice.job.estimatedDuration} min</span>
                )}
              </div>
            )}
            {(invoice.job?.assignments?.length ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {invoice.job?.assignments!.map((a) => `${a.worker?.firstName} ${a.worker?.lastName}`).join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Amount breakdown */}
          <div className="space-y-2 rounded-md bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{eur(invoice.amount - invoice.vatAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>VAT ({invoice.job?.customer?.isCommercial ? "23%" : "13.5%"})</span>
              <span>{eur(invoice.vatAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{eur(invoice.amount)}</span>
            </div>
          </div>

          {invoice.paidAt && (
            <p className="text-sm text-muted-foreground">
              Paid at: {new Date(invoice.paidAt).toLocaleString()}
            </p>
          )}

          {invoice.paymentLink && (
            <Button variant="outline" className="w-full" onClick={() => window.open(invoice.paymentLink!, "_blank")}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Payment Link
            </Button>
          )}

          {invoice.job?.customer?.phone && (
            <Button variant="outline" className="w-full" onClick={handleWhatsApp}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Send via WhatsApp
            </Button>
          )}

          {invoice.status === "UNPAID" && (
            <div className="flex gap-3">
              <Button onClick={handlePaymentLink} disabled={paymentLink.isPending}>
                <Euro className="mr-2 h-4 w-4" />
                {paymentLink.isPending ? "Generating..." : "Stripe Payment Link"}
              </Button>
              <Button variant="ghost" onClick={handleSendReminder} disabled={sendReminder.isPending}>
                {sendReminder.isPending ? "Sending..." : "Send Reminder"}
              </Button>
              <div className="flex items-center gap-2">
                <select
                  value={markPaidMethod}
                  onChange={(e) => setMarkPaidMethod(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{paymentMethodLabels[m]}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={handleMarkPaid} disabled={markAsPaid.isPending}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Paid
                </Button>
              </div>
              <Button variant="destructive" onClick={handleVoid} disabled={voidInvoice.isPending}>
                <XCircle className="mr-2 h-4 w-4" />
                Void
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
