import { Permission, ROLE_PERMISSIONS, Role } from '@doctor-tracker/shared';
import { useAuthStore } from '@/store/auth-store';

export function useCan(permission: Permission): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;

  if (user.role === 'super_admin') return true;

  if (Array.isArray(user.permissions)) {
    if (user.permissions.includes('*') || user.permissions.includes(permission)) {
      return true;
    }
  }

  const role = user.role as Role;
  const rolePermissions = ROLE_PERMISSIONS[role];
  if (rolePermissions) {
    if (rolePermissions.includes('*') || rolePermissions.includes(permission)) {
      return true;
    }
  }

  return false;
}
