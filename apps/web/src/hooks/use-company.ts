import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export interface Company {
  id: string;
  name: string;
  vatNumber: string | null;
  baseHourlyRate: number;
  pensionEnrollment: boolean;
  stripeAccountId?: string | null;
  stripeAccountStatus?: string | null;
  stripeAccountEmail?: string | null;
  _count?: { users: number; workers: number; customers: number; jobs: number };
}

export interface StripeConnectStatus {
  connected: boolean;
  accountId: string | null;
  email: string | null;
  status: string;
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

export function useConnectStripeUrl() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["company", "stripe", "connect-url"],
    queryFn: async () => {
      const res = await api.get("/company/stripe/connect");
      return res.data.data as { url: string };
    },
    enabled: false, // only fetch on demand
  });
}

export function useStripeConnectStatus() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["company", "stripe", "status"],
    queryFn: async () => {
      const res = await api.get("/company/stripe/status");
      return res.data.data as StripeConnectStatus;
    },
    enabled: !!user?.companyId,
  });
}
