
import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), {
    message: 'URL must use HTTP or HTTPS',
  });

const optionalNullableHttpUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  optionalUrl.nullable().optional(),
);

export const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1),
  url: optionalUrl.nullable().optional(),
  githubUrl: optionalNullableHttpUrl,
  dockerUrl: optionalNullableHttpUrl,
  technologies: z.array(z.string().trim().min(1)).optional(),
  images: z.array(optionalUrl).optional(),
});

export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateProjectRequest = z.infer<
  typeof createProjectSchema
>;

export type UpdateProjectRequest = z.infer<
  typeof updateProjectSchema
>;
