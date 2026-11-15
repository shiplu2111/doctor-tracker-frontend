"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.ROLES = void 0;
exports.ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    VIEWER: 'viewer',
};
exports.ROLE_PERMISSIONS = {
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
};
//# sourceMappingURL=roles.js.map