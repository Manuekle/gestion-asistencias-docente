import { z } from 'zod';

export const DocenteMatriculaEstudianteSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  correoInstitucional: z.string().nullable().optional(),
  correoPersonal: z.string().nullable().optional(),
  document: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
});

export const DocenteMatriculaEstudianteArraySchema = z.array(DocenteMatriculaEstudianteSchema);
