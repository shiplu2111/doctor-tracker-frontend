export declare const PERMISSIONS: {
    readonly DASHBOARD_READ: "dashboard:read";
    readonly DOCTOR_READ: "doctor:read";
    readonly DOCTOR_CREATE: "doctor:create";
    readonly DOCTOR_UPDATE: "doctor:update";
    readonly DOCTOR_DELETE: "doctor:delete";
    readonly PATIENT_READ: "patient:read";
    readonly PATIENT_CREATE: "patient:create";
    readonly PATIENT_UPDATE: "patient:update";
    readonly PATIENT_DELETE: "patient:delete";
    readonly SEARCH_READ: "search:read";
    readonly NOTIFICATION_READ: "notification:read";
    readonly USER_READ: "user:read";
    readonly USER_MANAGE: "user:manage";
    readonly AUDIT_READ: "audit:read";
};
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | '*';
//# sourceMappingURL=permissions.d.ts.map