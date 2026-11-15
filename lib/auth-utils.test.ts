import { describe, it, expect } from 'vitest';
import { hasPermission } from './auth-utils';
import { AuthenticatedUser } from '@doctor-tracker/shared';

describe('auth-utils hasPermission', () => {
  it('returns false when user is null', () => {
    expect(hasPermission(null, 'doctor:create')).toBe(false);
  });

  it('returns true when user is super_admin', () => {
    const user: AuthenticatedUser = {
      id: '1',
      name: 'Super',
      email: 's@test.com',
      role: 'super_admin',
      permissions: [],
    };
    expect(hasPermission(user, 'doctor:delete')).toBe(true);
  });

  it('returns true when user has specific permission', () => {
    const user: AuthenticatedUser = {
      id: '2',
      name: 'Admin',
      email: 'a@test.com',
      role: 'admin',
      permissions: ['doctor:read', 'doctor:create'],
    };
    expect(hasPermission(user, 'doctor:create')).toBe(true);
    expect(hasPermission(user, 'doctor:delete')).toBe(false);
  });

  it('returns true when user permissions include wildcard *', () => {
    const user: AuthenticatedUser = {
      id: '3',
      name: 'Wildcard',
      email: 'w@test.com',
      role: 'admin',
      permissions: ['*'],
    };
    expect(hasPermission(user, 'any:action')).toBe(true);
  });
});
