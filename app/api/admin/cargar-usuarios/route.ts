import WelcomeUserEmail from '@/app/emails/WelcomeUserEmail';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { tmpdir } from 'os';
import path from 'path';
import * as XLSX from 'xlsx';

// Interfaces para la carga de usuarios
interface ExcelRow {
  [key: string]: string | number;
}

interface UserData {
  name: string;
  document: string;
  correoPersonal: string;
  correoInstitucional?: string;
  password?: string;
  role: string;
}

interface PreviewResult {
  data: UserData;
  status: 'success' | 'warning' | 'error';
  message: string;
}

interface FinalResult {
  document: string;
  name: string;
  status: 'created' | 'skipped' | 'error';
  message: string;
}

// Función para generar contraseñas aleatorias
const generatePassword = (length: number = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Función para enviar correo de manera asíncrona (no bloqueante)
const sendWelcomeEmailAsync = async (
  email: string,
  name: string,
  password: string
): Promise<void> => {
  try {
    await sendEmail({
      to: email,
      subject: '¡Bienvenido/a a la Plataforma!',
      react: WelcomeUserEmail({
        name: name,
        email: email,
        password: password,
        loginUrl: `${process.env.NEXTAUTH_URL}/auth/signin`,
        supportEmail: 'soporte@example.com',
      }),
    });
    console.log(`Correo enviado exitosamente a: ${email}`);
  } catch (emailError) {
    console.error(`Error enviando correo a ${email}:`, emailError);
  }
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'No autorizado. Solo los ADMIN pueden realizar esta acción.' },
      { status: 401 }
    );
  }

  const url = new URL(request.url, `https://${request.headers.get('host')}`);
  const isPreview = url.searchParams.get('preview') === 'true';

  // --- MODO PREVISUALIZACIÓN: Leer y validar archivo Excel ---
  if (isPreview) {
    let filePath = '';
    try {
      const data = await request.formData();
      const file = data.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No se subió ningún archivo.' }, { status: 400 });
      }
      if (!file.name.endsWith('.xlsx')) {
        return NextResponse.json(
          { error: 'Tipo de archivo no válido. Se requiere un archivo Excel (.xlsx).' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // Guardar en directorio temporal del sistema
      const filename = `${session.user.id}_${Date.now()}.xlsx`;
      const tempDir = tmpdir();
      const uploadsDir = path.join(tempDir, 'gestion-asistencias-uploads');

      // Asegurarse de que el directorio exista
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        console.error('Error al crear directorio temporal:', error);
        throw new Error('No se pudo crear el directorio temporal para el archivo');
      }

      filePath = path.join(uploadsDir, filename);
      console.log(`Guardando archivo temporal en: ${filePath}`);

      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

      const previewResults: PreviewResult[] = [];

      const allUsers = await db.user.findMany({
        select: { document: true, correoPersonal: true },
      });
      const existingDocuments = new Set(allUsers.map(u => u.document));
      const existingEmails = new Set(allUsers.map(u => u.correoPersonal));

      // Set para detectar duplicados en el mismo archivo
      const processedDocuments = new Set<string>();
      const processedEmails = new Set<string>();

      for (const row of rows) {
        // Mapeo flexible de cabeceras
        const mappedRow = {
          name: row.name || row.Name || row.nombre || row.Nombre,
          document: row.document || row.Document || row.documento || row.Documento,
          correoPersonal: row.correoPersonal || row['Correo Personal'] || row.correo || row.Correo,
          correoInstitucional:
            row.correoInstitucional ||
            row['Correo Institucional'] ||
            row['CorreoInstitucional'] ||
            row.correoInstitucional,
          password: row.password || row.Password || row.contraseña || row.Contraseña,
          role: row.role || row.Role || row.rol || row.Rol,
        };

        const userData: UserData = {
          name: (mappedRow.name as string)?.trim() || '',
          document: String(mappedRow.document || '').trim(),
          correoPersonal: (mappedRow.correoPersonal as string)?.trim() || '',
          correoInstitucional: (mappedRow.correoInstitucional as string)?.trim() || undefined,
          password: (mappedRow.password as string)?.trim() || '',
          role: ((mappedRow.role as string) || '').trim().toUpperCase(),
        };

        if (!userData.name || !userData.document || !userData.correoPersonal || !userData.role) {
          previewResults.push({
            data: userData,
            status: 'error',
            message: 'Faltan campos requeridos (nombre, documento, correo, rol).',
          });
          continue;
        }

        if (!Object.values(Role).includes(userData.role as Role)) {
          previewResults.push({
            data: userData,
            status: 'error',
            message: `Rol '${userData.role}' no es válido.`,
          });
          continue;
        }

        // Verificar duplicados en el archivo
        if (
          processedDocuments.has(userData.document) ||
          processedEmails.has(userData.correoPersonal)
        ) {
          previewResults.push({
            data: userData,
            status: 'error',
            message: 'Documento o correo duplicado en el archivo.',
          });
          continue;
        }

        // Verificar si existe en la base de datos
        if (
          existingDocuments.has(userData.document) ||
          existingEmails.has(userData.correoPersonal)
        ) {
          previewResults.push({
            data: userData,
            status: 'warning',
            message: 'Usuario ya existe con este documento o correo. Será omitido.',
          });
          continue;
        }

        // Agregar a los sets de procesados
        processedDocuments.add(userData.document);
        processedEmails.add(userData.correoPersonal);

        // Si pasa todas las validaciones
        previewResults.push({
          data: userData,
          status: 'success',
          message: 'Datos válidos y listos para ser creados.',
        });
      }

      return NextResponse.json(previewResults);
    } catch (err) {
      console.error('Error procesando el archivo:', err);
      return NextResponse.json(
        {
          error: 'Error procesando el archivo',
          message: err instanceof Error ? err.message : 'Error desconocido',
        },
        { status: 500 }
      );
    } finally {
      if (filePath) {
        try {
          // Check if file exists before trying to delete it
          try {
            await fs.access(filePath);
            await fs.unlink(filePath);
            console.log(`Archivo temporal eliminado: ${filePath}`);
          } catch (error) {
            if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
              // Only log if it's not a "file not found" error
              console.error('Error al limpiar archivo temporal:', error);
            }
            // If file doesn't exist, no need to do anything
          }
        } catch (error) {
          console.error('Error inesperado al limpiar archivo temporal:', error);
        }
      }
    }
  }

  // --- MODO CREACIÓN: Recibir datos validados y crear usuarios ---
  try {
    const { previewData } = await request.json();
    console.log('Datos recibidos para creación de usuarios:', {
      previewDataLength: previewData?.length,
    });

    if (!Array.isArray(previewData)) {
      console.error('Formato inválido: previewData no es un array', { previewData });
      return NextResponse.json(
        {
          error: 'Formato inválido',
          message: 'El formato de los datos es incorrecto. Se esperaba un array de usuarios.',
        },
        { status: 400 }
      );
    }

    // Filtrar solo los elementos con status 'success' para evitar duplicados
    const validUsers = previewData.filter(item => item.status === 'success');

    console.log(
      `Procesando ${validUsers.length} usuarios válidos de ${previewData.length} totales`
    );

    const finalResults: FinalResult[] = [];
    const validRoles = Object.values(Role);
    const emailQueue: Array<{ email: string; name: string; password: string }> = [];

    // Crear usuarios de forma secuencial para evitar condiciones de carrera
    for (const item of validUsers) {
      const { name, document, correoPersonal, correoInstitucional, role } = item.data || {};

      try {
        // Validar rol
        if (!validRoles.includes(role as Role)) {
          finalResults.push({
            document: document || 'N/A',
            name: name || 'Usuario desconocido',
            status: 'error',
            message: `Rol inválido: '${role}'. Roles válidos: ${validRoles.join(', ')}`,
          });
          continue;
        }

        // Verificar si el usuario ya existe (verificación adicional)
        const existingUser = await db.user.findFirst({
          where: {
            OR: [
              { document },
              { correoPersonal },
              { correoInstitucional: correoInstitucional || correoPersonal },
            ],
          },
          select: {
            id: true,
            document: true,
            correoPersonal: true,
            correoInstitucional: true,
          },
        });

        if (existingUser) {
          let conflictField = 'registro';
          if (existingUser.document === document) {
            conflictField = 'documento';
          } else if (existingUser.correoPersonal === correoPersonal) {
            conflictField = 'correo personal';
          } else if (existingUser.correoInstitucional === (correoInstitucional || correoPersonal)) {
            conflictField = 'correo institucional';
          }

          finalResults.push({
            document: document || 'N/A',
            name: name || 'Usuario desconocido',
            status: 'skipped',
            message: `El ${conflictField} ya está registrado en el sistema.`,
          });
          continue;
        }

        // Generar contraseña segura
        const plainPassword = item.data.password || generatePassword(12);
        const hashedPassword = await bcrypt.hash(plainPassword, 12);

        // Crear usuario (SIN transacción para evitar timeouts)
        const user = await db.user.create({
          data: {
            name,
            document,
            correoPersonal,
            correoInstitucional: correoInstitucional || correoPersonal,
            password: hashedPassword,
            role: role as Role,
            emailVerified: new Date(),
          },
        });

        console.log(`Usuario creado: ${user.id} - ${user.document}`);

        // Agregar email a la cola para envío posterior
        const emailToSend = correoInstitucional || correoPersonal;
        emailQueue.push({
          email: emailToSend,
          name: name,
          password: plainPassword,
        });

        finalResults.push({
          document: document || 'N/A',
          name: name || 'Usuario desconocido',
          status: 'created',
          message: 'Usuario creado exitosamente.',
        });
      } catch (error) {
        console.error(`Error procesando usuario ${document || 'desconocido'}:`, error);

        finalResults.push({
          document: document || 'N/A',
          name: name || 'Usuario desconocido',
          status: 'error',
          message: error instanceof Error ? error.message : 'Error desconocido al crear el usuario',
        });
      }
    }

    // Enviar correos de bienvenida de forma asíncrona (después de crear todos los usuarios)
    console.log(`Enviando ${emailQueue.length} correos de bienvenida...`);

    // Enviar correos en lotes pequeños para no sobrecargar el servidor de email
    const EMAIL_BATCH_SIZE = 3;
    for (let i = 0; i < emailQueue.length; i += EMAIL_BATCH_SIZE) {
      const emailBatch = emailQueue.slice(i, i + EMAIL_BATCH_SIZE);

      // Enviar lote actual sin esperar (fire and forget)
      Promise.all(
        emailBatch.map(({ email, name, password }) => sendWelcomeEmailAsync(email, name, password))
      ).catch(error => {
        console.error('Error en lote de correos:', error);
      });

      // Pequeña pausa entre lotes para evitar rate limiting
      if (i + EMAIL_BATCH_SIZE < emailQueue.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Generar resumen
    const summary = {
      total: finalResults.length,
      created: finalResults.filter(r => r.status === 'created').length,
      skipped: finalResults.filter(r => r.status === 'skipped').length,
      errors: finalResults.filter(r => r.status === 'error').length,
    };

    console.log('Resumen de la operación:', summary);

    return NextResponse.json({
      success: summary.errors === 0,
      results: finalResults,
      summary,
    });
  } catch (error) {
    console.error('Error en el endpoint de creación de usuarios:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar la solicitud',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
