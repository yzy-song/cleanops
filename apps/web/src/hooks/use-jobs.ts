import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Job {
  id: string;
  companyId: string;
  customerId: string;
  status: string;
  scheduledStart: string;
  estimatedDuration: number | null;
  notes: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  isRecurring: boolean;
  recurrenceRule: string | null;
  depositAmount: number | null;
  isDepositPaid: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; phone?: string; address: string; lat?: number; lng?: number; eircode?: string };
  invoice?: { id: string; amount: number; status: string; paymentLink?: string | null };
  assignments?: {
    id: string;
    jobId: string;
    workerId: string;
    worker?: { id: string; firstName: string; lastName: string; user?: { email: string } };
  }[];
}

export interface JobQuery {
  status?: string;
  customerId?: string;
  workerId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export function useJobs(query?: JobQuery) {
  return useQuery({
    queryKey: ["jobs", query],
    queryFn: async () => {
      const res = await api.get("/jobs", { params: query });
      return { data: res.data.data as Job[], meta: res.data.meta };
    },
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data.data as Job;
    },
    enabled: !!id,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      customerId: string;
      scheduledStart: string;
      estimatedDuration?: number;
      notes?: string;
      workerIds?: string[];
      isRecurring?: boolean;
      recurrenceRule?: string;
      depositAmount?: number;
    }) => {
      const res = await api.post("/jobs", data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      scheduledStart?: string;
      estimatedDuration?: number;
      notes?: string;
      workerIds?: string[];
    }) => {
      const res = await api.patch(`/jobs/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useCancelJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/jobs/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useAssignWorkers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workerIds }: { id: string; workerIds: string[] }) => {
      const res = await api.patch(`/jobs/${id}/assign`, { workerIds });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useUnassignWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workerId }: { id: string; workerId: string }) => {
      const res = await api.patch(`/jobs/${id}/unassign/${workerId}`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useSendInvoice() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/jobs/${id}/send-invoice`);
      return res.data.data;
    },
  });
}

export function useMarkDepositPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const res = await api.patch(`/jobs/${jobId}/mark-deposit-paid`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useGenerateDepositLink() {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const res = await api.post(`/jobs/${jobId}/deposit-link`);
      return res.data.data as {
        paymentLink: string;
        depositAmount: number;
        customerName: string;
        customerPhone: string;
      };
    },
  });
}
