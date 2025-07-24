import { z } from 'zod';

export const AttendanceStatusEnum = z.enum(['PRESENTE', 'AUSENTE', 'TARDANZA', 'JUSTIFICADO']);

export const AttendanceSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  classId: z.string(),
  status: AttendanceStatusEnum,
  justification: z.string().nullable(),
  recordedAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  student: z.object({
    id: z.string(),
    name: z.string().nullable(),
    correoInstitucional: z.string().email(),
  }),
  class: z.object({
    id: z.string(),
    date: z.string().datetime(),
    topic: z.string().nullable(),
    subject: z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
    }),
  }),
  recordedBy: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
    })
    .nullable(),
  logs: z
    .array(
      z.object({
        id: z.string(),
        oldStatus: AttendanceStatusEnum.optional(),
        newStatus: AttendanceStatusEnum.optional(),
        reason: z.string().nullable(),
        createdAt: z.string().datetime(),
        changedBy: z
          .object({
            id: z.string(),
            name: z.string().nullable(),
          })
          .nullable(),
      })
    )
    .optional(),
});

export type Attendance = z.infer<typeof AttendanceSchema>;

export const AttendanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['recordedAt', 'status', 'studentId', 'classId']).default('recordedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  classId: z.string().optional(),
  studentId: z.string().optional(),
});

export type AttendanceQuery = z.infer<typeof AttendanceQuerySchema>;
