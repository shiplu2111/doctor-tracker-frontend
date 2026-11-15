import { z } from 'zod';

export const phoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;

export const createDoctorSchema = z.object({
  name: z
    .string({ required_error: 'Doctor name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  specialization: z
    .string({ required_error: 'Specialization is required' })
    .trim()
    .min(2, 'Specialization must be at least 2 characters')
    .max(80, 'Specialization must not exceed 80 characters'),
  hospital: z
    .string({ required_error: 'Hospital is required' })
    .trim()
    .min(2, 'Hospital must be at least 2 characters')
    .max(120, 'Hospital must not exceed 120 characters'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(phoneRegex, 'Enter a valid Bangladeshi phone number (+8801XXXXXXXXX or 01XXXXXXXXX)'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  status: z.enum(['active', 'inactive']).default('active').optional(),
});

export const updateDoctorSchema = createDoctorSchema.partial();

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;

export const bulkImportDoctorsSchema = z.object({
  doctors: z.array(z.record(z.string(), z.any())).min(1, 'At least 1 doctor row is required').max(500, 'Maximum 500 rows allowed per import'),
});

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
