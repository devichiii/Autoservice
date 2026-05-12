export type AppRole = "CLIENT" | "MANAGER" | "ADMIN" | "SUPER_ADMIN";

export type AuthUser = {
  sub: string;
  email: string;
  roles: AppRole[];
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};
