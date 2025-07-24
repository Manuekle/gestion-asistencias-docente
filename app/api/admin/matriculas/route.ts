import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MatriculaQuerySchema, MatriculaUpdateSchema, StudentWithStatusSchema } from './schema';

// HU-010.5: Obtener estudiantes y su estado de matrícula para una asignatura
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const query = MatriculaQuerySchema.parse({
      subjectId: searchParams.get('subjectId'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });
    // 1. Obtener todos los usuarios que son estudiantes (paginados)
    const skip = (query.page - 1) * query.limit;
    const [allStudents, total] = await Promise.all([
      db.user.findMany({
        where: { role: 'ESTUDIANTE' },
        select: { id: true, name: true, correoInstitucional: true },
        skip,
        take: query.limit,
      }),
      db.user.count({ where: { role: 'ESTUDIANTE' } }),
    ]);
    // 2. Obtener la asignatura para saber quiénes están matriculados
    const subject = await db.subject.findUnique({
      where: { id: query.subjectId },
      select: { studentIds: true },
    });
    const enrolledStudentIds = new Set(subject?.studentIds || []);
    // 3. Combinar las listas para saber quién está matriculado
    const studentsWithStatus = allStudents.map(student => ({
      ...student,
      isEnrolled: enrolledStudentIds.has(student.id),
    }));
    // Validar la respuesta
    const validados = StudentWithStatusSchema.array().safeParse(studentsWithStatus);
    if (!validados.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validados.error.errors,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      data: validados.data,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('Error al obtener la lista de estudiantes:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// HU-010.5: Actualizar la lista de matriculados para una asignatura
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const data = MatriculaUpdateSchema.parse(body);
    await db.$transaction(async tx => {
      // 1. Obtener el estado actual de la asignatura
      const subject = await tx.subject.findUnique({
        where: { id: data.subjectId },
        select: { studentIds: true },
      });
      if (!subject) {
        throw new Error('Asignatura no encontrada');
      }
      const currentStudentIds = subject.studentIds;
      // 2. Determinar qué estudiantes desmatricular y cuáles matricular
      const studentsToUnenroll = currentStudentIds.filter(id => !data.studentIds.includes(id));
      const studentsToEnroll = data.studentIds.filter(id => !currentStudentIds.includes(id));
      // 3. Desmatricular estudiantes y matricular nuevos, sincronizando enrolledSubjectIds
      // Para cada estudiante, actualizar su array enrolledSubjectIds según corresponda
      // Desmatricular: quitar la materia del array
      for (const studentId of studentsToUnenroll) {
        const user = await tx.user.findUnique({
          where: { id: studentId },
          select: { enrolledSubjectIds: true },
        });
        if (user) {
          await tx.user.update({
            where: { id: studentId },
            data: {
              enrolledSubjectIds: {
                set: (user.enrolledSubjectIds || []).filter(id => id !== data.subjectId),
              },
            },
          });
        }
      }
      // Matricular: agregar la materia al array si no está
      for (const studentId of studentsToEnroll) {
        const user = await tx.user.findUnique({
          where: { id: studentId },
          select: { enrolledSubjectIds: true },
        });
        if (user && !user.enrolledSubjectIds.includes(data.subjectId)) {
          await tx.user.update({
            where: { id: studentId },
            data: {
              enrolledSubjectIds: {
                set: [...user.enrolledSubjectIds, data.subjectId],
              },
            },
          });
        }
      }
      // 5. Actualizar la lista de estudiantes en la asignatura
      await tx.subject.update({
        where: { id: data.subjectId },
        data: { studentIds: { set: data.studentIds } },
      });
    });
    return NextResponse.json({ message: 'Matrículas actualizadas con éxito' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('Error al actualizar las matrículas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
