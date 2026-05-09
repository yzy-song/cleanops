import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  isCommercial: boolean;
  eircode: string | null;
  accessCode: string | null;
  jobs?: { id: string; status: string; scheduledStart: string }[];
}

export interface CustomerCreditRisk {
  id: string;
  name: string;
  address: string;
  eircode: string | null;
  isCommercial: boolean;
  totalUnpaid: number;
  unpaidCount: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface CreditSummary {
  customerId: string;
  totalUnpaid: number;
  unpaidCount: number;
  overdueCount: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  invoices: { id: string; amount: number; dueDate: string; jobDate: string }[];
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await api.get("/customer");
      return res.data.data as Customer[];
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: async () => {
      const res = await api.get(`/customer/${id}`);
      return res.data.data as Customer;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      address: string;
      lat: number;
      lng: number;
      isCommercial?: boolean;
      eircode?: string;
      accessCode?: string;
    }) => {
      const res = await api.post("/customer", data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      name?: string;
      address?: string;
      lat?: number;
      lng?: number;
      isCommercial?: boolean;
      eircode?: string;
      accessCode?: string;
    }) => {
      const res = await api.patch(`/customer/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customer/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useCreditSummary(id: string) {
  return useQuery({
    queryKey: ["customers", id, "credit-summary"],
    queryFn: async () => {
      const res = await api.get(`/customer/${id}/credit-summary`);
      return res.data.data as CreditSummary;
    },
    enabled: !!id,
  });
}

export function useCustomersCreditRisk() {
  return useQuery({
    queryKey: ["customers", "credit-risk"],
    queryFn: async () => {
      const res = await api.get("/customer/list/credit-risk");
      return res.data.data as CustomerCreditRisk[];
    },
  });
}
