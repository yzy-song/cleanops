"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/portal/send-link", { email });
    } catch (err: any) {
      // 400-level errors (Not Found) still show success for security
    }
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Check your email</h2>
            <p className="text-muted-foreground">
              If an account exists with that email, you'll receive a login link shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Customer Portal</CardTitle>
          <CardDescription>Enter your email to receive a login link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send login link"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              First time here?{" "}
              <a href="/book" className="text-primary hover:underline">
                Book a service
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
