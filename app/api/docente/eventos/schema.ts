import { z } from 'zod';

export const DocenteEventosQuerySchema = z.object({
  subjectId: z
    .string({
      required_error: 'El ID de la asignatura es requerido.',
      invalid_type_error: 'El ID de la asignatura debe ser un texto.',
    })
    .min(1, 'El ID de la asignatura no puede estar vacío.'),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().default(10),
  sortBy: z.enum(['date', 'title']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
