'use client';

import React from 'react';
import { Permission } from '@doctor-tracker/shared';
import { useCan } from '@/hooks/useCan';

interface CanProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const allowed = useCan(permission);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
