'use server';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';

export async function uploadSignature(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return { success: false, message: 'Unauthorized.' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, message: 'No file provided.' };
  }

  if (!file.type.startsWith('image/')) {
    return { success: false, message: 'File must be an image.' };
  }

  const userId = session.user.id;
  const filename = `signatures/signature-${userId}-${file.name}`;

  try {
    const blob = await put(filename, file, {
      access: 'public',
      allowOverwrite: true, // Permitir sobrescribir la firma existente
    });

    await prisma.user.update({
      where: { id: userId },
      data: { signatureUrl: blob.url },
    });

    revalidatePath('/dashboard/profile');

    return { success: true, url: blob.url };
  } catch (error) {
    console.error('Error uploading signature:', error);
    return { success: false, message: 'Failed to upload signature.' };
  }
}
