import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SubscriptionStatus {
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "NONE";
  plan?: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
}

export function useSubscription() {
  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: async () => {
      const res = await api.get("/billing/subscription");
      return res.data as SubscriptionStatus;
    },
  });
}

export function useCreateCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { plan: string; interval?: "month" | "year" }) => {
      const res = await api.post("/billing/checkout", data);
      return res.data as { url: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}

export function useCreatePortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/billing/portal");
      return res.data as { url: string };
    },
  });
}
