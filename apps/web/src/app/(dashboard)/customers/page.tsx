"use client";

import Link from "next/link";
import { useState } from "react";
import { useCustomers, useDeleteCustomer, useCustomersCreditRisk } from "@/hooks/use-customers";
import { NewCustomerSheet } from "@/components/customer/new-customer-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Building2, MapPin, AlertTriangle, FileText, Search, Users, Building, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRoleGuard } from "@/hooks/use-role-guard";

export default function CustomersPage() {
  const { data: customers, isLoading, refetch } = useCustomers();
  useRoleGuard(["ADMIN", "MANAGER"]);
  const { data: creditRisks } = useCustomersCreditRisk();
  const deleteCustomer = useDeleteCustomer();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "commercial" | "residential">("");

  const riskMap = new Map(creditRisks?.map((r) => [r.id, r]));

  const filtered = (customers ?? []).filter((c: any) => {
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase()) &&
        !c.address?.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter === "commercial" && !c.isCommercial) return false;
    if (typeFilter === "residential" && c.isCommercial) return false;
    return true;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await deleteCustomer.mutateAsync(id);
      toast.success("Customer deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Customers</h1>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
        {(["", "commercial", "residential"] as const).map((t) => (
          <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)}>
            {t === "" ? <Users className="mr-1 h-3.5 w-3.5" /> : t === "commercial" ? <Building className="mr-1 h-3.5 w-3.5" /> : <Home className="mr-1 h-3.5 w-3.5" />}
            {t || "All"}
          </Button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">{filtered.length} customers</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {c.address}
                    </div>
                    <div className="mt-1 flex gap-2">
                      {c.isCommercial && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700">Commercial</span>
                      )}
                      {!c.isCommercial && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">Residential</span>
                      )}
                      {c.postalCode && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.postalCode}</span>
                      )}
                      {riskMap.has(c.id) && (
                        (() => {
                          const risk = riskMap.get(c.id)!;
                          if (risk.riskLevel === 'LOW') return null;
                          const colors: Record<string, string> = {
                            MEDIUM: "bg-yellow-100 text-yellow-700",
                            HIGH: "bg-red-100 text-red-700",
                          };
                          return (
                            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors[risk.riskLevel]}`}>
                              <AlertTriangle className="inline h-3 w-3 mr-0.5" />
                              {risk.riskLevel === "HIGH" ? `${risk.unpaidCount} overdue` : `${risk.unpaidCount} unpaid`}
                            </span>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/customers/${c.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id, c.name)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!filtered.length && (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            No customers yet. <Link href="/customers/new" className="text-primary hover:underline">Add your first customer</Link>
          </div>
        )}
      </div>
      <NewCustomerSheet open={sheetOpen} onOpenChange={setSheetOpen} onCreated={() => refetch()} />
    </div>
  );
}
