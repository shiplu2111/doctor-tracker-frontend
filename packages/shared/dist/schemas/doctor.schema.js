"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkImportDoctorsSchema = exports.updateDoctorSchema = exports.createDoctorSchema = exports.phoneRegex = void 0;
const zod_1 = require("zod");
exports.phoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
exports.createDoctorSchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: 'Doctor name is required' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters'),
    specialization: zod_1.z
        .string({ required_error: 'Specialization is required' })
        .trim()
        .min(2, 'Specialization must be at least 2 characters')
        .max(80, 'Specialization must not exceed 80 characters'),
    hospital: zod_1.z
        .string({ required_error: 'Hospital is required' })
        .trim()
        .min(2, 'Hospital must be at least 2 characters')
        .max(120, 'Hospital must not exceed 120 characters'),
    phone: zod_1.z
        .string({ required_error: 'Phone number is required' })
        .trim()
        .regex(exports.phoneRegex, 'Enter a valid Bangladeshi phone number (+8801XXXXXXXXX or 01XXXXXXXXX)'),
    email: zod_1.z
        .string({ required_error: 'Email is required' })
        .trim()
        .toLowerCase()
        .email('Invalid email address'),
    status: zod_1.z.enum(['active', 'inactive']).default('active').optional(),
});
exports.updateDoctorSchema = exports.createDoctorSchema.partial();
exports.bulkImportDoctorsSchema = zod_1.z.object({
    doctors: zod_1.z.array(zod_1.z.record(zod_1.z.string(), zod_1.z.any())).min(1, 'At least 1 doctor row is required').max(500, 'Maximum 500 rows allowed per import'),
});
//# sourceMappingURL=doctor.schema.js.map