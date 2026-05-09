"use client";

import Link from "next/link";
import { useWorkers, useDeleteWorker } from "@/hooks/use-workers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import { toast } from "sonner";

const eur = (cents: number | null) => `€${((cents ?? 0) / 100).toFixed(2)}`;

export default function WorkersPage() {
  const { data: workers, isLoading } = useWorkers();
  const deleteWorker = useDeleteWorker();

  const handleDelete = async (id: string, displayName: string) => {
    if (!confirm(`Deactivate ${displayName}?`)) return;
    try {
      await deleteWorker.mutateAsync(id);
      toast.success("Worker deactivated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to deactivate");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Workers</h1>
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
        <h1 className="text-2xl font-bold">Workers</h1>
        <Button asChild>
          <Link href="/workers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Worker
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {workers?.length ? (
            <div className="divide-y">
              {workers.map((w) => {
                const displayName = `${w.firstName} ${w.lastName}`;
                return (
                  <div key={w.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{displayName}</p>
                        <p className="text-sm text-muted-foreground">{w.user?.email || w.email} &middot; {eur(w.hourlyRate)}/hr</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!w.isActive && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Inactive</span>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/workers/${w.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(w.id, displayName)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No workers yet. <Link href="/workers/new" className="text-primary hover:underline">Add your first worker</Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
