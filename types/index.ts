export const ROLES = ['ADMIN', 'DOCENTE', 'ESTUDIANTE', 'COORDINADOR'] as const;
export type Role = (typeof ROLES)[number];

export type User = {
  id: string;
  name: string | null;
  correoInstitucional: string | null;
  correoPersonal?: string | null;
  role: Role;
  isActive: boolean;
  signatureUrl?: string | null;
  document?: string | null;
  codigoDocente?: string | null;
  codigoEstudiantil?: string | null;
  telefono?: string | null;
};

// API Response Types
export type ApiResponse<T = unknown> = {
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

// Error type for API calls
export type ApiError = Error & {
  status?: number;
  data?: unknown;
  errors?: Record<string, string[]>;
};

// Type for error handling in catch blocks
export type ErrorWithMessage = Error & {
  message: string;
  status?: number;
};

// Type guard for error with message
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Helper function to get error message from unknown error
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return 'Ocurrió un error inesperado';
}

export type EventType = 'EXAMEN' | 'TRABAJO' | 'LIMITE' | 'ANUNCIO' | 'INFO';

export interface SubjectEvent {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  type: EventType;
  subjectId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
