import { z } from 'zod';

export const ScanAttendanceRequestSchema = z.object({
  qrToken: z.string().min(32).max(64),
});

export const AttendanceStatusEnum = z.enum(['PRESENTE', 'AUSENTE', 'TARDANZA', 'JUSTIFICADO']);

export const ScanAttendanceResponseSchema = z.object({
  id: z.string(),
  status: AttendanceStatusEnum,
  recordedAt: z.coerce.date(),
  subject: z.string(),
  class: z.string(),
});
