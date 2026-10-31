"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
const optionalUrl = zod_1.z
    .string()
    .trim()
    .url()
    .refine((value) => /^https?:\/\//i.test(value), {
    message: 'URL must use HTTP or HTTPS',
});
exports.createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1).max(200),
    description: zod_1.z.string().trim().min(1),
    url: optionalUrl.nullable().optional(),
    technologies: zod_1.z.array(zod_1.z.string().trim().min(1)).optional(),
    images: zod_1.z.array(optionalUrl).optional(),
});
exports.updateProjectSchema = exports.createProjectSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
});
