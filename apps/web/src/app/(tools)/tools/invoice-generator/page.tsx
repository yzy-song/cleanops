"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Plus, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface LineItem { description: string; quantity: number; unitPrice: number; }

const eur = (v: number) => `€${v.toFixed(2)}`;

export default function InvoiceGenerator() {
  const [companyName, setCompanyName] = useState("Your Company Name");
  const [companyVat, setCompanyVat] = useState("IE1234567");
  const [companyAddr, setCompanyAddr] = useState("123 Main Street\nDublin, D01 ABC1");
  const [companyEmail, setCompanyEmail] = useState("hello@yourcompany.ie");
  const [clientName, setClientName] = useState("Client Name");
  const [clientAddr, setClientAddr] = useState("456 Oak Avenue\nCork, T12 XYZ2");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceNum, setInvoiceNum] = useState("INV-2026-001");
  const [dueDate, setDueDate] = useState("");
  const [vatRate, setVatRate] = useState(13.5);
  const [notes, setNotes] = useState("Thank you for your business!");
  const [items, setItems] = useState<LineItem[]>(() => [
    { description: "Regular Cleaning Service", quantity: 1, unitPrice: 80 },
    { description: "Window Cleaning (interior)", quantity: 1, unitPrice: 30 },
  ]);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vatAmount = Math.round(subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;

  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, val: string) => {
    const updated = [...items];
    (updated[idx] as any)[field] = field === "description" ? val : Number(val) || 0;
    setItems(updated);
  };

  const downloadPdf = () => {
    const body = items.map((i) => `<tr><td>${i.description}</td><td class="tr">${i.quantity}</td><td class="tr">${eur(i.unitPrice)}</td><td class="tr">${eur(i.quantity*i.unitPrice)}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoiceNum}</title><style>body{font-family:Arial;max-width:700px;margin:40px auto;color:#1a1a1a;line-height:1.5}.hd{display:flex;justify-content:space-between;margin-bottom:40px}.logo{font-size:24px;font-weight:700;color:#2563EB}.ci{font-size:12px;color:#64748b;margin-top:4px}.inv{font-size:28px;font-weight:700}.h2{font-size:14px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin:0 0 4px}.row{display:flex;justify-content:space-between;margin-bottom:24px}.info{font-size:13px}table{width:100%;border-collapse:collapse;margin:24px 0}th{text-align:left;padding:10px 8px;border-bottom:2px solid #e2e8f0;font-size:11px;color:#64748b;text-transform:uppercase}td{padding:10px 8px;border-bottom:1px solid #e2e8f0;font-size:13px}.tr{text-align:right}.tot{margin-left:auto;width:260px}.tot-r{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}.tot-t{border-top:2px solid #1e293b;margin-top:4px;padding-top:10px;font-size:16px;font-weight:700}.nt{font-size:11px;color:#64748b;margin-top:40px;border-top:1px solid #e2e8f0;padding-top:12px}.ft{font-size:10px;color:#94a3b8;text-align:center;margin-top:50px}</style></head><body>
<div class="hd"><div><div class="logo">${esc(companyName)}</div><div class="ci">${esc(companyAddr)}<br>${esc(companyEmail)}<br>VAT: ${esc(companyVat)}</div></div><div style="text-align:right"><div class="inv">INVOICE</div><div class="info" style="color:#475569">${esc(invoiceNum)}<br>Date: ${invoiceDate}${dueDate?`<br>Due: ${dueDate}`:""}</div></div></div>
<div class="row"><div><div class="h2">Bill To</div><strong>${esc(clientName)}</strong><br><div class="info" style="white-space:pre-line">${esc(clientAddr)}</div></div></div>
<table><thead><tr><th>Description</th><th class="tr">Qty</th><th class="tr">Unit Price</th><th class="tr">Total</th></tr></thead><tbody>${body}</tbody></table>
<div class="tot"><div class="tot-r"><span>Subtotal</span><span>${eur(subtotal)}</span></div><div class="tot-r"><span>VAT (${vatRate}%)</span><span>${eur(vatAmount)}</span></div><div class="tot-r tot-t"><span>Total</span><span>${eur(total)}</span></div></div>
${notes?`<div class="nt">${esc(notes)}</div>`:""}<div class="ft">${esc(companyName)} · ${esc(companyVat)}</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `${invoiceNum.replace(/\s/g,"_")}.html`; a.click();
  };

  return (
    <div>
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-6">
          <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Tools
          </Link>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* LEFT: Form */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Invoice Generator</h1>
                <p className="text-muted-foreground text-sm">Fill in the details — preview updates live on the right.</p>
              </div>

              <div className="rounded-xl border bg-card p-6 space-y-5">
                <Section title="Your Company">
                  <Field label="Company Name" value={companyName} onChange={setCompanyName} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="VAT Number" value={companyVat} onChange={setCompanyVat} />
                    <Field label="Email" value={companyEmail} onChange={setCompanyEmail} type="email" />
                  </div>
                  <Area label="Address" value={companyAddr} onChange={setCompanyAddr} />
                </Section>

                <Section title="Client">
                  <Field label="Client Name" value={clientName} onChange={setClientName} />
                  <Area label="Address" value={clientAddr} onChange={setClientAddr} />
                </Section>

                <Section title="Details">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Invoice #" value={invoiceNum} onChange={setInvoiceNum} />
                    <Field label="Date" value={invoiceDate} onChange={setInvoiceDate} type="date" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Due Date" value={dueDate} onChange={setDueDate} type="date" />
                    <Field label="VAT %" value={String(vatRate)} onChange={(v) => setVatRate(Number(v) || 0)} type="number" />
                  </div>
                </Section>

                <Section title="Line Items">
                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className="flex-1 text-sm h-9" />
                        <Input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} className="w-16 text-sm h-9" />
                        <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", e.target.value)} className="w-20 text-sm h-9" />
                        <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="shrink-0"><Trash2 className="h-4 w-4 text-red-400" /></Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={addItem} className="mt-2"><Plus className="h-3 w-3 mr-1" /> Add Line</Button>
                </Section>

                <Section title="Additional">
                  <Area label="Notes" value={notes} onChange={setNotes} placeholder="Payment terms, thank you note..." />
                </Section>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className="text-lg font-bold">Total: {eur(total)}</p>
                    <p className="text-xs text-muted-foreground">Subtotal {eur(subtotal)} + VAT {vatRate}%</p>
                  </div>
                  <Button onClick={downloadPdf} className="gap-2"><FileText className="h-4 w-4" /> Download</Button>
                </div>
              </div>
            </div>

            {/* RIGHT: Live Preview */}
            <div className="hidden lg:block sticky top-24 self-start">
              <div className="rounded-xl border bg-white shadow-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 ml-2">Preview</span>
                </div>
                <div className="p-8 bg-white" style={{ minHeight: 600 }}>
                  <div className="font-sans text-slate-900 text-sm leading-relaxed">
                    <div className="flex justify-between items-start mb-10">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{companyName || "Your Company"}</div>
                        <div className="text-[11px] text-slate-500 mt-1 leading-relaxed whitespace-pre-line">{companyAddr}{companyEmail ? `\n${companyEmail}` : ""}{companyVat ? `\nVAT: ${companyVat}` : ""}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-800">INVOICE</div>
                        <div className="text-xs text-slate-500 mt-1">{invoiceNum}<br />Date: {invoiceDate || "—"}{dueDate ? <><br />Due: {dueDate}</> : null}</div>
                      </div>
                    </div>
                    <div className="mb-8">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Bill To</div>
                      <div className="font-semibold text-sm">{clientName || "Client Name"}</div>
                      <div className="text-xs text-slate-500 whitespace-pre-line">{clientAddr}</div>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-slate-200 text-left text-[10px] text-slate-400 uppercase tracking-wider">
                          <th className="pb-2 font-semibold">Description</th><th className="pb-2 text-right font-semibold">Qty</th><th className="pb-2 text-right font-semibold">Unit</th><th className="pb-2 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="py-2">{item.description || "—"}</td><td className="py-2 text-right">{item.quantity}</td><td className="py-2 text-right">{eur(item.unitPrice)}</td><td className="py-2 text-right">{eur(item.quantity * item.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end mt-6">
                      <div className="w-64 space-y-1 text-xs">
                        <div className="flex justify-between py-1"><span className="text-slate-500">Subtotal</span><span>{eur(subtotal)}</span></div>
                        <div className="flex justify-between py-1"><span className="text-slate-500">VAT ({vatRate}%)</span><span>{eur(vatAmount)}</span></div>
                        <div className="flex justify-between py-1.5 border-t-2 border-slate-800 text-sm font-bold"><span>Total</span><span>{eur(total)}</span></div>
                      </div>
                    </div>
                    {notes && <div className="mt-10 pt-4 border-t border-slate-200 text-[10px] text-slate-400">{notes}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t bg-muted">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to automate your invoicing?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            With CleanOps, invoices are auto-generated from completed jobs. No manual entry. Get paid faster with online card payments.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button asChild><Link href="/register">Start Free Trial <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
            <Button variant="outline" asChild><Link href="/book">Book a Demo</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-5 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} className="text-sm h-9" />
    </div>
  );
}

function Area({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className="text-sm mt-1" placeholder={placeholder} />
    </div>
  );
}

function esc(s: string) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
