import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export interface Company {
  id: string;
  name: string;
  vatNumber: string | null;
  baseHourlyRate: number;
  pensionEnrollment: boolean;
  stripeSecretKey?: string | null;
  _count?: { users: number; workers: number; customers: number; jobs: number };
}

export interface StripeStatus {
  connected: boolean;
  mode: 'live' | 'test' | 'disconnected';
}

export function useCompany() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["company", user?.companyId],
    queryFn: async () => {
      const res = await api.get(`/company/${user?.companyId}`);
      return res.data.data as Company;
    },
    enabled: !!user?.companyId,
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (data: {
      name?: string;
      vatNumber?: string;
      baseHourlyRate?: number;
      pensionEnrollment?: boolean;
    }) => {
      const res = await api.patch(`/company/${user?.companyId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company"] });
    },
  });
}

export function useStripeStatus() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["company", "stripe", "status"],
    queryFn: async () => {
      const res = await api.get("/company/stripe/status");
      return res.data.data as StripeStatus;
    },
    enabled: !!user?.companyId,
  });
}

export function useSaveStripeKey() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (secretKey: string) => {
      const res = await api.post("/company/stripe/key", { secretKey });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", "stripe"] });
    },
  });
}

export function useDisconnectStripe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/company/stripe/disconnect");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", "stripe"] });
    },
  });
}

export interface XeroConnectionStatus {
  connected: boolean;
  tenantId: string | null;
  tenantName: string | null;
  connectedAt: string | null;
  tokenExpiresAt: string | null;
}

export function useConnectXeroUrl() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["company", "xero", "connect-url"],
    queryFn: async () => {
      const res = await api.get("/xero/connect");
      return res.data.data as { url: string };
    },
    enabled: false,
  });
}

export function useXeroConnectionStatus() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["company", "xero", "status"],
    queryFn: async () => {
      const res = await api.get("/xero/status");
      return res.data.data as XeroConnectionStatus;
    },
    enabled: !!user?.companyId,
  });
}

export function useDisconnectXero() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/xero/disconnect");
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", "xero"] });
    },
  });
}
