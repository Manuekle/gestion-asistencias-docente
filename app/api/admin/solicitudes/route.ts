import { renderEmail } from '@/app/emails/renderEmail';
import UnenrollStatusEmail from '@/app/emails/UnenrollStatusEmail';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Subject, UnenrollRequest, UnenrollRequestStatus, User } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import * as React from 'react';
import { Resend } from 'resend';

type UnenrollRequestWithRelations = UnenrollRequest & {
  student: Pick<User, 'id' | 'name' | 'correoInstitucional'>;
  subject: Pick<Subject, 'id' | 'name'>;
  requestedBy: Pick<User, 'name' | 'correoInstitucional'>;
};

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

    const requests = await db.unenrollRequest.findMany({
      where: { status: 'PENDIENTE' },
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

    return NextResponse.json({ data: requests });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
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
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json({ message: 'Error al procesar la solicitud' }, { status: 500 });
  }
}

async function sendStatusEmail(request: UnenrollRequestWithRelations, isApproved: boolean) {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY no está configurado en las variables de entorno');
      return;
    }

    const resend = new Resend(RESEND_API_KEY);
    const supportEmail = process.env.SUPPORT_EMAIL || 'soporte@fup.edu.co';
    
    // Use a verified domain for testing or the actual recipient
    const recipient = process.env.NODE_ENV === 'production' 
      ? request.requestedBy.correoInstitucional 
      : 'delivered@resend.dev';
    
    // Use a verified sender domain from your Resend dashboard
    const senderEmail = 'notificaciones@resend.dev'; // Replace with your verified domain

    if (!recipient) {
      console.warn('No se pudo enviar el correo: destinatario no especificado');
      return;
    }

    console.log('Enviando correo a:', recipient);

    const emailProps: EmailProps = {
      studentName: request.student.name || 'Estudiante',
      studentEmail: request.student.correoInstitucional || 'No especificado',
      subjectName: request.subject?.name || 'Asignatura',
      isApproved,
      reason: request.reviewComment || '',
      requestDate: request.createdAt.toISOString(),
      decisionDate: new Date().toISOString(),
      supportEmail,
    };

    console.log('Props del correo:', JSON.stringify(emailProps, null, 2));

    // Render the email component
    const emailComponent = React.createElement(UnenrollStatusEmail, emailProps);
    const emailHtml = await renderEmail(emailComponent);

    const response = await resend.emails.send({
      from: `Sistema de Asistencias FUP <${senderEmail}>`,
      to: [recipient],
      subject: `Solicitud de Desmatriculación ${isApproved ? 'Aprobada' : 'Rechazada'}`,
      html: emailHtml,
    });

    console.log('Correo enviado exitosamente:', response);
    return response;
  } catch (error) {
    console.error('Error al enviar el correo de notificación:', error);
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      const errorWithResponse = error as Error & { response?: unknown };
      if (errorWithResponse.response) {
        console.error('Respuesta del error:', JSON.stringify(errorWithResponse.response, null, 2));
      }
    }
    throw error; // Propagate the error to be handled by the caller
  }
}
