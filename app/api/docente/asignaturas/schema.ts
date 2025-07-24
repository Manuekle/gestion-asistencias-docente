import { z } from 'zod';

export const DocenteSubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  program: z.string().nullable().optional(),
  semester: z.coerce.number().nullable().optional(),
  credits: z.coerce.number().nullable().optional(),
  teacherId: z.string(),
});

export type DocenteSubject = z.infer<typeof DocenteSubjectSchema>;

export const DocenteSubjectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['createdAt', 'name', 'code']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type DocenteSubjectQuery = z.infer<typeof DocenteSubjectQuerySchema>;

export const DocenteSubjectCreateSchema = DocenteSubjectSchema.omit({
  id: true,
  teacherId: true,
});
export const DocenteSubjectUpdateSchema = DocenteSubjectSchema.omit({
  teacherId: true,
});
