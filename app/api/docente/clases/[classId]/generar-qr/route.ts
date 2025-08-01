import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { GenerarQRResponseSchema } from './schema';

// Endpoint para generar un token QR para una clase específica
export async function POST(request: Request, context: { params: { classId: string } }) {
  const { classId } = await Promise.resolve(context.params);
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  if (!classId) {
    return NextResponse.json({ message: 'El ID de la clase es requerido' }, { status: 400 });
  }

  // 1. Verificar que la clase pertenece al docente y cargar la relación con subject
  const classToUpdate = await db.class.findFirst({
    where: {
      id: classId,
      subject: {
        teacherId: session.user.id,
      },
    },
    include: {
      subject: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });

  if (!classToUpdate) {
    return NextResponse.json(
      { message: 'Clase no encontrada o no pertenece al docente' },
      { status: 404 }
    );
  }

  // 2. Siempre generar un nuevo token, independientemente de si existe uno previo
  // 3. Generar un token seguro de 32 caracteres
  const generateSecureToken = (): string => {
    // Generar 16 bytes (32 caracteres hexadecimales)
    // Usar crypto.getRandomValues para mayor seguridad
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const token = generateSecureToken();
  // Establecer tiempo de expiración (5 minutos desde ahora)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  // 4. Actualizar la clase con el nuevo token
  try {
    await db.class.update({
      where: { id: classId },
      data: {
        qrToken: token,
        qrTokenExpiresAt: expiresAt,
      },
    });
  } catch (error) {
    console.error('Error al actualizar la clase con el token QR:', error);
    return NextResponse.json(
      { message: 'Error al guardar el token QR en la base de datos' },
      { status: 500 }
    );
  }

  let baseUrl = process.env.NEXTAUTH_URL || 'https://gestion-asistencias-docente.vercel.app';
  // Ensure the URL has a protocol
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  const qrUrl = `${baseUrl}/dashboard/estudiante/escanear/${token}`;

  // Validar que el token cumple con los requisitos
  if (token.length !== 32) {
    console.error(`Token generado no cumple con la longitud requerida: ${token.length} caracteres`);
    return NextResponse.json(
      {
        message: 'Error al generar el token QR: token inválido',
        error: 'INVALID_TOKEN_LENGTH',
        tokenLength: token.length,
        requiredLength: 32,
      },
      { status: 500 }
    );
  }

  // Crear el objeto de respuesta
  const responseData = {
    qrUrl,
    qrToken: token,
    expiresAt: expiresAt.toISOString(),
  };

  // Validar la respuesta contra el esquema
  const validation = GenerarQRResponseSchema.safeParse(responseData);

  if (!validation.success) {
    console.error('Error de validación en la respuesta:', validation.error);
    return NextResponse.json(
      {
        message: 'Error en el formato de la respuesta',
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      data: validation.data,
      message: 'Token QR generado correctamente',
    },
    { status: 200 }
  );
}
