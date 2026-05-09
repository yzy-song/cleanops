import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Invoice {
  id: string;
  companyId: string;
  jobId: string;
  invoiceNumber: number | null;
  amount: number;
  vatAmount: number;
  pensionAmount: number;
  status: string;
  paymentMethod: string | null;
  paymentLink: string | null;
  paidAt: string | null;
  reminderSentAt: string | null;
  reminderCount: number;
  createdAt: string;
  company?: { name: string; vatNumber?: string };
  job?: {
    id: string;
    scheduledStart: string;
    estimatedDuration?: number;
    customer?: { name: string; phone?: string; address: string; isCommercial?: boolean };
    assignments?: { worker?: { firstName: string; lastName: string } }[];
  };
}

export function formatInvoiceNumber(invoice: Invoice): string {
  const num = invoice.invoiceNumber;
  if (!num) return `#${invoice.id.slice(0, 8)}`;
  return `INV-${new Date(invoice.createdAt).getFullYear()}-${String(num).padStart(4, "0")}`;
}

export function useInvoices(query?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["invoices", query],
    queryFn: async () => {
      const res = await api.get("/invoice", { params: query });
      return { data: res.data.data as Invoice[], meta: res.data.meta };
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: async () => {
      const res = await api.get(`/invoice/${id}`);
      return res.data.data as Invoice;
    },
    enabled: !!id,
  });
}

export function useGenerateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const res = await api.post(`/invoice/generate/${jobId}`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useMarkAsPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: string; paymentMethod?: string }) => {
      const res = await api.post(`/invoice/${id}/mark-paid`, { paymentMethod });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useVoidInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/invoice/${id}/void`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function usePaymentLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/invoice/${id}/pay`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useSendReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/invoice/${id}/send-reminder`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
