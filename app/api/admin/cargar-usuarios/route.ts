import { WelcomeUserEmail } from '@/app/emails/WelcomeUserEmail';
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
      filePath = path.join(uploadsDir, filename);

      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

      console.log('Filas leídas del Excel:', JSON.stringify(rows, null, 2));

      const previewResults: PreviewResult[] = [];

      const allUsers = await db.user.findMany({
        select: { document: true, correoPersonal: true },
      });
      const existingDocuments = new Set(allUsers.map(u => u.document));
      const existingEmails = new Set(allUsers.map(u => u.correoPersonal));

      for (const row of rows) {
        // Mapeo flexible de cabeceras
        const mappedRow = {
          name: row.name || row.Name || row.nombre || row.Nombre,
          document: row.document || row.Document || row.documento || row.Documento,
          correoPersonal: row.correoPersonal || row['Correo Personal'] || row.correo || row.Correo,
          password: row.password || row.Password || row.contraseña || row.Contraseña,
          role: row.role || row.Role || row.rol || row.Rol,
        };

        const userData: UserData = {
          name: (mappedRow.name as string)?.trim() || '',
          document: String(mappedRow.document || '').trim(),
          correoPersonal: (mappedRow.correoPersonal as string)?.trim() || '',
          password: (mappedRow.password as string)?.trim() || '',
          role: ((mappedRow.role as string) || '').trim().toUpperCase(),
        };

        if (!userData.name || !userData.document || !userData.correoPersonal || !userData.role) {
          previewResults.push({
            data: userData, // Dejamos los datos para que el usuario vea qué está mal
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

        // Si pasa todas las validaciones
        previewResults.push({
          data: userData,
          status: 'success',
          message: 'Datos válidos y listos para ser creados.',
        });
      }

      return NextResponse.json(previewResults);
    } catch (error) {
      console.error('Error en la previsualización de carga de usuarios:', error);
      return NextResponse.json({ error: 'Error procesando el archivo.' }, { status: 500 });
    } finally {
      if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch (e) {
          console.error('Error al eliminar archivo temporal', e);
        }
      }
    }
  }

  // --- MODO CREACIÓN: Recibir datos validados y crear usuarios ---
  try {
    const { previewData } = await request.json();

    if (!Array.isArray(previewData)) {
      return NextResponse.json(
        { error: 'Formato inválido: `previewData` debe ser un array.' },
        { status: 400 }
      );
    }

    const finalResults: FinalResult[] = [];

    for (const item of previewData) {
      // Solo procesar los que fueron validados como 'success'
      if (item.status !== 'success') {
        finalResults.push({
          document: item.data.document,
          name: item.data.name,
          status: 'skipped',
          message: `Omitido por estado de previsualización: ${item.status}.`,
        });
        continue;
      }

      const { name, document, correoPersonal, role, password: providedPassword } = item.data;

      try {
        // Doble chequeo por si acaso
        const existingUser = await db.user.findFirst({
          where: { OR: [{ document }, { correoPersonal }] },
        });

        if (existingUser) {
          finalResults.push({
            document,
            name,
            status: 'skipped',
            message: 'Usuario ya existe (verificación final).',
          });
          continue;
        }

        const plainPassword = providedPassword || generatePassword(10);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        await db.user.create({
          data: {
            name,
            document,
            correoPersonal,
            password: hashedPassword,
            role: role as Role,
            emailVerified: new Date(), // Se marca como verificado ya que lo crea un ADMIN
          },
        });

        // Enviar correo de bienvenida
        await sendEmail({
          to: correoPersonal,
          subject: '¡Bienvenido/a a la Plataforma!',
          react: WelcomeUserEmail({
            name: name,
            email: correoPersonal,
            password: plainPassword,
            loginUrl: `${process.env.NEXTAUTH_URL}/auth/signin`,
            supportEmail: 'soporte@example.com',
          }),
        });

        finalResults.push({
          document,
          name,
          status: 'created',
          message: 'Usuario creado y notificado exitosamente.',
        });
      } catch (dbError) {
        console.error(`Error creando al usuario ${name} (${document}):`, dbError);
        finalResults.push({
          document,
          name,
          status: 'error',
          message: 'Error en la base de datos al crear el usuario.',
        });
      }
    }

    return NextResponse.json({ results: finalResults });
  } catch (error) {
    console.error('Error en la creación masiva de usuarios:', error);
    return NextResponse.json(
      { error: 'Error procesando la solicitud de creación.' },
      { status: 500 }
    );
  }
}
