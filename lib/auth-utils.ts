import { AuthenticatedUser } from '@doctor-tracker/shared';

export function hasPermission(user: AuthenticatedUser | null, permission: string): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return user.permissions.includes(permission) || user.permissions.includes('*');
}
