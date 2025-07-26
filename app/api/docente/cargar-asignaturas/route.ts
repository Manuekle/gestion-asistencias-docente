import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Interface for the raw data from the API/Excel file
interface RowData {
  codigoAsignatura: string;
  nombreAsignatura: string;
  'fechaClase (YYYY-MM-DD)': string;
  'horaInicio (HH:MM)': string;
  'horaFin (HH:MM)'?: string;
  temaClase?: string;
  descripcionClase?: string;
  creditosClase?: number;
  programa?: string;
  semestreAsignatura?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const data = await request.formData();
    const file = data.get('file') as File;
    const isPreview = data.get('preview') === 'true';

    if (!file) {
      return new NextResponse('No se encontró el archivo', { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet) as RowData[];

    if (rows.length === 0) {
      return new NextResponse('El archivo Excel está vacío', {
        status: 400,
      });
    }

    const requiredHeaders = [
      'codigoAsignatura',
      'nombreAsignatura',
      'fechaClase (YYYY-MM-DD)',
      'horaInicio (HH:MM)',
      'horaFin (HH:MM)',
      'creditosClase',
      'programa',
      'semestreAsignatura',
    ];
    const headers = Object.keys(rows[0] || {});
    const missingHeaders = requiredHeaders.filter(
      (header) => !headers.includes(header)
    );

    if (missingHeaders.length > 0) {
      return new NextResponse(
        `Faltan los siguientes encabezados requeridos: ${missingHeaders.join(
          ', '
        )}`,
        {
          status: 400,
        }
      );
    }

    const existingSubjects = await db.subject.findMany({
      where: {
        teacherId: session.user.id,
      },
      select: {
        code: true,
      },
    });
    const existingSubjectCodes = new Set(existingSubjects.map((s) => s.code));

    if (isPreview) {
      const previewData = rows.map((row) => {
        try {
          const codigoAsignatura = row['codigoAsignatura']?.toString().trim();
          const nombreAsignatura = row['nombreAsignatura']?.toString().trim();
          const fechaClase = new Date(row['fechaClase (YYYY-MM-DD)']);
          const horaInicio = row['horaInicio (HH:MM)'];
          const horaFin = row['horaFin (HH:MM)'];

          if (
            !codigoAsignatura ||
            !nombreAsignatura ||
            isNaN(fechaClase.getTime()) ||
            !horaInicio ||
            !horaFin
          ) {
            return {
              ...row,
              status: 'error',
              error:
                'Faltan datos requeridos (código, nombre, fecha u hora de inicio).',
            };
          }

          if (existingSubjectCodes.has(codigoAsignatura)) {
            return {
              ...row,
              status: 'error',
              error: `La asignatura con el código ${codigoAsignatura} ya existe.`,
            };
          }

          return {
            codigoAsignatura,
            nombreAsignatura,
            fechaClase: fechaClase.toISOString(),
            horaInicio,
            horaFin,
            creditosClase: row['creditosClase']
              ? Number(row['creditosClase'])
              : null,
            programa: row['programa']?.toString(),
            semestreAsignatura: row['semestreAsignatura']?.toString(),
            temaClase: row['temaClase']?.toString(),
            descripcionClase: row['descripcionClase']?.toString(),
            status: 'success' as const,
          };
        } catch (error) {
          return {
            ...row,
            status: 'error',
            error: error instanceof Error ? error.message : 'Error desconocido',
          };
        }
      });

      return NextResponse.json({ success: true, previewData });
    }

    // Procesar la carga real
    let processed = 0;
    const errors: string[] = [];

    await db.$transaction(async (tx) => {
      for (const row of rows) {
        try {
          const codigoAsignatura = row['codigoAsignatura']?.toString().trim();
          const nombreAsignatura = row['nombreAsignatura']?.toString().trim();
          const fechaClase = new Date(row['fechaClase (YYYY-MM-DD)']);
          const horaInicio = row['horaInicio (HH:MM)'];
          const horaFin = row['horaFin (HH:MM)'];

          if (
            !codigoAsignatura ||
            !nombreAsignatura ||
            isNaN(fechaClase.getTime()) ||
            !horaInicio ||
            !horaFin
          ) {
            continue; // Skip rows with missing essential data
          }

          if (existingSubjectCodes.has(codigoAsignatura)) {
            continue; // Skip duplicate subjects
          }

          const newSubject = await tx.subject.create({
            data: {
              code: codigoAsignatura,
              name: nombreAsignatura,
              credits: row['creditosClase']
                ? Number(row['creditosClase'])
                : 0,
              teacherId: session.user.id,
              program: row['programa']?.toString(),
              semester: row['semestreAsignatura'] ? Number(row['semestreAsignatura']) : 0,
            },
          });

          // Combine date with time strings for proper DateTime
          const startDateTime = new Date(fechaClase);
          const [startH, startM] = horaInicio.split(':');
          startDateTime.setHours(parseInt(startH), parseInt(startM));

          const endDateTime = new Date(fechaClase);
          const [endH, endM] = horaFin.split(':');
          endDateTime.setHours(parseInt(endH), parseInt(endM));

          await tx.class.create({
            data: {
              subjectId: newSubject.id,
              date: fechaClase,
              startTime: startDateTime,
              endTime: endDateTime,
              topic: row['temaClase']?.toString(),
              description: row['descripcionClase']?.toString(),
            },
          });

          processed++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          errors.push(`Fila ${rows.indexOf(row) + 2}: ${errorMessage}`);
        }
      }
    });

    return NextResponse.json({ processed, errors });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Error desconocido en el servidor';
    return new NextResponse(errorMessage, {
      status: 500,
    });
  }
}
