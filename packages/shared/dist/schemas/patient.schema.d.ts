import { z } from 'zod';
export declare const createPatientSchema: z.ZodObject<{
    name: z.ZodString;
    age: z.ZodNumber;
    gender: z.ZodEnum<["male", "female", "other"]>;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    condition: z.ZodString;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["active", "recovered", "critical", "discharged"]>>>;
    notes: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    doctorId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    age: number;
    gender: "male" | "female" | "other";
    condition: string;
    phone?: string | undefined;
    email?: string | undefined;
    status?: "active" | "recovered" | "critical" | "discharged" | undefined;
    notes?: string | undefined;
    doctorId?: string | undefined;
}, {
    name: string;
    age: number;
    gender: "male" | "female" | "other";
    condition: string;
    phone?: string | undefined;
    email?: string | undefined;
    status?: "active" | "recovered" | "critical" | "discharged" | undefined;
    notes?: string | undefined;
    doctorId?: string | undefined;
}>;
export declare const updatePatientSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "other"]>>;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    condition: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<["active", "recovered", "critical", "discharged"]>>>>;
    notes: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    doctorId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    status?: "active" | "recovered" | "critical" | "discharged" | undefined;
    age?: number | undefined;
    gender?: "male" | "female" | "other" | undefined;
    condition?: string | undefined;
    notes?: string | undefined;
    doctorId?: string | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    status?: "active" | "recovered" | "critical" | "discharged" | undefined;
    age?: number | undefined;
    gender?: "male" | "female" | "other" | undefined;
    condition?: string | undefined;
    notes?: string | undefined;
    doctorId?: string | undefined;
}>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export interface Patient {
    id: string;
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    phone?: string;
    email?: string;
    condition: string;
    status: 'active' | 'recovered' | 'critical' | 'discharged';
    notes?: string;
    doctorId: string;
    doctor?: {
        id: string;
        name: string;
        specialization: string;
        hospital: string;
    };
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=patient.schema.d.ts.map