import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z
    .string({ required_error: 'Patient name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  age: z
    .coerce
    .number({ required_error: 'Age is required' })
    .int('Age must be an integer')
    .min(0, 'Age must be 0 or greater')
    .max(130, 'Age must not exceed 130'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Gender is required',
  }),
  phone: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  condition: z
    .string({ required_error: 'Condition is required' })
    .trim()
    .min(2, 'Condition must be at least 2 characters')
    .max(100, 'Condition must not exceed 100 characters'),
  status: z
    .enum(['active', 'recovered', 'critical', 'discharged'])
    .default('active')
    .optional(),
  notes: z.string().trim().max(1000, 'Notes must not exceed 1000 characters').optional().or(z.literal('')),
  doctorId: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

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
