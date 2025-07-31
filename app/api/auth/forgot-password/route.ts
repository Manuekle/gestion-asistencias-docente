import ResetPasswordEmail from '@/app/emails/ResetPasswordEmail';
import { renderEmail } from '@/app/emails/renderEmail';
import { db } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { Resend } from 'resend';

// Configuración de Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { correo } = await request.json();

    if (!correo) {
      return NextResponse.json({ message: 'El correo electrónico es requerido' }, { status: 400 });
    }

    // Buscar usuario por correo institucional o personal
    const user = await db.user.findFirst({
      where: {
        OR: [{ correoInstitucional: correo }, { correoPersonal: correo }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'No se encontró un usuario con ese correo electrónico' },
        { status: 404 }
      );
    }

    // Generar token de reset
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token en la base de datos
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Renderizar el correo electrónico con React Email
    const emailComponent = React.createElement(ResetPasswordEmail, {
      resetUrl: `${process.env.NEXTAUTH_URL}/reset-password/${resetToken}`,
      userEmail: user.correoInstitucional || user.correoPersonal || '',
      supportEmail: process.env.SUPPORT_EMAIL || 'soporte@fup.edu.co',
    });
    const emailHtml = await renderEmail(emailComponent);

    // Usar el dominio de prueba de Resend temporalmente
    const testEmail = 'delivered@resend.dev';
    const isTestEmail = correo.endsWith('@gmail.com') || correo.endsWith('@hotmail.com');

    // Enviar correo electrónico
    const { error } = await resend.emails.send({
      from: `Sistema de Asistencias FUP <onboarding@resend.dev>`,
      to: isTestEmail ? testEmail : correo,
      subject: 'Restablece tu contraseña - Sistema de Asistencias FUP',
      html: emailHtml,
    });

    if (error) {
      return NextResponse.json({ error: 'Error al enviar el correo de restablecimiento' }, {
        status: 500,
      });
    }

    return NextResponse.json(
      {
        message:
          'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en forgot-password:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
