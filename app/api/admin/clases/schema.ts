import { z } from 'zod';

export const ClassSchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  subjectId: z.string(),
  subject: z.object({
    name: z.string(),
    code: z.string(),
  }),
});

export type Class = z.infer<typeof ClassSchema>;

export const ClassQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['date']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ClassQuery = z.infer<typeof ClassQuerySchema>;
