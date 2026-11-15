export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  VIEWER: 'viewer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  super_admin: ['*'],
  admin: [
    'dashboard:read',
    'doctor:read',
    'doctor:create',
    'doctor:update',
    'doctor:delete',
    'patient:read',
    'patient:create',
    'patient:update',
    'patient:delete',
    'search:read',
    'notification:read',
  ],
  viewer: [
    'dashboard:read',
    'doctor:read',
    'patient:read',
    'search:read',
    'notification:read',
  ],
} as const;
