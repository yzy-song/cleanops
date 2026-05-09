import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: "CleanOps — Cleaning Business Management",
    template: "%s — CleanOps",
  },
  description:
    "Professional cleaning business management SaaS. Job scheduling, GPS check-in, invoicing, Stripe payments, and payroll. Built for Irish cleaning companies in Dublin and across Ireland.",
  keywords: [
    "cleaning business software",
    "cleaning management",
    "Dublin cleaners",
    "Irish cleaning company",
    "job scheduling",
    "GPS check-in",
    "cleaning invoicing",
    "Stripe payments",
  ],
  openGraph: {
    title: "CleanOps — Cleaning Business Management",
    description:
      "Professional cleaning business management for Irish cleaning companies. Job scheduling, GPS check-in, invoicing & Stripe payments.",
    type: "website",
    locale: "en_IE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        <QueryProvider>
          {children}
          <Toaster richColors />
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
