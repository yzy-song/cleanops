import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  pricingModel: string;
  basePrice: number;
  durationMin: number;
  category?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get("/services");
      return res.data as ServiceItem[];
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ServiceItem>) => {
      const res = await api.post("/services", data);
      return res.data as ServiceItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ServiceItem> & { id: string }) => {
      const res = await api.patch(`/services/${id}`, data);
      return res.data as ServiceItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/services/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}
