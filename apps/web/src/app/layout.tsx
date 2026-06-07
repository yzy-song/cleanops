import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: "CleanOps — Cleaning Business Management Software",
    template: "%s — CleanOps",
  },
  description:
    "Professional cleaning business management SaaS for Irish cleaning companies. Job scheduling, GPS check-in, invoicing, Stripe payments, payroll. Built for Dublin and across Ireland.",
  keywords: [
    "cleaning business software",
    "cleaning management software",
    "Dublin cleaners",
    "Irish cleaning company",
    "cleaning job scheduling",
    "cleaning invoicing software",
    "GPS check-in",
    "Stripe payments Ireland",
    "cleaning business app",
    "maid service software",
  ],
  authors: [{ name: "CleanOps" }],
  openGraph: {
    title: "CleanOps — Cleaning Business Management Software",
    description:
      "All-in-one platform for Irish cleaning companies. Schedule jobs, send invoices, get paid online. Start your free trial.",
    type: "website",
    locale: "en_IE",
    siteName: "CleanOps",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CleanOps — Cleaning Business Management",
    description: "All-in-one platform for Irish cleaning companies. Start your free trial.",
  },
  robots: { index: true, follow: true },
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
      </body>
    </html>
  );
}
