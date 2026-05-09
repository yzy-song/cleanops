import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken);

  return useMutation({
    mutationFn: async (data: { email: string; pass: string }) => {
      const res = await api.post("/auth/login", data);
      return res.data.data as { access_token: string };
    },
    onSuccess: (data) => {
      setToken(data.access_token);
    },
  });
}

export function useRegister() {
  const setToken = useAuthStore((s) => s.setToken);

  return useMutation({
    mutationFn: async (data: {
      name: string;
      vatNumber: string;
      adminEmail: string;
      adminPass: string;
    }) => {
      // Register creates company + admin user, then login to get token
      await api.post("/company", data);
      const res = await api.post("/auth/login", {
        email: data.adminEmail,
        pass: data.adminPass,
      });
      return res.data.data as { access_token: string };
    },
    onSuccess: (data) => {
      setToken(data.access_token);
    },
  });
}
