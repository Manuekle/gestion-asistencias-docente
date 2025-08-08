import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  DocenteClaseCreateSchema,
  DocenteClaseQuerySchema,
  DocenteClaseSchema,
  DocenteEventoCreateSchema,
  DocenteEventoSchema,
} from './schema';

// Definir manualmente el enum Role para evitar problemas de importación
enum Role {
  ADMIN = 'ADMIN',
  DOCENTE = 'DOCENTE',
  COORDINADOR = 'COORDINADOR',
}

// Limpieza de parámetros: null, 'null', '' => undefined
function clean(val: string | null | undefined): string | undefined {
  if (val === null || val === undefined || val === '' || val === 'null') return undefined;
  return val;
}

// GET /api/docente/clases?subjectId=...&fetch=classes|events
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== Role.DOCENTE) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    // Limpieza de parámetros: null, 'null', '' => undefined
    const query = DocenteClaseQuerySchema.parse({
      subjectId: clean(searchParams.get('subjectId')),
      fetch: clean(searchParams.get('fetch')),
      page: clean(searchParams.get('page')),
      limit: clean(searchParams.get('limit')),
      sortBy: clean(searchParams.get('sortBy')),
      sortOrder: clean(searchParams.get('sortOrder')),
    });
    // Security check: Verify the teacher owns the subject
    const subject = await db.subject.findFirst({
      where: {
        id: query.subjectId,
        teacherId: session.user.id,
      },
    });
    if (!subject) {
      return NextResponse.json(
        { message: 'Asignatura no encontrada o no pertenece al docente' },
        { status: 404 }
      );
    }
    // Eventos: paginación y ordenamiento
    if (query.fetch === 'events') {
      const total = await db.subjectEvent.count({
        where: { subjectId: query.subjectId },
      });
      const events = await db.subjectEvent.findMany({
        where: { subjectId: query.subjectId },
        orderBy: { date: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });
      const validados = z.array(DocenteEventoSchema).safeParse(events);
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
    }
    // Clases: paginación y ordenamiento
    const total = await db.class.count({
      where: { subjectId: query.subjectId },
    });
    const classes = await db.class.findMany({
      where: { subjectId: query.subjectId },
      orderBy: [
        { date: 'asc' }, // Ordenar por fecha ascendente (más cercana primero)
        { startTime: 'asc' }, // Si hay varias clases el mismo día, ordenar por hora de inicio
      ],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        subject: { select: { name: true, code: true } },
      },
    });
    const now = new Date();
    const formatted = await Promise.all(
      classes.map(async cls => {
        // Determine if the class is in the past
        const classEndTime = cls.endTime || cls.startTime || cls.date;
        const isPast = new Date(classEndTime) < now;

        // If class is in the past and doesn't have a status, update it to REALIZADA
        let status = cls.status;
        if (isPast && !status) {
          try {
            // Update the status in the database
            await db.class.update({
              where: { id: cls.id },
              data: { status: 'REALIZADA' },
            });
            status = 'REALIZADA';
          } catch (error) {
            // If update fails, use PROGRAMADA as fallback
            status = 'PROGRAMADA';
          }
        }

        return {
          id: cls.id,
          subjectId: cls.subjectId,
          date: cls.date,
          startTime: cls.startTime,
          endTime: cls.endTime,
          topic: cls.topic,
          description: cls.description,
          classroom: cls.classroom,
          status: status || 'PROGRAMADA', // Default to PROGRAMADA if status is still not set
          cancellationReason: cls.cancellationReason,
          totalStudents: cls.totalStudents,
          presentCount: cls.presentCount,
          absentCount: cls.absentCount,
          lateCount: cls.lateCount,
          justifiedCount: cls.justifiedCount,
          createdAt: cls.createdAt,
          updatedAt: cls.updatedAt,
          subjectName: cls.subject?.name,
          subjectCode: cls.subject?.code,
        };
      })
    );
    const validados = z.array(DocenteClaseSchema).safeParse(formatted);
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
        { message: 'Datos de consulta inválidos', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/docente/clases (para crear Clases o Eventos)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== Role.DOCENTE) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }
  try {
    const body = await request.json();
    // entity: 'event' | 'class'
    if (body.entity === 'event') {
      const data = DocenteEventoCreateSchema.parse(body);
      // Security check
      const subject = await db.subject.findFirst({
        where: { id: data.subjectId, teacherId: session.user.id },
      });
      if (!subject) {
        return NextResponse.json(
          { message: 'Asignatura no encontrada o no pertenece al docente' },
          { status: 404 }
        );
      }
      const newEvent = await db.subjectEvent.create({
        data: {
          title: data.title,
          description: data.description,
          date: data.date,
          type: data.type as import('@prisma/client').EventType,
          subjectId: data.subjectId,
          createdById: session.user.id,
        },
      });
      const validado = DocenteEventoSchema.safeParse(newEvent);
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
        { data: validado.data, message: 'Evento creado correctamente' },
        { status: 201 }
      );
    } else {
      const data = DocenteClaseCreateSchema.parse(body);
      // Security check
      const subject = await db.subject.findFirst({
        where: { id: data.subjectId, teacherId: session.user.id },
      });
      if (!subject) {
        return NextResponse.json(
          { message: 'Asignatura no encontrada o no pertenece al docente' },
          { status: 404 }
        );
      }
      if (data.startTime >= data.endTime) {
        return NextResponse.json(
          { message: 'La hora de inicio debe ser anterior a la hora de fin' },
          { status: 400 }
        );
      }
      const newClass = await db.class.create({
        data: {
          subjectId: data.subjectId,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          topic: data.topic || null,
        },
      });
      const validado = DocenteClaseSchema.safeParse({
        ...newClass,
        subjectName: subject.name,
        subjectCode: subject.code,
      });
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
        { data: validado.data, message: 'Clase creada correctamente' },
        { status: 201 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
