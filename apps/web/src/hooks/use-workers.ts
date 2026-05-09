import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Worker {
  id: string;
  userId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  ppsn: string | null;
  hourlyRate: number | null;
  isActive: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function useWorkers() {
  return useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const res = await api.get("/worker");
      return res.data.data as Worker[];
    },
  });
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: ["workers", id],
    queryFn: async () => {
      const res = await api.get(`/worker/${id}`);
      return res.data.data as Worker;
    },
    enabled: !!id,
  });
}

export function useCreateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      ppsn?: string;
      hourlyRate?: number;
    }) => {
      const res = await api.post("/worker", data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}

export function useUpdateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      ppsn?: string;
      hourlyRate?: number;
    }) => {
      const res = await api.patch(`/worker/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}

export function useDeleteWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/worker/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}
