import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SubjectQuerySchema, SubjectSchema } from './schema';

// HU-010.5: API para que el Admin obtenga todas las asignaturas
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  try {
    // Validar y parsear parámetros de consulta
    const { searchParams } = new URL(request.url);
    const query = SubjectQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });
    const skip = (query.page - 1) * query.limit;
    const [subjects, total] = await Promise.all([
      db.subject.findMany({
        include: {
          teacher: { select: { name: true } },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take: query.limit,
      }),
      db.subject.count(),
    ]);
    // Validar la respuesta
    const subjectsValidados = SubjectSchema.array().safeParse(subjects);
    if (!subjectsValidados.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: subjectsValidados.error.errors,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      data: subjectsValidados.data,
      subjects: subjectsValidados.data,
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
    console.error('Error al obtener las asignaturas:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
