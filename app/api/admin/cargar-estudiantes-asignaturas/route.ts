import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

import fs from 'fs/promises';
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
  estudiantes: (PreviewStudentDetail)[];
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
    const data = await request.formData();
    const file = data.get('file') as File;

    if (!file) {
      return new NextResponse('No se ha subido ningún archivo', {
        status: 400,
      });
    }
    if (!file.name.endsWith('.xlsx')) {
      return new NextResponse('Tipo de archivo no válido, se requiere un Excel (.xlsx)', {
        status: 400,
      });
    }
    if (file.size > 10 * 1024 * 1024) {
      return new NextResponse('El archivo es demasiado grande (máximo 10MB)', {
        status: 400,
      });
    }
    // Guardar temporalmente
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${session.user.id}_${Date.now()}.xlsx`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    filePath = path.join(uploadsDir, filename);
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(filePath, buffer);
    // Leer Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El archivo está vacío o no contiene datos válidos.',
        },
        { status: 400 }
      );
    }
    // Detectar modo preview
    const isPreview = data.get('preview') === 'true';
    // Validar columnas mínimas
    const headers = Object.keys(rows[0]);
    const requiredHeaders = ['codigoAsignatura'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return new NextResponse(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`, {
        status: 400,
      });
    }
        const excelData: RowCargaEstudiantes[] = rows.map((row: ExcelRow) => {
      const estudiantes = String(row.estudiantes || '')
        .split(',')
        .map((e: string) => e.trim())
        .filter(Boolean);
      return { codigoAsignatura: String(row.codigoAsignatura || ''), estudiantes };
    });

    if (isPreview) {
      const previewResults: PreviewRow[] = [];
      for (const row of excelData) {
        const { codigoAsignatura, estudiantes } = row;
        if (!codigoAsignatura || estudiantes.length === 0) {
          previewResults.push({ codigoAsignatura, estudiantes: [], error: 'Faltan datos en la fila' });
          continue;
        }

        const subject = await db.subject.findUnique({ where: { code: codigoAsignatura } });
        if (!subject) {
          previewResults.push({ codigoAsignatura, estudiantes: [], error: 'Asignatura no encontrada' });
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
      return NextResponse.json({ success: true, previewData: previewResults });
    } else {
      // Lógica de carga final
      const resultados: ResultRow[] = [];
      for (const row of excelData) {
        const { codigoAsignatura, estudiantes } = row;
        if (!codigoAsignatura || estudiantes.length === 0) continue;

        const subject = await db.subject.findUnique({ where: { code: codigoAsignatura } });
        if (!subject) {
          resultados.push({ codigoAsignatura, status: 'error', error: 'Asignatura no encontrada' });
          continue;
        }

        const foundStudents = await db.user.findMany({
          where: { document: { in: estudiantes }, role: 'ESTUDIANTE' },
          select: { id: true, document: true },
        });
        
        const currentStudentIds = subject.studentIds || [];
        const validStudentIds = foundStudents.map(s => s.id);
        const newStudentIds = validStudentIds.filter(id => !currentStudentIds.includes(id));

        const invalidDocs = estudiantes.filter(doc => !foundStudents.some(s => s.document === doc));
        let warning = '';
        if (invalidDocs.length > 0) {
          warning += ` Documentos no encontrados: ${invalidDocs.join(', ')}.`;
        }
        const alreadyEnrolledCount = validStudentIds.length - newStudentIds.length;
        if (alreadyEnrolledCount > 0) {
          warning += ` ${alreadyEnrolledCount} estudiante(s) ya estaban inscritos.`;
        }

        if (newStudentIds.length > 0) {
          await db.subject.update({
            where: { id: subject.id },
            data: { studentIds: { set: [...currentStudentIds, ...newStudentIds] } },
          });
          resultados.push({ codigoAsignatura, status: 'updated', updated: true, error: warning.trim() });
        } else {
          resultados.push({ codigoAsignatura, status: 'skipped', error: warning.trim() || 'No se agregaron nuevos estudiantes.' });
        }
      }
      return NextResponse.json({ success: true, resultados });
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
    if (filePath) {
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch {
        // Ignorar si el archivo no existe, no es crítico
      }
    }
  }
}
