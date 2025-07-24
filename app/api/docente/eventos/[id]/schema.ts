import { z } from 'zod';

export const EventTypeEnum = z.enum(['EXAM', 'HOMEWORK', 'DEADLINE', 'ANNOUNCEMENT', 'INFO']);

export const DocenteEventoDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  date: z.coerce.date(),
  type: EventTypeEnum,
  subjectId: z.string(),
  createdById: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const DocenteEventoUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  date: z.coerce.date().optional(),
  type: EventTypeEnum.optional(),
});
