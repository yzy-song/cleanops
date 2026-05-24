import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sortOrder: number;
}

export interface Quote {
  id: string;
  status: string;
  publicToken?: string | null;
  serviceType: string;
  propertySize: string;
  bathrooms: number | null;
  frequency: string;
  isCommercial: boolean;
  estimatedDuration: number;
  notes?: string | null;
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  depositRequired: boolean;
  depositAmount: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress: string;
  customerPostalCode?: string | null;
  customerAccessCode?: string | null;
  validUntil: string;
  sentAt?: string | null;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  declinedReason?: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems?: QuoteLineItem[];
  customer?: { id: string; name: string; email?: string | null } | null;
  job?: { id: string; status: string; scheduledStart: string } | null;
}

export function useQuotes(query?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["quotes", query],
    queryFn: async () => {
      const res = await api.get("/quote", { params: query });
      return { data: res.data.data as Quote[], meta: res.data.meta };
    },
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ["quotes", id],
    queryFn: async () => {
      const res = await api.get(`/quote/${id}`);
      return res.data.data as Quote;
    },
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post("/quote", data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await api.patch(`/quote/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useSendQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/quote/${id}/send`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useConvertQuoteToJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/quote/${id}/convert`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useDeclineQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await api.post(`/quote/${id}/decline`, { reason });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}
