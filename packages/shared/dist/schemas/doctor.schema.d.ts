import { z } from 'zod';
export declare const phoneRegex: RegExp;
export declare const createDoctorSchema: z.ZodObject<{
    name: z.ZodString;
    specialization: z.ZodString;
    hospital: z.ZodString;
    phone: z.ZodString;
    email: z.ZodString;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["active", "inactive"]>>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
    email: string;
    status?: "active" | "inactive" | undefined;
}, {
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
    email: string;
    status?: "active" | "inactive" | undefined;
}>;
export declare const updateDoctorSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    specialization: z.ZodOptional<z.ZodString>;
    hospital: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<["active", "inactive"]>>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    specialization?: string | undefined;
    hospital?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    status?: "active" | "inactive" | undefined;
}, {
    name?: string | undefined;
    specialization?: string | undefined;
    hospital?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    status?: "active" | "inactive" | undefined;
}>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export declare const bulkImportDoctorsSchema: z.ZodObject<{
    doctors: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">;
}, "strip", z.ZodTypeAny, {
    doctors: Record<string, any>[];
}, {
    doctors: Record<string, any>[];
}>;
export type BulkImportDoctorsInput = z.infer<typeof bulkImportDoctorsSchema>;
export interface DoctorImportRow {
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
    email: string;
    status?: 'active' | 'inactive';
}
export interface DoctorImportSummary {
    totalRows: number;
    imported: number;
    skipped: number;
    errors: Array<{
        row: number;
        email?: string;
        message: string;
    }>;
}
export interface Doctor {
    id: string;
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
    email: string;
    status: 'active' | 'inactive';
    patientCount: number;
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=doctor.schema.d.ts.map