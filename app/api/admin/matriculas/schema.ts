import { z } from 'zod';

export const StudentWithStatusSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  correoInstitucional: z.string().email(),
  isEnrolled: z.boolean(),
});

export type StudentWithStatus = z.infer<typeof StudentWithStatusSchema>;

export const MatriculaQuerySchema = z.object({
  subjectId: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type MatriculaQuery = z.infer<typeof MatriculaQuerySchema>;

export const MatriculaUpdateSchema = z.object({
  subjectId: z.string().min(1),
  studentIds: z.array(z.string()),
});

export type MatriculaUpdate = z.infer<typeof MatriculaUpdateSchema>;
