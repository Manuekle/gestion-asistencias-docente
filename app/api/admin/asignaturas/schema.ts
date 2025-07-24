import { z } from 'zod';

export const SubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  teacherId: z.string().nullable(),
  teacher: z.object({ name: z.string().nullable() }).nullable(),
});

export type Subject = z.infer<typeof SubjectSchema>;

export const SubjectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['name', 'code']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type SubjectQuery = z.infer<typeof SubjectQuerySchema>;
