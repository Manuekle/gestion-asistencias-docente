import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse(JSON.stringify({ message: 'Token no proporcionado' }), {
        status: 400,
      });
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
      return new NextResponse(
        JSON.stringify({
          message: 'El token de restablecimiento no es válido o ha expirado.',
        }),
        { status: 400 }
      );
    }

    // Si llegamos aquí, el token es válido
    return new NextResponse(
      JSON.stringify({
        valid: true,
        message: 'Token válido',
        correoInstitucional: user.correoInstitucional || user.correoPersonal || '', // Devolver el correo institucional o personal
        correoPersonal: user.correoPersonal,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en verify-reset-token:', error);
    return new NextResponse(JSON.stringify({ message: 'Error interno del servidor' }), {
      status: 500,
    });
  }
}
