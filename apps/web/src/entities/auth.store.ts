import { defineStore } from "pinia";

export type Role = "CLIENT" | "MANAGER" | "ADMIN" | "SUPER_ADMIN";

type AuthState = {
  accessToken: string | null;
  role: Role | null;
};

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    accessToken: null,
    role: null
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken)
  },
  actions: {
    setSession(token: string, role: Role) {
      this.accessToken = token;
      this.role = role;
    },
    clearSession() {
      this.accessToken = null;
      this.role = null;
    }
  }
});
