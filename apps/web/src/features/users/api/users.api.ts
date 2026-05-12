import { apiClient } from "../../../shared/api-client";
import type { AppRole } from "../../../entities/auth.types";
import type { UpdateUserPayload, UserItem } from "../../../entities/users.types";

type RawUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  roles?: Array<
    | { code?: AppRole; title?: string }
    | { role?: { code?: AppRole; title?: string } }
    | AppRole
  >;
};

function normalizeRoles(raw: RawUser["roles"]): UserItem["roles"] {
  if (!raw) {
    return [];
  }

  return raw
    .map((entry) => {
      if (typeof entry === "string") {
        return { code: entry as AppRole };
      }
      if ("role" in entry && entry.role?.code) {
        return { code: entry.role.code, title: entry.role.title };
      }
      if ("code" in entry && entry.code) {
        return { code: entry.code, title: entry.title };
      }
      return null;
    })
    .filter((role): role is { code: AppRole; title?: string } => role !== null);
}

function normalizeUser(user: RawUser): UserItem {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    roles: normalizeRoles(user.roles)
  };
}

export async function fetchUsersApi() {
  const response = await apiClient.get<RawUser[]>("/users");
  return response.data.map(normalizeUser);
}

export async function updateUserApi(userId: string, payload: UpdateUserPayload) {
  await apiClient.patch(`/users/${userId}`, payload);
}

export async function addRoleApi(userId: string, roleCode: AppRole) {
  await apiClient.post(`/users/${userId}/roles`, { roleCode });
}

export async function removeRoleApi(userId: string, roleCode: AppRole) {
  await apiClient.delete(`/users/${userId}/roles/${roleCode}`);
}
