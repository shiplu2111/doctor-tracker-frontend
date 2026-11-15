"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePatientSchema = exports.createPatientSchema = void 0;
const zod_1 = require("zod");
exports.createPatientSchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: 'Patient name is required' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters'),
    age: zod_1.z
        .coerce
        .number({ required_error: 'Age is required' })
        .int('Age must be an integer')
        .min(0, 'Age must be 0 or greater')
        .max(130, 'Age must not exceed 130'),
    gender: zod_1.z.enum(['male', 'female', 'other'], {
        required_error: 'Gender is required',
    }),
    phone: zod_1.z.string().trim().optional().or(zod_1.z.literal('')),
    email: zod_1.z.string().trim().email('Invalid email address').optional().or(zod_1.z.literal('')),
    condition: zod_1.z
        .string({ required_error: 'Condition is required' })
        .trim()
        .min(2, 'Condition must be at least 2 characters')
        .max(100, 'Condition must not exceed 100 characters'),
    status: zod_1.z
        .enum(['active', 'recovered', 'critical', 'discharged'])
        .default('active')
        .optional(),
    notes: zod_1.z.string().trim().max(1000, 'Notes must not exceed 1000 characters').optional().or(zod_1.z.literal('')),
    doctorId: zod_1.z.string().optional(),
});
exports.updatePatientSchema = exports.createPatientSchema.partial();
//# sourceMappingURL=patient.schema.js.map