import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Prisma, AttendanceStatus, Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

import { z } from 'zod';
import { AttendanceQuerySchema, AttendanceSchema, AttendanceStatusEnum } from './schema';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }
  const { user } = session;
  try {
    // Validar parámetros de consulta
    const { searchParams } = new URL(request.url);
    const query = AttendanceQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      classId: searchParams.get('classId') || undefined,
      studentId: searchParams.get('studentId') || undefined,
    });
    const whereClause: Prisma.AttendanceWhereInput = {};
    // Filtros según el rol del usuario
    if (user.role === Role.ADMIN) {
      if (query.classId) whereClause.classId = query.classId;
      if (query.studentId) whereClause.studentId = query.studentId;
    } else if (user.role === Role.DOCENTE) {
      whereClause.class = { subject: { teacherId: user.id } };
      if (query.classId) whereClause.classId = query.classId;
      if (query.studentId) whereClause.studentId = query.studentId;
    } else {
      whereClause.studentId = user.id;
      if (query.classId) whereClause.classId = query.classId;
    }
    const skip = (query.page - 1) * query.limit;
    const [attendances, total] = await Promise.all([
      db.attendance.findMany({
        where: whereClause,
        include: {
          class: {
            select: {
              id: true,
              date: true,
              topic: true,
              subject: { select: { id: true, name: true, code: true } },
            },
          },
          student: { select: { id: true, name: true, correoInstitucional: true } },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take: query.limit,
      }),
      db.attendance.count({ where: whereClause }),
    ]);
    // Validar la respuesta
    const validados = AttendanceSchema.array().safeParse(attendances);
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
    console.error('Error al obtener asistencias:', error);
    return NextResponse.json({ message: 'Error al obtener asistencias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }
  const now = new Date();
  try {
    const body = await request.json();
    // Validar entrada
    const schema = z.object({
      studentId: z.string(),
      classId: z.string(),
      status: AttendanceStatusEnum.optional(),
      justification: z.string().nullable().optional(),
    });
    const data = schema.parse(body);
    // Verificar si ya existe una asistencia para este estudiante en esta clase
    const existingAttendance = await db.attendance.findFirst({
      where: {
        studentId: data.studentId,
        classId: data.classId,
      },
    });
    if (existingAttendance) {
      return NextResponse.json(
        { message: 'Ya existe un registro para este estudiante en esta clase' },
        { status: 400 }
      );
    }
    // Crear transacción para registrar la asistencia y el log
    const result = await db.attendance.create({
      data: {
        studentId: data.studentId,
        classId: data.classId,
        status: data.status || 'PRESENTE',
        justification: data.justification || null,
        recordedAt: now,
      },
      include: {
        student: true,
        class: true,
      },
    });
    // Validar salida
    const validado = AttendanceSchema.safeParse(result);
    if (!validado.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validado.error.errors,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { data: validado.data, message: 'Asistencia registrada correctamente' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('Error al crear asistencia:', error);
    return NextResponse.json({ message: 'Error al crear la asistencia' }, { status: 500 });
  }
}

interface UpdateAttendanceData {
  status?: string;
  justification?: string | null;
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !([Role.ADMIN, Role.DOCENTE] as Role[]).includes(session.user.role)) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ message: 'Falta el ID de la asistencia' }, { status: 400 });
  }

  try {
    // Obtener y validar los datos de la solicitud
    const updateData: UpdateAttendanceData = await request.json();

    // Validar que al menos un campo sea proporcionado
    if (!updateData.status && !updateData.justification) {
      return NextResponse.json(
        {
          message: 'Se requiere al menos un campo para actualizar (status o justificación)',
        },
        { status: 400 }
      );
    }

    // Validar que el estado sea proporcionado si se está actualizando
    if (updateData.status === '') {
      return NextResponse.json(
        {
          message: 'El estado no puede estar vacío',
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Obtener la asistencia actual
    const currentAttendance = await db.attendance.findUnique({
      where: { id },
    });

    if (!currentAttendance) {
      throw new Error('Asistencia no encontrada');
    }

    // Validar entrada y preparar datos
    const updateSchema = z.object({
      status: AttendanceStatusEnum.optional().transform(val => val as AttendanceStatus),
      justification: z.string().nullable().optional(),
    });
    const parsedUpdate = updateSchema.parse(updateData);

    // Preparar datos para la actualización
    const updatePayload: {
      status?: AttendanceStatus;
      justification?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: now,
    };

    if (parsedUpdate.status !== undefined) {
      updatePayload.status = parsedUpdate.status;
    }
    if (parsedUpdate.justification !== undefined) {
      updatePayload.justification = parsedUpdate.justification;
    }

    // Actualizar la asistencia
    const updatedAttendance = await db.attendance.update({
      where: { id },
      data: updatePayload,
    });

    // Validar salida
    const validado = AttendanceSchema.safeParse(updatedAttendance);
    if (!validado.success) {
      throw new Error('Error de validación en la respuesta');
    }
    const result = validado.data;
    return NextResponse.json({
      data: result,
      message: 'Asistencia actualizada correctamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: error.errors },
        { status: 400 }
      );
    }
    const status =
      error instanceof Error && error.message === 'Asistencia no encontrada' ? 404 : 500;
    return NextResponse.json(
      {
        message: status === 404 ? 'Asistencia no encontrada' : 'Error al actualizar la asistencia',
      },
      { status }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !([Role.ADMIN, Role.DOCENTE] as Role[]).includes(session.user.role)) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ message: 'Falta el ID de la asistencia' }, { status: 400 });
  }

  try {
    // Verificar que la asistencia existe antes de intentar eliminarla
    const attendanceExists = await db.attendance.findUnique({
      where: { id },
    });

    if (!attendanceExists) {
      return NextResponse.json({ message: 'Asistencia no encontrada' }, { status: 404 });
    }

    // Eliminar la asistencia
    await db.attendance.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Asistencia eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar asistencia:', error);
    return NextResponse.json({ message: 'Error al eliminar la asistencia' }, { status: 500 });
  }
}
