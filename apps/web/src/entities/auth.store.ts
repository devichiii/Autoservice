import { defineStore } from "pinia";
import { apiClient } from "../shared/api-client";
import { clearTokens, getAccessToken, getRefreshToken, setTokenPair } from "../shared/token-storage";
import type { AuthUser, LoginRequest, TokenPair } from "./auth.types";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    user: null
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken && state.user)
  },
  actions: {
    async hydrate() {
      this.accessToken = getAccessToken();
      this.refreshToken = getRefreshToken();

      if (!this.accessToken) {
        this.user = null;
        return;
      }

      try {
        await this.me();
      } catch {
        this.clearSession();
      }
    },

    async login(payload: LoginRequest) {
      const response = await apiClient.post<TokenPair>("/auth/login", payload);
      this.accessToken = response.data.accessToken;
      this.refreshToken = response.data.refreshToken;
      setTokenPair(response.data.accessToken, response.data.refreshToken);
      await this.me();
    },

    async me() {
      const response = await apiClient.get<{ user: AuthUser }>("/auth/me");
      this.user = response.data.user;
      return this.user;
    },

    async logout() {
      try {
        if (this.refreshToken) {
          await apiClient.post("/auth/logout", { refreshToken: this.refreshToken });
        }
      } finally {
        this.clearSession();
      }
    },

    clearSession() {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      clearTokens();
    }
  }
});
