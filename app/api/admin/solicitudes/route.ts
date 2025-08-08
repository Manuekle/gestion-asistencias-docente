import UnenrollStatusEmail from '@/app/emails/UnenrollStatusEmail';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/prisma';
import { UnenrollRequest, UnenrollRequestStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import * as React from 'react';

// Define the shape of the included relations
interface StudentInfo {
  id: string;
  name: string | null;
  correoInstitucional: string | null;
}

interface SubjectInfo {
  id: string;
  name: string;
}

interface RequesterInfo {
  name: string | null;
  correoInstitucional: string | null;
}

// Type for the unenroll request with all its relations
interface UnenrollRequestWithRelations extends UnenrollRequest {
  student: StudentInfo | null;
  subject: SubjectInfo | null;
  requestedBy: RequesterInfo | null;
}

// Type guard to check if an object has all required properties
function isValidRequest(request: unknown): request is UnenrollRequestWithRelations {
  if (!request || typeof request !== 'object') return false;

  const req = request as Record<string, unknown>;
  const student = req.student as StudentInfo | null | undefined;
  const subject = req.subject as SubjectInfo | null | undefined;
  const requestedBy = req.requestedBy as RequesterInfo | null | undefined;

  return (
    student !== null &&
    student !== undefined &&
    subject !== null &&
    subject !== undefined &&
    requestedBy !== null &&
    requestedBy !== undefined
  );
}

interface EmailProps {
  studentName: string;
  studentEmail: string;
  subjectName: string;
  isApproved: boolean;
  reason: string;
  requestDate: string;
  decisionDate: string;
  supportEmail: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // First, get all pending requests with their relations
    const allRequests = await db.unenrollRequest.findMany({
      where: {
        status: 'PENDIENTE',
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            correoInstitucional: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        requestedBy: {
          select: {
            name: true,
            correoInstitucional: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter out any requests with null student, subject, or requestedBy using the type guard
    const validRequests = allRequests.filter(isValidRequest);

    return NextResponse.json(validRequests);
  } catch (error) {
    return NextResponse.json({ message: 'Error al obtener las solicitudes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { requestId, action, reason } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ message: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Get the request with related data
    const existingRequest = await db.unenrollRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            correoInstitucional: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        requestedBy: {
          select: {
            name: true,
            correoInstitucional: true,
          },
        },
      },
    });

    if (!existingRequest) {
      return NextResponse.json({ message: 'Solicitud no encontrada' }, { status: 404 });
    }

    // Update the request
    const status: UnenrollRequestStatus = action === 'approve' ? 'APROBADO' : 'RECHAZADO';

    const unenrollRequest = await db.unenrollRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: { connect: { id: session.user.id } },
        ...(action === 'reject' && { reviewComment: reason }),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            correoInstitucional: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        requestedBy: {
          select: {
            name: true,
            correoInstitucional: true,
          },
        },
      },
    });

    if (action === 'approve') {
      // Remove student from the subject using studentIds array
      await db.subject.update({
        where: { id: unenrollRequest.subjectId },
        data: {
          studentIds: {
            set:
              (
                await db.subject.findUnique({
                  where: { id: unenrollRequest.subjectId },
                  select: { studentIds: true },
                })
              )?.studentIds.filter(id => id !== unenrollRequest.studentId) || [],
          },
        },
      });
    }

    // Send email notification
    await sendStatusEmail(unenrollRequest, action === 'approve');

    return NextResponse.json({
      success: true,
      data: unenrollRequest,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error al procesar la solicitud' }, { status: 500 });
  }
}

async function sendStatusEmail(request: UnenrollRequestWithRelations, isApproved: boolean) {
  const supportEmail = process.env.SUPPORT_EMAIL || 'soporte@fup.edu.co';

  // Ensure we have all required data before proceeding
  if (!request.requestedBy?.correoInstitucional || !request.student || !request.subject) {
    return;
  }

  // Use the actual recipient in production, or a test email in development
  const recipient =
    process.env.NODE_ENV === 'production'
      ? request.requestedBy.correoInstitucional
      : 'elustondo129@gmail.com';

  if (!recipient) {
    return;
  }

  // At this point, we've already verified that request.student and request.subject are not null
  const student = request.student!;
  const subject = request.subject!;

  const emailProps: EmailProps = {
    studentName: student.name || 'Estudiante',
    studentEmail: student.correoInstitucional || 'No especificado',
    subjectName: subject.name,
    isApproved,
    reason: request.reviewComment || 'No se proporcionó una razón',
    requestDate: request.createdAt.toISOString(),
    decisionDate: new Date().toISOString(),
    supportEmail,
  };

  try {
    // Send the email using our email utility
    const response = await sendEmail({
      to: recipient,
      subject: `Solicitud de Desmatriculación ${isApproved ? 'Aprobada' : 'Rechazada'}`,
      react: React.createElement(UnenrollStatusEmail, emailProps),
    });
    return response;
  } catch (error) {
    if (error instanceof Error) {
    }
    throw error; // Propagate the error to be handled by the caller
  }
}
