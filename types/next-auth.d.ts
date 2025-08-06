import { Role } from '@prisma/client';
import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      correoPersonal?: string | null;
      correoInstitucional?: string | null;
      signatureUrl?: string | null;
      codigoDocente?: string | null;
      codigoEstudiantil?: string | null;
      telefono?: string | null;
      document?: string | null;
      isActive: boolean;
    } & DefaultSession['user'];
    accessToken?: string;
  }

  interface User {
    id: string;
    name: string | null;
    role: Role;
    correoPersonal?: string | null;
    correoInstitucional?: string | null;
    signatureUrl?: string | null;
    codigoDocente?: string | null;
    codigoEstudiantil?: string | null;
    telefono?: string | null;
    document?: string | null;
    isActive: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    correoPersonal?: string | null;
    correoInstitucional?: string | null;
    signatureUrl?: string | null;
    codigoDocente?: string | null;
    codigoEstudiantil?: string | null;
    telefono?: string | null;
    document?: string | null;
    isActive: boolean;
    accessToken?: string;
  }
}
