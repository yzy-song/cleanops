"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export default function QuoteViewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const justPaid = searchParams.get("paid") === "true";

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await api.get(`/portal/quote/${token}`);
        setQuote(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Quote not found or has expired");
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await api.post(`/portal/quote/${token}/accept`);
      setQuote(res.data.quote);
      setAccepted(true);
      if (res.data.paymentUrl) {
        setPaymentUrl(res.data.paymentUrl);
      }
      toast.success("Quote accepted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to accept quote");
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      await api.post(`/portal/quote/${token}/decline`);
      setQuote((prev: any) => ({ ...prev, status: "DECLINED" }));
      toast.success("Quote declined");
    } catch (err: any) {
      toast.error(err?.message || "Failed to decline quote");
    } finally {
      setDeclining(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg text-center py-16 space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Quote Unavailable</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/book">Book a service</Link>
        </Button>
      </div>
    );
  }

  const isExpired = new Date(quote.validUntil) < new Date();
  const canAct = quote.status === "SENT" && !isExpired;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/book"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Your Quote</h1>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
            quote.status === "ACCEPTED" && "bg-emerald-100 text-emerald-800",
            quote.status === "DECLINED" && "bg-red-100 text-red-800",
            quote.status === "EXPIRED" && "bg-yellow-100 text-yellow-800",
            quote.status === "SENT" && "bg-blue-100 text-blue-800",
          )}
        >
          {quote.status}
        </span>
      </div>

      {justPaid && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-emerald-800">Payment confirmed</span>
            </div>
            <p className="text-sm text-emerald-700">
              Your deposit has been received. We&apos;ll be in touch to confirm your service date.
            </p>
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
        </CardContent>
      </Card>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{quote.customerName}</p>
          <p className="text-muted-foreground">{quote.customerEmail}</p>
          <p className="text-muted-foreground">{quote.customerAddress}</p>
          {quote.customerPhone && <p className="text-muted-foreground">{quote.customerPhone}</p>}
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

      {/* Actions */}
      {canAct && (
        <div className="flex gap-3">
          <Button className="flex-1" onClick={handleAccept} disabled={accepting}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {accepting ? "Accepting..." : "Accept Quote"}
          </Button>
          <Button variant="outline" onClick={handleDecline} disabled={declining}>
            <XCircle className="mr-2 h-4 w-4" />
            Decline
          </Button>
        </div>
      )}

      {/* Deposit Payment */}
      {accepted && paymentUrl && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-4 space-y-3">
            <div>
              <p className="font-semibold text-amber-800">Deposit Required</p>
              <p className="text-sm text-amber-700">
                A {eur(quote.depositAmount)} deposit is required to secure your booking.
              </p>
            </div>
            <Button className="w-full" asChild>
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Pay Deposit
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {accepted && !paymentUrl && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-emerald-800">
                Quote accepted — no deposit required
              </span>
            </div>
            <p className="text-sm text-emerald-700 mt-1">
              We&apos;ll be in touch to confirm your service date.
            </p>
          </CardContent>
        </Card>
      )}

      {quote.status === "ACCEPTED" && justPaid && (
        <Button className="w-full" asChild>
          <Link href="/book">Book Another Service</Link>
        </Button>
      )}

      {quote.status === "DECLINED" && (
        <div className="text-center py-4">
          <p className="text-muted-foreground">This quote has been declined.</p>
        </div>
      )}
    </div>
  );
}
