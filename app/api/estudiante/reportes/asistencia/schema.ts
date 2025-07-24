import { z } from 'zod';

export const AsistenciaResumenSchema = z.object({
  totalClasses: z.number(),
  presentCount: z.number(),
  absentCount: z.number(),
  lateCount: z.number(),
  justifiedCount: z.number(),
  attendancePercentage: z.number(),
});

export const AsistenciaPorClaseSchema = z.object({
  classId: z.string(),
  classDate: z.coerce.date(),
  classTopic: z.string().nullable(),
  status: z.string(),
});

export const AsistenciaPorMateriaSchema = z.object({
  subjectId: z.string(),
  subjectName: z.string(),
  subjectCode: z.string(),
  attendances: z.array(AsistenciaPorClaseSchema),
  summary: AsistenciaResumenSchema,
});

export const ReporteAsistenciaResponseSchema = z.object({
  summary: AsistenciaResumenSchema,
  bySubject: z.array(AsistenciaPorMateriaSchema),
});
