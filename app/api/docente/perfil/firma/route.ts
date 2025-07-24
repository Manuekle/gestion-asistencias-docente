import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';

/**
 * POST /api/docente/perfil/firma
 * Sube la imagen de la firma de un docente y actualiza su perfil.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCENTE') {
    return new NextResponse('No autorizado', { status: 401 });
  }

  try {
    const data = await request.formData();
    const file: File | null = data.get('signature') as unknown as File;

    if (!file) {
      return new NextResponse('No se ha subido ningún archivo', {
        status: 400,
      });
    }

    // Validar tipo de archivo (opcional pero recomendado)
    if (!file.type.startsWith('image/')) {
      return new NextResponse('Tipo de archivo no válido, se requiere una imagen', { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Crear un nombre de archivo único para evitar colisiones
    const extension = path.extname(file.name);
    const filename = `${session.user.id}_${Date.now()}${extension}`;

    // Definir la ruta donde se guardará el archivo
    const signaturesDir = path.join(process.cwd(), 'public', 'signatures');
    const filePath = path.join(signaturesDir, filename);

    // Asegurarse de que el directorio exista
    await require('fs').promises.mkdir(signaturesDir, { recursive: true });

    // Escribir el archivo en el disco
    await writeFile(filePath, buffer);

    const signatureUrl = `/signatures/${filename}`;

    // Actualizar el usuario en la base de datos
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { signatureUrl: signatureUrl },
    });

    return NextResponse.json({
      message: 'Firma subida exitosamente',
      signatureUrl: signatureUrl,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[SIGNATURE_UPLOAD_POST]', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
