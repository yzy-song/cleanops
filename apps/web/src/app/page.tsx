import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CreditCard,
  MapPin,
  BarChart3,
  FileText,
  Users,
  ArrowRight,
  CheckCircle2,
  Star,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    desc: "Drag-and-drop job scheduling with route optimization. Assign cleaners, track time, and avoid double-bookings.",
  },
  {
    icon: FileText,
    title: "Instant Quotes & Invoicing",
    desc: "Auto-generate professional quotes and invoices. Clients approve online. Stripe payments built in.",
  },
  {
    icon: CreditCard,
    title: "Online Payments",
    desc: "Accept card payments via Stripe Connect. Auto-reconciliation. Faster cash flow. No chasing invoices.",
  },
  {
    icon: Users,
    title: "Worker Management",
    desc: "Track hours, GPS check-ins, skills, and payroll. Built-in PRSI and pension calculations.",
  },
  {
    icon: MapPin,
    title: "GPS & Eircode",
    desc: "Ireland-first: Eircode geocoding, GPS check-in verification, and optimized travel routes.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Reporting",
    desc: "Revenue dashboards, VAT reports, payroll summaries, and client profitability — all in one place.",
  },
];

const steps = [
  { title: "Sign Up", desc: "Create your account in 30 seconds. No credit card required." },
  { title: "Add Your Team", desc: "Invite your cleaners and set up your service catalog." },
  { title: "Start Growing", desc: "Send quotes, schedule jobs, and get paid — all from one dashboard." },
];

const stats = [
  { value: "15 hrs", label: "Saved per week on admin" },
  { value: "23%", label: "Average revenue increase" },
  { value: "98%", label: "Invoice payment rate" },
  { value: "4.9/5", label: "Customer satisfaction" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ====== Nav ====== */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              CO
            </div>
            <span className="text-lg font-semibold tracking-tight">CleanOps</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-20 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <Globe className="h-4 w-4" />
              Built for Irish Cleaning Companies
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Run your cleaning business
              <br />
              <span className="text-primary">without the paperwork</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              The all-in-one platform for Irish cleaning companies. Schedule jobs, send quotes, get paid online, and grow your business — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button size="lg" className="gap-2 text-base px-8" asChild>
                <Link href="/register">
                  Start Free 14-Day Trial <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-base px-8" asChild>
                <Link href="/book">See a demo booking →</Link>
              </Button>
            </div>
            <p className="text-sm text-slate-400">No credit card required · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ====== Stats ====== */}
      <section className="border-y bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 text-center">
            {stats.map((s) => (
              <div key={s.label} className="space-y-1">
                <p className="text-3xl font-bold text-primary">{s.value}</p>
                <p className="text-sm text-slate-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Features ====== */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to grow</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Stop juggling spreadsheets, WhatsApp, and paper invoices. CleanOps handles the admin so you can focus on your clients.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== How It Works ====== */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Get started in minutes</h2>
            <p className="text-lg text-slate-600">No training required. You'll be up and running before your next coffee.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto">
            {steps.map((s, i) => (
              <div key={s.title} className="text-center space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mx-auto">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Ireland Differentiator ====== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-2xl bg-primary/5 border p-12 text-center space-y-4 max-w-3xl mx-auto">
            <MapPin className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Built for Ireland, not retrofitted</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Eircode routing, 13.5% / 23% VAT handling, Stripe Connect euro payments, and Irish payroll compliance — features that generic American software simply doesn't support.
            </p>
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to grow your cleaning business?</h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Join 50+ Irish cleaning companies already using CleanOps. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" variant="secondary" className="gap-2 text-base px-8" asChild>
              <Link href="/register">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              14-day free trial
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Card payments via Stripe
            </div>
          </div>
        </div>
      </section>

      {/* ====== Footer ====== */}
      <footer className="border-t bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                CO
              </div>
              <span>CleanOps &copy; {new Date().getFullYear()}</span>
            </div>
            <div className="flex gap-6">
              <Link href="/login" className="hover:text-slate-700 transition-colors">Login</Link>
              <Link href="/register" className="hover:text-slate-700 transition-colors">Sign Up</Link>
              <Link href="/book" className="hover:text-slate-700 transition-colors">Book a Demo</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
