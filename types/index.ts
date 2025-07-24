export const ROLES = ['ADMIN', 'DOCENTE', 'ESTUDIANTE', 'USER'] as const;
export type Role = (typeof ROLES)[number];

export type User = {
  id: string;
  name: string | null;
  correoInstitucional: string | null;
  correoPersonal?: string | null;
  role: Role;
  isActive: boolean;
  signatureUrl?: string | null;
};
