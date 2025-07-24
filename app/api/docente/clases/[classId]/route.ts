import ClassCancellationEmail from '@/app/emails/ClassCancellationEmail';
import { renderEmail } from '@/app/emails/renderEmail';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import React from 'react';
import { Resend } from 'resend';
import { DocenteClaseDetailSchema, DocenteClaseUpdateSchema } from './schema';

async function verifyTeacherOwnership(classId: string, teacherId: string) {
  const classWithSubject = await db.class.findUnique({
    where: { id: classId },
    include: { subject: true },
  });

  if (!classWithSubject || classWithSubject.subject.teacherId !== teacherId) {
    return false;
  }
  return true;
}

// GET: Obtener los detalles de una clase específica
export async function GET(request: Request, { params }: { params: { classId: string } }) {
  const { classId } = params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }
  const teacherId = session.user.id;

  try {
    // Obtener la clase con el subject relacionado
    const classInfo = await db.class.findUnique({
      where: { id: classId },
      include: {
        subject: true,
      },
    });

    // Verificar que la clase exista y pertenezca al docente
    if (!classInfo || classInfo.subject.teacherId !== teacherId) {
      return NextResponse.json(
        { message: 'Clase no encontrada o no pertenece al docente' },
        { status: 404 }
      );
    }

    // Validar y formatear la respuesta
    const validated = DocenteClaseDetailSchema.safeParse(classInfo);
    if (!validated.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validated.error.errors,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ data: validated.data });
  } catch (error) {
    console.error('Error al obtener los detalles de la clase:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// HU-009: Actualizar una clase
export async function PUT(request: Request, { params }: { params: { classId: string } }) {
  const { classId } = params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const hasPermission = await verifyTeacherOwnership(classId, session.user.id);
  if (!hasPermission) {
    return NextResponse.json(
      { message: 'No tienes permiso para editar esta clase' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const result = DocenteClaseUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { date, topic, status, reason } = result.data;

    // Handle class cancellation notification
    if (status === 'CANCELADA' && reason) {
      const classToCancel = await db.class.findUnique({
        where: { id: classId },
        include: {
          subject: {
            include: {
              teacher: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (classToCancel && classToCancel.subject.studentIds.length > 0) {
        const students = await db.user.findMany({
          where: { id: { in: classToCancel.subject.studentIds } },
          select: { correoInstitucional: true, correoPersonal: true },
        });

        const studentEmails = students
          .map(s => s.correoInstitucional || s.correoPersonal)
          .filter((email): email is string => !!email);

        if (studentEmails.length > 0) {
          try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const testRecipient = 'delivered@resend.dev'; // Resend's special test email

            // Create the email content once to be reused
            const emailComponent = React.createElement(ClassCancellationEmail, {
              subjectName: classToCancel.subject.name,
              teacherName: classToCancel.subject.teacher.name || 'El docente',
              classDate: classToCancel.date.toISOString(),
              reason: reason,
              supportEmail: process.env.SUPPORT_EMAIL || 'soporte@fup.edu.co',
            });
            const emailHtml = await renderEmail(emailComponent);

            // For testing with a non-verified domain, we send one email per student to a test address.
            // In production, you could send to all students at once: `to: studentEmails`
            for (const studentEmail of studentEmails) {
              const { data, error } = await resend.emails.send({
                from: 'Sistema de Asistencias FUP <onboarding@resend.dev>',
                to: [testRecipient], // Always send to the test address in this environment
                subject: `Clase Cancelada: ${classToCancel.subject.name}`,
                html: emailHtml,
              });

              if (error) {
                console.error(`Error simulating email for ${studentEmail}:`, error);
              } else {
                console.log(
                  `Successfully simulated email for ${studentEmail}. Resend ID: ${data?.id}`
                );
              }
            }
          } catch (emailError) {
            console.error('A general error occurred during the email sending process:', emailError);
          }
        }
      }
    }

    // Update the class
    const updatedClass = await db.class.update({
      where: { id: classId },
      data: {
        ...(date && { date }),
        ...(topic && { topic }),
        ...(status && { status }),
        ...(status === 'CANCELADA' && reason && { cancellationReason: reason }),
      },
      include: {
        subject: true,
      },
    });

    // Validate and return the response
    const validated = DocenteClaseDetailSchema.safeParse(updatedClass);
    if (!validated.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validated.error.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: validated.data });
  } catch (error) {
    console.error('Error al actualizar la clase:', error);
    return NextResponse.json({ message: 'Ocurrió un error interno del servidor' }, { status: 500 });
  }
}

// HU-009: Eliminar una clase
export async function DELETE(request: Request, { params }: { params: { classId: string } }) {
  const { classId } = params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  const hasPermission = await verifyTeacherOwnership(classId, session.user.id);
  if (!hasPermission) {
    return NextResponse.json(
      { message: 'No tienes permiso para eliminar esta clase' },
      { status: 403 }
    );
  }

  try {
    const deleted = await db.class.delete({
      where: { id: classId },
      include: { subject: true },
    });
    const validated = DocenteClaseDetailSchema.safeParse(deleted);
    if (!validated.success) {
      return NextResponse.json(
        {
          message: 'Clase eliminada, pero error de validación en la respuesta',
          errors: validated.error.errors,
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { data: validated.data, message: 'Clase eliminada con éxito' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar la clase:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
