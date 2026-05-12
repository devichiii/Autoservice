import type { AppRole } from "./auth.types";

export type UserRoleView = {
  code: AppRole;
  title?: string;
};

export type UserItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  roles: UserRoleView[];
};

export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
};
