"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuotes, useSendQuote, useConvertQuoteToJob, useDeclineQuote } from "@/hooks/use-quotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Send, CheckCircle, XCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRoleGuard } from "@/hooks/use-role-guard";

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

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

export default function QuotesPage() {
  const [filter, setFilter] = useState<string>("");
  useRoleGuard(["ADMIN", "MANAGER"]);
  const { data, isLoading } = useQuotes(filter ? { status: filter } : undefined);
  const sendQuote = useSendQuote();
  const convertToJob = useConvertQuoteToJob();
  const declineQuote = useDeclineQuote();

  const quotes = data?.data ?? [];

  const handleSend = async (id: string) => {
    if (!confirm("Send this quote to the customer?")) return;
    try {
      await sendQuote.mutateAsync(id);
      toast.success("Quote sent");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleConvert = async (id: string) => {
    if (!confirm("Convert this accepted quote to a job?")) return;
    try {
      await convertToJob.mutateAsync(id);
      toast.success("Quote converted to job");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleDecline = async (id: string) => {
    if (!confirm("Decline this quote?")) return;
    try {
      await declineQuote.mutateAsync({ id });
      toast.success("Quote declined");
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <Button asChild>
          <Link href="/quotes/new">
            <Plus className="mr-2 h-4 w-4" />New Quote
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", "DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"].map((s) => (
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
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {quotes.map((quote: any) => (
                <div key={quote.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/quotes/${quote.id}`} className="font-medium hover:underline">
                          {quote.customerName}
                        </Link>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[quote.status] || "bg-gray-100")}>
                          {quote.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {serviceLabels[quote.serviceType] || quote.serviceType} &middot; {eur(quote.grandTotal)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {quote.status === "DRAFT" && (
                      <Button variant="ghost" size="sm" onClick={() => handleSend(quote.id)}>
                        <Send className="mr-1 h-3 w-3" />
                        Send
                      </Button>
                    )}
                    {quote.status === "ACCEPTED" && !quote.jobId && (
                      <Button variant="ghost" size="sm" onClick={() => handleConvert(quote.id)}>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Convert to Job
                      </Button>
                    )}
                    {quote.status === "ACCEPTED" && quote.jobId && (
                      <Link href={`/jobs/${quote.jobId}`} className="text-sm text-primary hover:underline">
                        View Job
                      </Link>
                    )}
                    {quote.status === "SENT" && (
                      <Button variant="ghost" size="sm" onClick={() => handleDecline(quote.id)}>
                        <XCircle className="mr-1 h-3 w-3 text-destructive" />
                        Decline
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!quotes.length && (
                <div className="p-6 text-center text-muted-foreground">
                  No quotes yet. Create your first quote to start.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
