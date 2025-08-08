import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ message: 'Token no proporcionado' }, { status: 400 });
    }

    // Buscar usuario con el token de restablecimiento
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Verificar que el token no haya expirado
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'El token de restablecimiento no es válido o ha expirado.' },
        { status: 400 }
      );
    }

    // Si llegamos aquí, el token es válido
    return NextResponse.json(
      {
        valid: true,
        message: 'Token válido',
        correoInstitucional: user.correoInstitucional || user.correoPersonal || '', // Devolver el correo institucional o personal
        correoPersonal: user.correoPersonal,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
