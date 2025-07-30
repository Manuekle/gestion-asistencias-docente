import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { Role, Prisma } from '@prisma/client';

// PATCH: Actualizar un usuario existente
export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { userId } = params;
    const body = await req.json();
    const {
      name,
      role,
      isActive,
      document,
      telefono,
      correoPersonal,
      correoInstitucional,
      codigoEstudiantil,
      codigoDocente,
    } = body;

    // Validar que al menos un correo esté presente
    if (body.correoPersonal === '' && body.correoInstitucional === '') {
      return NextResponse.json(
        { message: 'El usuario debe tener al menos un correo electrónico.' },
        { status: 400 }
      );
    }

    // Verificar unicidad de los correos si se proporcionan
    const orConditions = [];
    if (correoPersonal) orConditions.push({ correoPersonal });
    if (correoInstitucional) orConditions.push({ correoInstitucional });

    if (orConditions.length > 0) {
      const existingUser = await db.user.findFirst({
        where: {
          id: { not: userId },
          OR: orConditions,
        },
      });
      if (existingUser) {
        return NextResponse.json(
          { message: 'Uno de los correos electrónicos ya está en uso.' },
          { status: 409 }
        );
      }
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name,
        role,
        isActive,
        document,
        telefono,
        correoPersonal,
        correoInstitucional,
        codigoEstudiantil,
        codigoDocente,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('[ADMIN_UPDATE_USER_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: Eliminar un usuario
export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { userId } = params;

    if (session.user.id === userId) {
      return NextResponse.json({ message: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
    }

    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'Usuario eliminado con éxito' }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_DELETE_USER_ERROR]', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          {
            message:
              'No se puede eliminar el usuario porque tiene registros asociados (ej. asignaturas, asistencias).',
          },
          { status: 409 }
        );
      }
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
