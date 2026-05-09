"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CustomerAuthState {
  token: string | null;
  customerId: string | null;
  name: string | null;
  email: string | null;
  setAuth: (data: { token: string; customerId: string; name: string; email: string }) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      customerId: null,
      name: null,
      email: null,
      setAuth: (data) => set({ token: data.token, customerId: data.customerId, name: data.name, email: data.email }),
      logout: () => set({ token: null, customerId: null, name: null, email: null }),
      isAuthenticated: () => !!get().token,
    }),
    { name: "cleanops-customer-auth" },
  ),
);
