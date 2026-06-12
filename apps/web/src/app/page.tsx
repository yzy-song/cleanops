import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SoftwareAppStructuredData, FAQStructuredData } from "@/components/seo/structured-data";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import {
  Calendar, CreditCard, MapPin, BarChart3, FileText, Users,
  ArrowRight, CheckCircle2, Star, Globe, Clock, DollarSign,
  Sparkles, Shield, ChevronDown, MessageCircle,
} from "lucide-react";

// ====== Data ======
const problems = [
  { icon: Calendar, title: "Scattered Booking Systems", desc: "WhatsApp, text messages, phone calls — booking requests come from everywhere and nothing is tracked." },
  { icon: CreditCard, title: "Chasing Payments Manually", desc: "Cash, bank transfers, Revolut — reconciling payments takes hours and invoices get lost." },
  { icon: Users, title: "Scheduling Chaos", desc: "Who's working where? When? Double-bookings and missed appointments destroy your reputation." },
];

const features = [
  {
    icon: Globe, title: "Custom Booking Forms", desc: "Embed on your website in 2 minutes. Clients pick service, property size, frequency — auto-generates instant quotes.",
    color: "bg-purple-100 text-purple-600",
    stats: null,
  },
  {
    icon: CreditCard, title: "Payments & Invoicing", desc: "Auto-generate invoices. Accept card payments via Stripe. Payment reminders on autopilot.",
    color: "bg-emerald-100 text-emerald-600",
    stats: "98% payment collection rate",
  },
  {
    icon: Users, title: "Staff Management", desc: "Assign jobs, track GPS check-ins, manage schedules. Staff see their day in real-time.",
    color: "bg-blue-100 text-blue-600",
    stats: "15 hrs admin saved/week",
  },
  {
    icon: Star, title: "Review Collection", desc: "Auto-request reviews after every job. Happy clients → Google. Unhappy clients → private feedback. Build your reputation on autopilot.",
    color: "bg-amber-100 text-amber-600",
    stats: "4.9 ★ average rating",
  },
  { icon: Calendar, title: "Recurring Jobs", desc: "Weekly, fortnightly, monthly schedules that run automatically. Never miss a repeat booking.", color: "bg-teal-100 text-teal-600", stats: null },
  { icon: BarChart3, title: "Revenue Analytics", desc: "Real-time dashboards. See revenue, profit margins, staff performance — all in one place.", color: "bg-rose-100 text-rose-600", stats: null },
];

const stats = [
  { value: "15 hrs", label: "Admin time saved per week" },
  { value: "23%", label: "Average revenue increase" },
  { value: "98%", label: "Payment collection rate" },
  { value: "4.9/5", label: "Customer satisfaction" },
];

const testimonials = [
  { quote: "CleanOps saved us 15 hours a week on admin. We've grown from 3 to 12 staff without hiring a single admin person.", name: "Sarah O'Brien", company: "SparkleClean Co.", location: "Dublin", stars: 5 },
  { quote: "The booking form on our website now brings in 40% of new clients. It paid for itself in the first week.", name: "Tom Murphy", company: "Cork Cleaning Services", location: "Cork", stars: 5 },
  { quote: "Finally, software that understands Irish VAT and Eircodes. The GPS check-in gives our clients real peace of mind.", name: "Aisling Ryan", company: "Galway Home Cleaners", location: "Galway", stars: 5 },
];

const niches = [
  { icon: "🏠", title: "Residential", desc: "Domestic cleaning services" },
  { icon: "🏢", title: "Commercial", desc: "Office & business cleaning" },
  { icon: "🏖️", title: "Airbnb & Short Lets", desc: "Turnover cleaning" },
  { icon: "📦", title: "Move-In / Move-Out", desc: "End of tenancy deep cleans" },
  { icon: "🧹", title: "Carpet & Deep Clean", desc: "Specialist services" },
  { icon: "🏗️", title: "Post-Construction", desc: "Builder & renovation clean" },
];

