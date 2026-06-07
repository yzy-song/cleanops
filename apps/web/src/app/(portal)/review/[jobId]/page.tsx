"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ExternalLink, MessageSquare, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ReviewPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/portal/review/${jobId}`)
      .then((res) => setInfo(res.data))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/portal/review/${jobId}/feedback`, { feedback });
      setSubmitted(true);
      toast.success("Thank you! We'll get back to you shortly.");
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ReviewSkeleton />;
  if (!info) return <NotFound />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className="h-8 w-8 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h1 className="text-xl font-bold">How was your cleaning?</h1>
            <p className="text-muted-foreground text-sm">
              {info.companyName} would love your feedback, {info.customerName}!
            </p>
          </div>

          {/* Google Review */}
          {info.googleReviewUrl ? (
            <a
              href={info.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button className="w-full gap-2" size="lg">
                <Star className="h-5 w-5" />
                Leave a Google Review
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Google Reviews coming soon — company hasn&apos;t set up their profile yet.
            </p>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Private Feedback */}
          {submitted ? (
            <div className="space-y-2">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-medium">Thank you for your feedback!</p>
              <p className="text-xs text-muted-foreground">We&apos;ll review it and get back to you shortly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Not completely satisfied?</p>
              </div>
              <p className="text-xs text-muted-foreground">We want to make it right.</p>
              <Textarea
                placeholder="Tell us what went wrong — we'll fix it..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSubmitFeedback}
                disabled={!feedback.trim() || submitting}
              >
                {submitting ? "Submitting..." : "Send Feedback"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-8 pb-8 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardContent className="py-12 space-y-4">
          <p className="text-lg font-semibold">Page not found</p>
          <p className="text-sm text-muted-foreground">This review link has expired or is invalid.</p>
        </CardContent>
      </Card>
    </div>
  );
}
