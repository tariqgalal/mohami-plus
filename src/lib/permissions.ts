import { ForbiddenError, getCurrentUser } from "@/lib/tenant";
import {
  assertRolePermission,
  hasPermission,
  PermissionDeniedError,
  type Permission,
} from "@/lib/permissions-core";

export { assertRolePermission, hasPermission, type Permission } from "@/lib/permissions-core";

/** Checks RBAC at a server boundary while tenant filtering remains in services. */
export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();
  try {
    assertRolePermission(user.role, permission);
  } catch (error) {
    if (error instanceof PermissionDeniedError) throw new ForbiddenError(error.message);
    throw error;
  }
  return user;
}
