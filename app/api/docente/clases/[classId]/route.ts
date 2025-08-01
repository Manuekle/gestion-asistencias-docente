import ClassCancellationEmail from '@/app/emails/ClassCancellationEmail';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import React from 'react';
import { sendEmail } from '@/lib/email';
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
            // Create the email content once to be reused
            const emailComponent = React.createElement(ClassCancellationEmail, {
              subjectName: classToCancel.subject.name,
              teacherName: classToCancel.subject.teacher.name || 'El docente',
              classDate: classToCancel.date.toISOString(),
              reason: reason,
              supportEmail: process.env.SUPPORT_EMAIL || 'soporte@fup.edu.co',
            });

            // Send email to all students
            const emailPromises = studentEmails.map(studentEmail => 
              sendEmail({
                to: studentEmail,
                subject: `Clase Cancelada: ${classToCancel.subject.name}`,
                react: emailComponent,
              }).catch(error => {
                console.error(`Error sending email to ${studentEmail}:`, error);
                return { success: false, email: studentEmail, error };
              })
            );

            // Wait for all emails to be sent
            const results = await Promise.all(emailPromises);
            const failedEmails = results.filter(r => !r.success);
            
            if (failedEmails.length > 0) {
              console.error(`Failed to send ${failedEmails.length} cancellation emails`);
            } else {
              console.log(`Successfully sent ${results.length} cancellation emails`);
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
