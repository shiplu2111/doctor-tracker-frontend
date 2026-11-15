# Shared Contracts & Constants

This package/directory contains shared TypeScript types, constants, and Zod schemas shared between `client/` (Next.js) and `server/` (Express API) to ensure zero drift across boundaries.

---

## 1. Directory Structure

```
shared/
├── src/
│   ├── constants/
│   │   ├── permissions.ts    # Permission catalog & role definitions
│   │   └── roles.ts          # Supported system roles (super_admin, admin, viewer)
│   ├── schemas/
│   │   ├── doctor.schema.ts  # Zod validation schema for doctor creation & update
│   │   ├── patient.schema.ts # Zod validation schema for patient creation & update
│   │   └── auth.schema.ts    # Zod validation schema for login & credentials
│   └── types/
│       ├── api.types.ts      # Envelope, pagination, and error contracts
│       ├── doctor.types.ts   # Doctor DTOs & status enums
│       └── patient.types.ts  # Patient DTOs & condition types
├── package.json (optional)
└── README.md
```

---

## 2. Core Constants

### Permissions
Permissions are fine-grained capabilities formatted as `resource:action`:
- `dashboard:read`
- `doctor:read`, `doctor:create`, `doctor:update`, `doctor:delete`
- `patient:read`, `patient:create`, `patient:update`, `patient:delete`
- `search:read`
- `notification:read`
- `user:read`, `user:manage`

### Role-Permission Matrix
```ts
export const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  admin: [
    'dashboard:read',
    'doctor:read', 'doctor:create', 'doctor:update', 'doctor:delete',
    'patient:read', 'patient:create', 'patient:update', 'patient:delete',
    'search:read', 'notification:read',
  ],
  viewer: [
    'dashboard:read', 'doctor:read', 'patient:read', 'search:read', 'notification:read'
  ],
} as const;
```

---

## 3. Usage Rules

1. **Server Authority:** The server remains authoritative for all permission validations. Client-side checks (e.g. `<Can>` components) are strictly for UX optimization (hiding/disabling buttons).
2. **Strict Validation:** Validation schemas defined here are used on the frontend for client form validation (`react-hook-form` + `zodResolver`) and on the backend middleware to validate incoming HTTP payloads.
3. **No Drift:** Whenever a field or permission is added or modified, update it here so both client and server benefit from type checks.
