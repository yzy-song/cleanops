import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — CleanOps",
  description:
    "Simple pricing for your cleaning business. Starter €29/mo, Pro €69/mo, Business €129/mo. 14-day free trial, no credit card required. Built for Irish cleaning companies.",
  openGraph: {
    title: "CleanOps Pricing — Simple plans for cleaning businesses",
    description:
      "Starter €29/mo, Pro €69/mo, Business €129/mo. 14-day free trial, no credit card.",
    type: "website",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
