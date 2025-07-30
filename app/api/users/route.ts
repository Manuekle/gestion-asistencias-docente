import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserCreateSchema, UserSchema, UserSearchQuerySchema, UserUpdateSchema } from './schema';

// Limpieza de parámetros: null, 'null', '' => undefined
function clean(val: string | null | undefined): string | undefined {
  if (val === null || val === undefined || val === '' || val === 'null') return undefined;
  return val;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = UserSearchQuerySchema.safeParse({
      search: clean(searchParams.get('search')),
      page: clean(searchParams.get('page')),
      limit: clean(searchParams.get('limit')),
      sortBy: clean(searchParams.get('sortBy')),
      sortOrder: clean(searchParams.get('sortOrder')),
    });
    if (!query.success) {
      return NextResponse.json(
        {
          message: 'Datos de entrada inválidos',
          errors: query.error.errors,
          data: [],
          pagination: null,
        },
        { status: 400 }
      );
    }
    // Si no hay término de búsqueda, devolver array vacío para no exponer todos los usuarios
    if (!query.data.search) {
      return NextResponse.json({
        data: [],
        pagination: {
          total: 0,
          page: query.data.page,
          limit: query.data.limit,
          totalPages: 0,
        },
        message: 'Sin término de búsqueda',
      });
    }

    // Construir la condición de búsqueda
    const searchTerm = query.data.search.toLowerCase();
    const where: Prisma.UserWhereInput = {
      role: Role.ESTUDIANTE,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { correoInstitucional: { contains: searchTerm, mode: 'insensitive' } },
        { correoPersonal: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    const skip = (query.data.page - 1) * query.data.limit;
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          correoInstitucional: true,
          correoPersonal: true,
          role: true,
        },
        orderBy: { [query.data.sortBy]: query.data.sortOrder },
        skip,
        take: query.data.limit,
      }),
      db.user.count({
        where: {
          role: Role.ESTUDIANTE,
          OR: [
            { name: { contains: query.data.search, mode: 'insensitive' as const } },
            { correoInstitucional: { contains: query.data.search, mode: 'insensitive' as const } },
          ],
        },
      }),
    ]);
    // Validar la respuesta
    const usuariosValidados = UserSchema.array().safeParse(users);
    if (!usuariosValidados.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: usuariosValidados.error.errors,
          data: [],
          pagination: null,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      data: usuariosValidados.data,
      pagination: {
        total,
        page: query.data.page,
        limit: query.data.limit,
        totalPages: Math.ceil(total / query.data.limit),
      },
      message: 'Usuarios encontrados',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Datos de entrada inválidos',
          errors: error.errors,
          data: [],
          pagination: null,
        },
        { status: 400 }
      );
    }
    console.error('ERROR_SEARCH_USERS:', error);
    return NextResponse.json(
      {
        message: 'Error interno del servidor al buscar usuarios',
        data: [],
        pagination: null,
      },
      { status: 500 }
    );
  }
}

// Maneja las peticiones POST para crear un nuevo usuario
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const data = UserCreateSchema.parse(body);

    // Verificar si ya existe un usuario con el mismo correo institucional o personal
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { correoInstitucional: data.correoInstitucional },
          { correoPersonal: data.correoInstitucional }
        ]
      },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'El correo electrónico ya está en uso' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await db.user.create({
      data: {
        name: data.name,
        correoInstitucional: data.correoInstitucional,
        correoPersonal: data.correoPersonal,
        password: hashedPassword,
        role: data.role,
      },
    });

    const { password, ...userWithoutPassword } = newUser;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = password;
    const usuarioValidado = UserSchema.safeParse(userWithoutPassword);
    if (!usuarioValidado.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: usuarioValidado.error.errors,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ data: usuarioValidado.data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('ERROR_CREATE_USER:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al crear el usuario' },
      { status: 500 }
    );
  }
}

// Maneja las peticiones PUT para actualizar un usuario existente
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    if (!userId) {
      return NextResponse.json({ message: 'El ID del usuario es requerido' }, { status: 400 });
    }
    const body = await req.json();
    const data = UserUpdateSchema.parse({ ...body, id: userId });
    const updateData: {
      name?: string;
      correoInstitucional?: string;
      correoPersonal?: string | null;
      role?: Role;
      password?: string;
    } = {};
    
    if (data.name) updateData.name = data.name;
    if (data.correoInstitucional) updateData.correoInstitucional = data.correoInstitucional;
    if (data.correoPersonal !== undefined) updateData.correoPersonal = data.correoPersonal;
    if (data.role) updateData.role = data.role;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    const updatedUser = await db.user.update({
      where: { id: data.id },
      data: updateData,
    });
    const { password, ...userWithoutPassword } = updatedUser;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = password;
    const usuarioValidado = UserSchema.safeParse(userWithoutPassword);
    if (!usuarioValidado.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: usuarioValidado.error.errors,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ data: usuarioValidado.data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos de entrada inválidos', errors: error.errors },
        { status: 400 }
      );
    }
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: unknown }).code === 'P2025'
    ) {
      return NextResponse.json(
        { message: 'No se encontró un usuario con el ID proporcionado' },
        { status: 404 }
      );
    }
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: unknown }).code === 'P2002'
    ) {
      return NextResponse.json(
        { message: 'El correo electrónico ya está en uso por otro usuario' },
        { status: 409 }
      );
    }
    console.error('ERROR_UPDATE_USER:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al actualizar el usuario' },
      { status: 500 }
    );
  }
}

// Maneja las peticiones DELETE para eliminar un usuario por su ID
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('id');
  try {
    if (!userId) {
      return NextResponse.json({ message: 'El ID del usuario es requerido' }, { status: 400 });
    }
    await db.user.delete({
      where: { id: userId },
    });
    return NextResponse.json(
      { message: `Usuario con ID ${userId} eliminado con éxito` },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: unknown }).code === 'P2025'
    ) {
      return NextResponse.json(
        { message: `No se encontró un usuario con el ID ${userId}` },
        { status: 404 }
      );
    }
    console.error('ERROR_DELETE_USER:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al eliminar el usuario' },
      { status: 500 }
    );
  }
}
