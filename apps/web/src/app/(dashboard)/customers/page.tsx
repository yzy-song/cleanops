"use client";

import Link from "next/link";
import { useCustomers, useDeleteCustomer, useCustomersCreditRisk } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Building2, MapPin, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();
  const { data: creditRisks } = useCustomersCreditRisk();
  const deleteCustomer = useDeleteCustomer();

  const riskMap = new Map(creditRisks?.map((r) => [r.id, r]));

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
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customers?.map((c) => (
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
                      {c.eircode && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.eircode}</span>
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
        {!customers?.length && (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            No customers yet. <Link href="/customers/new" className="text-primary hover:underline">Add your first customer</Link>
          </div>
        )}
      </div>
    </div>
  );
}