const faqs = [
  { q: "How long does it take to set up?", a: "Most businesses are fully up and running within 30 minutes. Import your clients, customize your booking form, and you're ready to go." },
  { q: "Can my cleaners use it on their phone?", a: "Yes! CleanOps works on any device — phone, tablet, or desktop. Staff can view their schedule, check in via GPS, and mark jobs complete from their phone." },
  { q: "How do payments work?", a: "We integrate with Stripe — Ireland's most trusted payment processor. Clients pay by card, and funds arrive in your bank account within 2-7 days." },
  { q: "Can I embed the booking form on my website?", a: "Absolutely. Copy one line of code and paste it into your WordPress, Wix, or custom site. The form auto-matches your brand colors." },
  { q: "Is my data secure?", a: "Yes. We use enterprise-grade encryption. Your data is backed up daily and hosted on Oracle Cloud infrastructure in the EU." },
  { q: "Can I cancel anytime?", a: "Yes. No contracts, no lock-in. Cancel anytime with no penalties." },
];

// ====== Component ======
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SoftwareAppStructuredData />
      <FAQStructuredData items={faqs} />
      {/* ====== Nav ====== */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white text-sm">CO</div>
            CleanOps
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/tools" className="text-muted-foreground hover:text-foreground font-medium">Free Tools</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground font-medium">Pricing</Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">Log In</Link>
            <Button size="sm" className="rounded-full px-5" asChild>
              <Link href="/register">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ====== Hero ====== */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.2),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(5,150,105,0.1),transparent_50%)]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm">
                <span className="text-amber-400">★★★★★</span>
                <span>Trusted by 50+ cleaning companies</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
                Run your cleaning business<br />
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">like a machine.</span>
              </h1>
              <p className="text-lg text-white/70 max-w-xl">
                The all-in-one platform that handles bookings, payments, staff scheduling, and customer management — so you can stop juggling spreadsheets.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button size="lg" className="gap-2 text-base px-8 rounded-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-lg shadow-blue-500/25 group" asChild>
                  <Link href="/register">Start Your Free Trial <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 rounded-full h-12 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm" asChild>
                  <Link href="/book">See It In Action</Link>
                </Button>
              </div>
              <p className="text-sm text-white/50">Free 14-day trial · No credit card required · Cancel anytime</p>
            </div>
            {/* Floating Dashboard Preview — desktop only */}
            <div className="hidden lg:block relative">
              <div className="absolute -top-8 -right-4 w-full h-full bg-gradient-to-br from-blue-500/20 to-emerald-500/10 rounded-3xl blur-3xl" />
              <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-1 shadow-2xl shadow-black/40">
                <div className="rounded-xl bg-slate-900/80 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">📊 Dashboard Preview</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">LIVE DEMO</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ label: "Today", value: "12", sub: "Jobs" }, { label: "Revenue", value: "€1,420", sub: "This Week" }, { label: "Workers", value: "8", sub: "Active" }].map((k) => (
                      <div key={k.label} className="rounded-lg bg-slate-800/50 p-3 text-center border border-white/5">
                        <div className="text-lg font-bold text-white">{k.value}</div>
                        <div className="text-[10px] text-slate-400">{k.label}</div>
                        <div className="text-[9px] text-slate-500">{k.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-slate-800/30 h-20 flex items-end gap-1 px-2 pb-2">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-blue-500/60 to-blue-400/30 rounded-sm" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== Client Logos Marquee ====== */}
      <div className="relative bg-slate-900 border-t border-white/5 py-8 overflow-hidden">
        <p className="text-center text-xs text-slate-500 mb-4 tracking-wider uppercase">Trusted by cleaning companies across Ireland, UK &amp; beyond</p>
        <div className="flex gap-12 animate-[marquee_30s_linear_infinite] whitespace-nowrap" style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
          {[...Array(2)].map((_, round) => (
            <div key={round} className="flex gap-12 shrink-0">
              {["SparkleClean Co.", "Dublin Cleaning Co.", "Cork Home Services", "Galway Maid Pro", "Limerick Shine", "Elite Cleaners IE", "PureClean Solutions", "Green Clean Dublin"].map((name) => (
                <span key={name} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-default">{name}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ====== Problem ====== */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center space-y-4 mb-16">
            <p className="text-blue-400 font-semibold text-sm tracking-wide uppercase">The Problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Running a cleaning business is chaotic.</h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">Without the right tools, you're losing time, money, and clients.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
            {problems.map((p) => (
              <div key={p.title} className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 mx-auto">
                  <p.icon className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Features ====== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Everything you need. Nothing you don&apos;t.</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Purpose-built for cleaning businesses — not a generic field service tool.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border bg-white p-6 hover:shadow-lg hover:border-blue-200 transition-all relative overflow-hidden">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.color} mb-4`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{f.desc}</p>
                {f.stats && (
                  <div className="mt-auto pt-3 border-t">
                    <span className="text-xs font-semibold text-emerald-600">{f.stats}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Dashboard Preview + Stats ====== */}
      <section className="py-24 bg-muted border-y">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-slate-500">
              <Shield className="h-4 w-4 text-blue-500" />
              app.cleanops.yzysong.com
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">See CleanOps in action</h2>
            <p className="text-slate-600 max-w-xl mx-auto text-lg">One dashboard. Complete control of your entire operation.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-4 text-center max-w-4xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="space-y-2">
                <p className="text-4xl font-extrabold text-blue-600">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Testimonials ====== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">What cleaning business owners say</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border bg-white p-8 space-y-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-slate-700 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</blockquote>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.company} · {t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Solutions by Niche ====== */}
      <section className="py-24 bg-muted border-y">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Solutions for every cleaning niche</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Whatever type of cleaning you do, CleanOps adapts to your workflow.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
            {niches.map((n) => (
              <div key={n.title} className="rounded-xl border bg-white p-5 text-center hover:border-blue-200 hover:shadow-sm transition-all">
                <p className="text-2xl mb-2">{n.icon}</p>
                <p className="font-semibold text-sm">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== ROI Calculator ====== */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">What you&apos;ll save with CleanOps</h2>
            <p className="text-slate-600 text-lg">Based on a typical cleaning business with 30 clients.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3 text-center">
            <RoiCard icon={<Clock className="h-6 w-6" />} value="11.3 hrs" label="Admin time saved per week" color="bg-blue-100 text-blue-600" />
            <RoiCard icon={<DollarSign className="h-6 w-6" />} value="€21,600" label="Revenue uplift per year" color="bg-emerald-100 text-emerald-600" />
            <RoiCard icon={<CreditCard className="h-6 w-6" />} value="€7,200" label="Payment recovery per year" color="bg-purple-100 text-purple-600" />
          </div>
          <p className="text-center mt-8 text-2xl font-extrabold text-blue-600">€32,760 estimated annual benefit</p>
        </div>
      </section>

      {/* ====== FAQ ====== */}
      <section className="py-24 bg-muted border-y">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Got questions?</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border bg-white">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-medium text-sm list-none">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Final CTA ====== */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.15),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-6 py-24 text-center relative z-10 space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold">Stop losing money to bad systems.</h2>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            Join 50+ cleaning companies already using CleanOps. Start your free 14-day trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Button size="lg" className="gap-2 text-base px-8 rounded-full h-12 bg-blue-500 hover:bg-blue-400" asChild>
              <Link href="/register">Start Your Free Trial <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="pt-6">
            <p className="text-sm text-white/40 mb-3">Get cleaning business tips delivered to your inbox</p>
            <NewsletterForm />
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-white/50 pt-6">
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* ====== Footer ====== */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 sm:grid-cols-4 mb-12">
            <div className="space-y-4 sm:col-span-1">
              <div className="flex items-center gap-2.5 font-bold text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm">CO</div>
                CleanOps
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">The operating system for modern cleaning companies.</p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-4">Product</p>
              <div className="space-y-2 text-sm text-slate-400">
                <Link href="/login" className="block hover:text-white transition-colors">Login</Link>
                <Link href="/register" className="block hover:text-white transition-colors">Sign Up</Link>
                <Link href="/tools" className="block hover:text-white transition-colors">Free Tools</Link>
                <Link href="/book" className="block hover:text-white transition-colors">Book a Demo</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm mb-4">Compare</p>
              <div className="space-y-2 text-sm text-slate-400">
                <span className="block">vs Spreadsheets</span>
                <span className="block">vs Jobber</span>
                <span className="block">vs ZenMaid</span>
                <span className="block">vs Spotless</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm mb-4">Company</p>
              <div className="space-y-2 text-sm text-slate-400">
                <Link href="mailto:hello@cleanops.ie" className="block hover:text-white transition-colors">hello@cleanops.ie</Link>
                <span className="block">Dublin, Ireland</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between gap-4 text-sm text-slate-500">
            <span>&copy; {new Date().getFullYear()} CleanOps. All rights reserved.</span>
            <div className="flex gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>GDPR</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RoiCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="rounded-2xl border bg-white p-8 text-center space-y-3">
      <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${color} mx-auto`}>{icon}</div>
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
