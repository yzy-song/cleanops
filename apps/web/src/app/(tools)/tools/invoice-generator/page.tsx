"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface LineItem { description: string; quantity: number; unitPrice: number; }

export default function InvoiceGenerator() {
  const [companyName, setCompanyName] = useState("CleanOps Demo");
  const [companyAddr, setCompanyAddr] = useState("123 Main St, Dublin");
  const [companyEmail, setCompanyEmail] = useState("hello@cleanops.ie");
  const [clientName, setClientName] = useState("");
  const [clientAddr, setClientAddr] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceNum, setInvoiceNum] = useState("INV-2026-001");
  const [vatRate, setVatRate] = useState(13.5);
  const [items, setItems] = useState<LineItem[]>([{ description: "Regular Cleaning", quantity: 4, unitPrice: 25 }]);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vatAmount = Math.round(subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;

  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: string) => {
    const updated = [...items];
    (updated[idx] as any)[field] = field === "description" ? value : Number(value) || 0;
    setItems(updated);
  };

  const generate = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoiceNum}</title>
<style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#1a1a1a;line-height:1.5}
h1{font-size:28px;margin:0 0 4px}h2{font-size:16px;color:#555;font-weight:400;margin:0 0 24px}
.row{display:flex;justify-content:space-between;margin-bottom:16px}
.label{color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}
table{width:100%;border-collapse:collapse;margin:24px 0}
th{text-align:left;padding:8px;border-bottom:2px solid #e2e8f0;font-size:12px;color:#666}
td{padding:8px;border-bottom:1px solid #e2e8f0;font-size:14px}
.total-row td{font-weight:700;font-size:16px;border-top:2px solid #1a1a1a;padding-top:12px}
.vat-note{color:#666;font-size:11px;margin-top:16px}</style></head><body>
<h1>INVOICE</h1><h2>${companyName} · ${invoiceNum}</h2>
<div class="row"><div><div class="label">From</div><strong>${companyName}</strong><br>${companyAddr.replace(/\n/g,"<br>")}<br>${companyEmail}</div><div style="text-align:right"><div class="label">To</div><strong>${clientName}</strong><br>${clientAddr.replace(/\n/g,"<br>")}</div></div>
<div style="text-align:right;margin:16px 0"><span class="label">Date: </span>${invoiceDate}</div>
<table><thead><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr></thead><tbody>
${items.map(i => `<tr><td>${i.description}</td><td style="text-align:right">${i.quantity}</td><td style="text-align:right">€${i.unitPrice.toFixed(2)}</td><td style="text-align:right">€${(i.quantity*i.unitPrice).toFixed(2)}</td></tr>`).join("")}
<tr class="total-row"><td colspan="3" style="text-align:right">Subtotal</td><td style="text-align:right">€${subtotal.toFixed(2)}</td></tr>
<tr><td colspan="3" style="text-align:right">VAT (${vatRate}%)</td><td style="text-align:right">€${vatAmount.toFixed(2)}</td></tr>
<tr class="total-row"><td colspan="3" style="text-align:right">Total</td><td style="text-align:right">€${total.toFixed(2)}</td></tr>
</tbody></table>
<p class="vat-note">VAT ${vatRate}% — ${vatRate===13.5?"Residential":"Commercial"} rate</p>
</body></html>`;
    const win = window.open("", "_blank", "width=800,height=900");
    win?.document.write(html);
    win?.document.close();
  };

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Tools
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Invoice Generator</h1>
            <p className="text-sm text-slate-700 dark:text-slate-300">Create branded invoices instantly. Data stays in your browser.</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Company Name" value={companyName} onChange={setCompanyName} />
              <Field label="Client Name" value={clientName} onChange={setClientName} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Company Address</Label>
                <Textarea rows={2} value={companyAddr} onChange={(e) => setCompanyAddr(e.target.value)} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Client Address</Label>
                <Textarea rows={2} value={clientAddr} onChange={(e) => setClientAddr(e.target.value)} className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Invoice #" value={invoiceNum} onChange={setInvoiceNum} />
              <Field label="Date" value={invoiceDate} onChange={setInvoiceDate} type="date" />
              <Field label="VAT %" value={String(vatRate)} onChange={(v) => setVatRate(Number(v) || 0)} type="number" />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Line Items</span>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className="flex-1 text-sm" />
                    <Input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} className="w-16 text-sm text-right" />
                    <span className="text-xs text-slate-400">×</span>
                    <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", e.target.value)} className="w-20 text-sm text-right" />
                    <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="shrink-0"><Trash2 className="h-4 w-4 text-red-400" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-900">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">Total: €{total.toFixed(2)}</p>
              <p className="text-xs text-slate-700">Subtotal €{subtotal.toFixed(2)} + VAT {vatRate}%</p>
            </div>
            <Button onClick={generate} className="gap-2" disabled={!clientName || items.length === 0}>
              <FileText className="h-4 w-4" /> Generate Invoice
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
    </div>
  );
}
