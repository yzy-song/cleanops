"use client";

import { useParams } from "next/navigation";
import { useQuote, useSendQuote, useConvertQuoteToJob, useDeclineQuote } from "@/hooks/use-quotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, CheckCircle, XCircle, Copy, ExternalLink, Wrench } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-emerald-100 text-emerald-800",
  DECLINED: "bg-red-100 text-red-800",
  EXPIRED: "bg-yellow-100 text-yellow-800",
};

const serviceLabels: Record<string, string> = {
  REGULAR: "Regular Clean",
  DEEP_CLEAN: "Deep Clean",
  END_OF_TENANCY: "End of Tenancy",
  COMMERCIAL: "Commercial",
  WINDOW: "Window Clean",
  CARPET: "Carpet Clean",
  OVEN: "Oven Clean",
};

const sizeLabels: Record<string, string> = {
  STUDIO: "Studio",
  ONE_BED: "1 Bedroom",
  TWO_BED: "2 Bedrooms",
  THREE_BED: "3 Bedrooms",
  FOUR_BED: "4 Bedrooms",
  FIVE_PLUS_BED: "5+ Bedrooms",
  COMMERCIAL_SMALL: "Small Office",
  COMMERCIAL_LARGE: "Large Office",
};

const frequencyLabels: Record<string, string> = {
  ONE_OFF: "One-off",
  WEEKLY: "Weekly",
  BI_WEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
};

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: quote, isLoading } = useQuote(id);
  const sendQuote = useSendQuote();
  const convertToJob = useConvertQuoteToJob();
  const declineQuote = useDeclineQuote();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!quote) {
    return <div className="text-center text-muted-foreground">Quote not found</div>;
  }

  const handleSend = async () => {
    if (!confirm("Send this quote to the customer?")) return;
    try {
      await sendQuote.mutateAsync(quote.id);
      toast.success("Quote sent");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleConvert = async () => {
    if (!confirm("Convert this accepted quote to a job?")) return;
    try {
      await convertToJob.mutateAsync(quote.id);
      toast.success("Quote converted to job");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleDecline = async () => {
    if (!confirm("Decline this quote?")) return;
    try {
      await declineQuote.mutateAsync({ id: quote.id });
      toast.success("Quote declined");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleCopyLink = () => {
    const frontendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(":3000", ":3001") || window.location.origin;
    const link = `${frontendUrl}/portal/quote/${quote.publicToken}`;
    navigator.clipboard.writeText(link);
    toast.success("Public link copied");
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/quotes"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Quote</h1>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[quote.status] || "bg-gray-100")}>
          {quote.status}
        </span>
      </div>

      {/* Public Link (when sent) */}
      {quote.publicToken && (
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground truncate flex-1">
              /portal/quote/{quote.publicToken}
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopyLink}>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service</span>
            <span>{serviceLabels[quote.serviceType] || quote.serviceType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Property</span>
            <span>{sizeLabels[quote.propertySize] || quote.propertySize}</span>
          </div>
          {quote.bathrooms && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bathrooms</span>
              <span>{quote.bathrooms}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frequency</span>
            <span>{frequencyLabels[quote.frequency] || quote.frequency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span>{quote.estimatedDuration} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Commercial</span>
            <span>{quote.isCommercial ? "Yes (23% VAT)" : "No (13.5% VAT)"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {quote.lineItems?.map((li: any) => (
            <div key={li.id} className="flex justify-between">
              <span className="text-muted-foreground">{li.description}</span>
              <span>{eur(li.totalPrice)}</span>
            </div>
          ))}
          <hr />
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{eur(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT ({quote.isCommercial ? "23%" : "13.5%"})</span>
            <span>{eur(quote.vatAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>{eur(quote.grandTotal)}</span>
          </div>
          {quote.depositRequired && (
            <p className="text-xs text-yellow-700 bg-yellow-50 rounded p-2 mt-2">
              Deposit required: {eur(quote.depositAmount!)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-medium">{quote.customerName}</p>
          <p className="text-muted-foreground">{quote.customerEmail}</p>
          <p className="text-muted-foreground">{quote.customerAddress}</p>
          {quote.customerPhone && <p className="text-muted-foreground">{quote.customerPhone}</p>}
          {quote.customerEircode && (
            <p className="text-muted-foreground">Eircode: {quote.customerEircode}</p>
          )}
        </CardContent>
      </Card>

      {quote.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{quote.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>Created: {format(parseISO(quote.createdAt), "PPP")}</p>
          <p>Valid until: {format(parseISO(quote.validUntil), "PPP")}</p>
          {quote.sentAt && <p>Sent: {format(parseISO(quote.sentAt), "PPP")}</p>}
          {quote.acceptedAt && <p>Accepted: {format(parseISO(quote.acceptedAt), "PPP")}</p>}
          {quote.declinedAt && <p>Declined: {format(parseISO(quote.declinedAt), "PPP")}</p>}
          {quote.declinedReason && <p>Reason: {quote.declinedReason}</p>}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {quote.status === "DRAFT" && (
          <Button onClick={handleSend} disabled={sendQuote.isPending}>
            <Send className="mr-2 h-4 w-4" />
            {sendQuote.isPending ? "Sending..." : "Send to Customer"}
          </Button>
        )}

        {quote.status === "SENT" && (
          <Button variant="destructive" onClick={handleDecline} disabled={declineQuote.isPending}>
            <XCircle className="mr-2 h-4 w-4" />
            Decline
          </Button>
        )}

        {quote.status === "ACCEPTED" && !quote.job && (
          <Button onClick={handleConvert} disabled={convertToJob.isPending}>
            <Wrench className="mr-2 h-4 w-4" />
            {convertToJob.isPending ? "Converting..." : "Convert to Job"}
          </Button>
        )}

        {quote.status === "ACCEPTED" && quote.job && (
          <Button asChild>
            <Link href={`/jobs/${quote.job.id}`}>
              <CheckCircle className="mr-2 h-4 w-4" />
              View Job
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
