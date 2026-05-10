import { AppRole } from "../../common/decorators/roles.decorator";

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AuthTokenPayload = {
  sub: string;
  email: string;
  roles: AppRole[];
  iat?: number;
  exp?: number;
};
