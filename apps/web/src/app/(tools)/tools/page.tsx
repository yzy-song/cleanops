import Link from "next/link";
import { Calculator, TrendingUp, DollarSign, Clock, Rocket, Sparkles, CheckSquare, FileText } from "lucide-react";

const tools = [
  {
    icon: Calculator,
    title: "Profit Margin Calculator",
    desc: "Calculate your true profit per job after all costs. See your margin breakdown in real-time.",
    href: "/tools/profit-margin",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Clock,
    title: "Cleaning Time Estimator",
    desc: "Estimate job duration by room type and size. Compare solo vs team scenarios.",
    href: "/tools/time-estimator",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: DollarSign,
    title: "Employee Cost Calculator",
    desc: "True cost per cleaner — wages, PRSI (11.15%), pension, equipment, insurance.",
    href: "/tools/employee-cost",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: TrendingUp,
    title: "Software ROI Calculator",
    desc: "See how much time and money you'd save by switching from spreadsheets to CleanOps.",
    href: "/tools/roi",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Rocket,
    title: "Startup Cost Calculator",
    desc: "Estimate your cleaning business startup costs with a 6-month cash projection.",
    href: "/tools/startup-cost",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: FileText,
    title: "Timesheet Calculator",
    desc: "Track employee hours, overtime, and pay. Interactive weekly timesheet grid.",
    href: "/tools/timesheet",
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    icon: Sparkles,
    title: "Business Name Generator",
    desc: "Find the perfect name for your cleaning company. Filter by style and tone.",
    href: "/tools/business-name",
    color: "bg-pink-100 text-pink-600",
  },
  {
    icon: CheckSquare,
    title: "Checklist Generator",
    desc: "Create custom cleaning checklists from templates. Print-ready.",
    href: "/tools/checklist",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Calculator,
    title: "Cleaning Quote Calculator",
    desc: "Get an instant quote based on property size, rooms, and service type.",
    href: "/book",
    color: "bg-teal-100 text-teal-600",
  },
];

export default function ToolsPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl font-bold tracking-tight">Free Tools for Cleaning Businesses</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Practical calculators to help you run a smarter cleaning business. 100% free — no signup required. Your data stays in your browser.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-xl border bg-white p-6 hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${t.color} mb-4`}>
                <t.icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {t.title}
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">{t.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-20 text-center p-12 rounded-2xl bg-slate-50 border">
          <h2 className="text-2xl font-bold mb-3">Ready for the full platform?</h2>
          <p className="text-slate-700 mb-6 max-w-md mx-auto">
            These tools are just a taste. CleanOps gives you the complete operating system for your cleaning business.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:opacity-90 transition-opacity">
            Start Free 14-Day Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
