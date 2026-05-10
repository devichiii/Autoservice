import { AppRole } from "../decorators/roles.decorator";

const rolePriority: Record<AppRole, number> = {
  [AppRole.CLIENT]: 10,
  [AppRole.MANAGER]: 20,
  [AppRole.ADMIN]: 30,
  [AppRole.SUPER_ADMIN]: 40
};

export function hasRequiredRole(userRoles: AppRole[], requiredRole: AppRole): boolean {
  return userRoles.some((role) => rolePriority[role] >= rolePriority[requiredRole]);
}
