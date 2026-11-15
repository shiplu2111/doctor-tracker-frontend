export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard:read',
  DOCTOR_READ: 'doctor:read',
  DOCTOR_CREATE: 'doctor:create',
  DOCTOR_UPDATE: 'doctor:update',
  DOCTOR_DELETE: 'doctor:delete',
  PATIENT_READ: 'patient:read',
  PATIENT_CREATE: 'patient:create',
  PATIENT_UPDATE: 'patient:update',
  PATIENT_DELETE: 'patient:delete',
  SEARCH_READ: 'search:read',
  NOTIFICATION_READ: 'notification:read',
  USER_READ: 'user:read',
  USER_MANAGE: 'user:manage',
  AUDIT_READ: 'audit:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | '*';
