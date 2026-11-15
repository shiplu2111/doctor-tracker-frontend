import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Can } from './Can';
import { useAuthStore } from '@/store/auth-store';

describe('Can Component (RBAC Guard)', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: false });
  });

  it('renders nothing / fallback when user is not authenticated', () => {
    render(
      <Can permission="doctor:create" fallback={<div>Access Denied</div>}>
        <button>Create Doctor</button>
      </Can>
    );

    expect(screen.queryByText('Create Doctor')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders children when user role has permission (admin)', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['doctor:create', 'doctor:read'],
      },
      isLoading: false,
    });

    render(
      <Can permission="doctor:create">
        <button>Create Doctor</button>
      </Can>
    );

    expect(screen.getByText('Create Doctor')).toBeInTheDocument();
  });

  it('hides children when viewer lacks permission', () => {
    useAuthStore.setState({
      user: {
        id: 'u2',
        name: 'Viewer User',
        email: 'viewer@example.com',
        role: 'viewer',
        permissions: ['doctor:read', 'patient:read'],
      },
      isLoading: false,
    });

    render(
      <Can permission="doctor:create">
        <button>Create Doctor</button>
      </Can>
    );

    expect(screen.queryByText('Create Doctor')).not.toBeInTheDocument();
  });

  it('super_admin role is granted access to all permissions', () => {
    useAuthStore.setState({
      user: {
        id: 'u3',
        name: 'Super Admin',
        email: 'super@example.com',
        role: 'super_admin',
        permissions: ['*'],
      },
      isLoading: false,
    });

    render(
      <Can permission="doctor:delete">
        <button>Delete Doctor</button>
      </Can>
    );

    expect(screen.getByText('Delete Doctor')).toBeInTheDocument();
  });
});
