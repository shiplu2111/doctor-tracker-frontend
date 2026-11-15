export declare const ROLES: {
    readonly SUPER_ADMIN: "super_admin";
    readonly ADMIN: "admin";
    readonly VIEWER: "viewer";
};
export type Role = (typeof ROLES)[keyof typeof ROLES];
export declare const ROLE_PERMISSIONS: Record<Role, readonly string[]>;
//# sourceMappingURL=roles.d.ts.map