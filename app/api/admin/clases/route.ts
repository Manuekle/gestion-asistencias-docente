import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { ClassSchema, ClassQuerySchema } from './schema';

// API para que el Admin obtenga todas las clases
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  try {
    // Validar y parsear parámetros de consulta
    const { searchParams } = new URL(request.url);
    const query = ClassQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });
    const skip = (query.page - 1) * query.limit;
    const [classes, total] = await Promise.all([
      db.class.findMany({
        include: {
          subject: { select: { name: true, code: true } },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take: query.limit,
      }),
      db.class.count(),
    ]);
    // Validar la respuesta
    const clasesValidadas = ClassSchema.array().safeParse(classes);
    if (!clasesValidadas.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: clasesValidadas.error.errors,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      data: clasesValidadas.data,
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
    console.error('Error al obtener las clases:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
