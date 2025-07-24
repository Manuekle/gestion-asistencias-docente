import { PrismaClient as PrismaClientType, UnenrollRequestStatus } from '@prisma/client';

type UnenrollRequestCreateArgs = {
  data: {
    student: { connect: { id: string } };
    subject: { connect: { id: string } };
    reason: string;
    requestedBy: { connect: { id: string } };
    status: UnenrollRequestStatus;
  };
  include: {
    student: { select: { name: true; correoInstitucional: true } };
    requestedBy: { select: { name: true } };
  };
};

type UnenrollRequestResult = {
  id: string;
  student: { name: string | null; correoInstitucional: string | null };
  requestedBy: { name: string | null };
  status: UnenrollRequestStatus;
  reason: string;
  createdAt: Date;
};

declare global {
  // Extender el cliente de Prisma para incluir el modelo unenrollRequest
  interface PrismaClient extends PrismaClientType {
    unenrollRequest: {
      create: (args: UnenrollRequestCreateArgs) => Promise<UnenrollRequestResult>;
    };
  }
}

export {};
