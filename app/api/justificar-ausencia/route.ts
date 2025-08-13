import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Esquema para validar los datos de entrada
const justificationSchema = z.object({
  classId: z.string().min(1, 'ID de clase es requerido'),
  studentId: z.string().min(1, 'ID de estudiante es requerido'),
  reason: z.string().min(10, 'La justificación debe tener al menos 10 caracteres'),
});

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // Validar datos de entrada
    const body = await request.json();
    const validation = justificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Datos inválidos', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { classId, studentId, reason } = validation.data;

    // Verificar que el estudiante existe y está matriculado en la clase
    const classInfo = await db.class.findUnique({
      where: { id: classId },
      include: {
        subject: {
          select: {
            studentIds: true,
          },
        },
      },
    });

    if (!classInfo) {
      return NextResponse.json({ message: 'Clase no encontrada' }, { status: 404 });
    }

    // Verificar que el estudiante está matriculado en la materia
    if (!classInfo.subject.studentIds.includes(studentId)) {
      return NextResponse.json(
        { message: 'Estudiante no matriculado en esta materia' },
        { status: 403 }
      );
    }

    // Verificar que la clase ya ha comenzado pero no ha terminado
    const now = new Date();
    const classStartTime = classInfo.startTime || classInfo.date;
    const classEndTime =
      classInfo.endTime || new Date(classStartTime.getTime() + 2 * 60 * 60 * 1000); // 2 horas por defecto

    if (now < classStartTime) {
      return NextResponse.json({ message: 'La clase aún no ha comenzado' }, { status: 400 });
    }

    // Actualizar la asistencia con la justificación
    await db.attendance.upsert({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
      update: {
        status: 'JUSTIFICADO',
        justification: reason,
      },
      create: {
        studentId,
        classId,
        status: 'JUSTIFICADO',
        justification: reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ausencia justificada correctamente',
    });
  } catch (error) {
    console.error('Error al procesar la justificación:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
