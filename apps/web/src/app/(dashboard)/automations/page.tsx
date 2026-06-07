"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Workflow, Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

const triggers = [
  { value: "JOB_COMPLETED", label: "When a job is completed" },
  { value: "INVOICE_OVERDUE", label: "When an invoice is overdue" },
  { value: "QUOTE_ACCEPTED", label: "When a quote is accepted" },
];

export default function AutomationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  useEffect(() => {
    if (user && user.role === "WORKER") router.push("/dashboard");
  }, [user, router]);
  const { data, isLoading } = useQuery({ queryKey: ["automations"], queryFn: async () => { const r = await api.get("/automations"); return r.data as any[]; } });
  const createMutation = useMutation({ mutationFn: (body: any) => api.post("/automations", body), onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success("Automation created"); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/automations/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success("Deleted"); } });
  const updateMutation = useMutation({ mutationFn: ({ id, ...body }: any) => api.patch(`/automations/${id}`, body), onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success("Updated"); } });

  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("JOB_COMPLETED");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createMutation.mutateAsync({ name, trigger, action: "SEND_EMAIL", config: { subject, body } });
    setName(""); setSubject(""); setBody(""); setShowNew(false);
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground text-sm">Set up rules to automatically send emails when things happen</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Rule</Button>
      </div>

      {showNew && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Automation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Send thank-you email" /></div>
            <div className="space-y-1.5"><Label>Trigger</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{triggers.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Email Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Your cleaning is complete!" /></div>
            <div className="space-y-1.5"><Label>Email Body</Label><Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Hi {{name}}, thank you for..." /><p className="text-xs text-muted-foreground">Use {"{{name}}"} for customer name</p></div>
            <div className="flex gap-2"><Button onClick={handleCreate} size="sm" className="gap-1"><Check className="h-4 w-4" /> Save</Button><Button variant="ghost" size="sm" onClick={() => setShowNew(false)}><X className="h-4 w-4 mr-1" /> Cancel</Button></div>
          </CardContent>
        </Card>
      )}

      {!data?.length ? (
        <Card><CardContent className="py-12 text-center"><Workflow className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No automations configured</p><p className="text-xs text-muted-foreground mt-1">Create your first automation to start working smarter.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {data.map((a: any) => (
            <Card key={a.id} className={!a.isActive ? "opacity-50" : ""}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <Workflow className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{triggers.find((t) => t.value === a.trigger)?.label} → Send Email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={a.isActive} onCheckedChange={(v) => updateMutation.mutate({ id: a.id, isActive: v })} />
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
