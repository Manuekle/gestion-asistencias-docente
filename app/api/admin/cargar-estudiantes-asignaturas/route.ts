import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

import fs from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import * as XLSX from 'xlsx';

interface ExcelRow {
  [key: string]: string | number;
}

interface RowCargaEstudiantes {
  codigoAsignatura: string;
  estudiantes: string[];
}

interface PreviewStudentDetail {
  doc: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

interface PreviewRow {
  codigoAsignatura: string;
  estudiantes: PreviewStudentDetail[];
  error?: string;
}

interface ResultRow {
  codigoAsignatura: string;
  status: 'updated' | 'skipped' | 'error';
  error?: string;
  updated?: boolean;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Validar sesión y rol
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'No autorizado. Solo ADMIN puede realizar esta acción.' },
      { status: 401 }
    );
  }

  let filePath = '';
  try {
    // Parse the URL safely for both client and server-side
    let isPreview = false;
    try {
      // First try to get from search params (client-side)
      const url = new URL(request.url);
      isPreview = url.searchParams.get('preview') === 'true';
    } catch {
      // If that fails, try with a base URL (server-side)
      let baseUrl = process.env.NEXTAUTH_URL || 'https://edutrack-fup.vercel.app';
      // Ensure the URL has a protocol
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `https://${baseUrl}`;
      }
      const url = new URL(request.url, baseUrl);
      isPreview = url.searchParams.get('preview') === 'true';
    }

    const data = await request.formData();
    const file = data.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }
    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido, se requiere un Excel (.xlsx)' },
        {
          status: 400,
        }
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande (máximo 10MB)' },
        {
          status: 400,
        }
      );
    }
    // Guardar en directorio temporal del sistema
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${session.user.id}_${Date.now()}.xlsx`;
    const tempDir = tmpdir();
    const uploadsDir = path.join(tempDir, 'gestion-asistencias-uploads');
    filePath = path.join(uploadsDir, filename);
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    // Leer Excel directamente del buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

    console.log('--- Filas crudas del Excel ---');
    console.log(rows);

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El archivo está vacío o no contiene datos válidos.',
        },
        { status: 400 }
      );
    }
    // Modo preview detectado desde la URL
    // Validar columnas mínimas
    const headers = Object.keys(rows[0]);
    const requiredHeaders = ['codigoAsignatura', 'documentoEstudiante'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `El archivo no tiene el formato correcto. Faltan las columnas: ${missingHeaders.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const excelData: RowCargaEstudiantes[] = rows.map((row: ExcelRow) => {
      const estudiantes = String(row.documentoEstudiante || '')
        .split(',')
        .map((e: string) => e.trim())
        .filter(Boolean);
      return { codigoAsignatura: String(row.codigoAsignatura || ''), estudiantes };
    });
    console.log('--- Datos procesados (excelData) ---');
    console.log(JSON.stringify(excelData, null, 2));

    if (isPreview) {
      const previewResults: PreviewRow[] = [];
      for (const row of excelData) {
        const { codigoAsignatura, estudiantes } = row;
        if (!codigoAsignatura || estudiantes.length === 0) {
          previewResults.push({
            codigoAsignatura,
            estudiantes: [],
            error: 'Faltan datos en la fila',
          });
          continue;
        }

        const subject = await db.subject.findUnique({ where: { code: codigoAsignatura } });
        if (!subject) {
          previewResults.push({
            codigoAsignatura,
            estudiantes: [],
            error: 'Asignatura no encontrada',
          });
          continue;
        }

        const foundStudents = await db.user.findMany({
          where: { document: { in: estudiantes }, role: 'ESTUDIANTE' },
          select: { id: true, document: true },
        });

        const previewDetails = estudiantes.map((doc): PreviewStudentDetail => {
          const student = foundStudents.find(s => s.document === doc);
          if (!student) {
            return { doc, status: 'error', message: 'Estudiante no existe' };
          }
          if (subject.studentIds.includes(student.id)) {
            return { doc, status: 'warning', message: 'Ya inscrito' };
          }
          return { doc, status: 'success', message: 'Listo para inscribir' };
        });

        previewResults.push({ codigoAsignatura, estudiantes: previewDetails });
      }
      console.log('--- Vista previa final (previewResults) ---');
      console.log(JSON.stringify(previewResults, null, 2));
      return NextResponse.json({ success: true, previewData: previewResults });
    } else {
      // --- Lógica de Carga Final ---
      const resultados: ResultRow[] = [];
      const { previewData } = (await request.json()) as { previewData: PreviewRow[] };

      if (!Array.isArray(previewData)) {
        return NextResponse.json(
          { success: false, message: 'Formato de datos inválido.' },
          { status: 400 }
        );
      }

      for (const row of previewData) {
        const { codigoAsignatura } = row;

        // Asegurarse de que row.estudiantes es un array antes de usarlo
        const estudiantesDetails = Array.isArray(row.estudiantes) ? row.estudiantes : [];

        if (!codigoAsignatura || row.error) {
          resultados.push({ codigoAsignatura, status: 'skipped', error: row.error });
          continue;
        }

        const subject = await db.subject.findUnique({ where: { code: codigoAsignatura } });
        if (!subject) {
          resultados.push({ codigoAsignatura, status: 'error', error: 'Asignatura no encontrada' });
          continue;
        }

        const studentDocsToUpdate = estudiantesDetails
          .filter(e => e.status === 'success')
          .map(e => e.doc);

        if (studentDocsToUpdate.length === 0) {
          resultados.push({ codigoAsignatura, status: 'skipped' });
          continue;
        }

        const foundStudents = await db.user.findMany({
          where: { document: { in: studentDocsToUpdate }, role: 'ESTUDIANTE' },
          select: { id: true },
        });

        const newStudentIds = foundStudents.map(s => s.id);
        const currentStudentIds = subject.studentIds || [];
        const finalStudentIds = [...new Set([...currentStudentIds, ...newStudentIds])];

        if (finalStudentIds.length > currentStudentIds.length) {
          await db.subject.update({
            where: { id: subject.id },
            data: { studentIds: { set: finalStudentIds } },
          });
          resultados.push({ codigoAsignatura, status: 'updated', updated: true });
        } else {
          resultados.push({ codigoAsignatura, status: 'skipped' });
        }
      }
      const errors: { codigoAsignatura: string; message: string }[] = [];
      return NextResponse.json({
        success: true,
        message: 'Carga completada.',
        resultados,
        errors,
        totalRows: excelData.length,
      });
    }
  } catch (error) {
    console.error('Error en la carga de estudiantes:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Ocurrió un error desconocido',
      },
      { status: 500 }
    );
  } finally {
    // Limpiar archivos temporales si existen
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (e) {
        console.error('Error al eliminar archivo temporal', e);
      }
    }
  }
}
