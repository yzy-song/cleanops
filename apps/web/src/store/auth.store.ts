import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserInfo {
  sub: string;
  email: string;
  role: string;
  companyId: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  setToken: (token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

function decodeJWT(token: string): UserInfo | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
    };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token) => {
        const user = decodeJWT(token);
        localStorage.setItem("auth_token", token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem("auth_token");
        set({ token: null, user: null });
      },
      isAuthenticated: () => {
        const state = get();
        if (!state.token || !state.user) return false;
        // Check token expiry
        try {
          const payload = JSON.parse(atob(state.token.split(".")[1]));
          if (payload.exp * 1000 < Date.now()) {
            state.logout();
            return false;
          }
        } catch {
          return false;
        }
        return true;
      },
    }),
    { name: "cleanops-auth" }
  )
);
