import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService, type AuthResponse, type AuthUser } from "./auth.service";
import type { LoginSchema, RegisterSchema } from "./auth.schema";
import useStore from "~/store/useStore";

/**
 * Auth store
 *
 * Menyimpan informasi user yang sedang login dan token auth.
 * Token juga disimpan di localStorage (`accessToken`) untuk dipakai axiosInstance.
 */

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  login: (payload: LoginSchema) => Promise<void>;
  register: (payload: RegisterSchema) => Promise<void>;
  logout: () => void;
  setAuth: (data: AuthResponse) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,

      async login(payload) {
        const data = await authService.login(payload);

        localStorage.setItem("accessToken", data.token);
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        });
      },

      async register(payload) {
        // Hanya membuat akun di Backendless, tidak langsung login.
        await authService.register(payload);
      },

      logout() {
        localStorage.removeItem("accessToken");

        // Reset global store state using the imported store
        useStore.getState().resetStore();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setAuth(data) {
        localStorage.setItem("accessToken", data.token);
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        });
      },

      setHasHydrated(state) {
        set({
          hasHydrated: state,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
