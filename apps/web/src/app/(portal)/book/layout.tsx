import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Cleaning — CleanOps",
  description:
    "Book your cleaning service online. Professional cleaners in Dublin, Ireland. Residential and commercial cleaning available.",
  openGraph: {
    title: "Book a Cleaning Service — CleanOps",
    description: "Schedule professional cleaning in Dublin. Residential & commercial.",
    type: "website",
  },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
