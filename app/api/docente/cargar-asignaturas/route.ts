import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
// No longer need writeFile as we're using fs.writeFile
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import path from 'path';
import * as XLSX from 'xlsx';
import fs from 'fs/promises';

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

// Using Prisma's generated types
import { Subject } from '@prisma/client';

type SubjectWithCode = Subject & { code: string };

interface UploadResult {
  asignaturas: Subject[];
  processedRows: number;
  totalRows: number;
  errors: string[];
}

/**
 * POST /api/docente/cargar-asignaturas
 * Carga masiva de asignaturas y clases desde un archivo Excel.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCENTE') {
    return new NextResponse('No autorizado', { status: 401 });
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

    // Validar tipo de archivo
    if (!file.name.endsWith('.xlsx')) {
      return new NextResponse('Tipo de archivo no válido, se requiere un Excel (.xlsx)', {
        status: 400,
      });
    }

    // Validar tamaño del archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new NextResponse('El archivo es demasiado grande (máximo 10MB)', {
        status: 400,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${session.user.id}_${Date.now()}.xlsx`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    filePath = path.join(uploadsDir, filename);

    // Crear directorio de uploads si no existe
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    // Leer Excel directamente del buffer en lugar del archivo
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet) as RowData[];

    if (rows.length === 0) {
      return new NextResponse('El archivo Excel está vacío', {
        status: 400,
      });
    }

    // Validar encabezados requeridos
    const isPreview = data.get('preview') === 'true';
    
    // Validar que el archivo no esté vacío
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'El archivo está vacío o no contiene datos válidos.'
      }, { status: 400 });
    }
    const requiredHeaders = [
      'codigoAsignatura', 
      'nombreAsignatura', 
      'fechaClase (YYYY-MM-DD)', 
      'horaInicio (HH:MM)',
      'horaFin (HH:MM)',
      'creditosClase',
      'programa',
      'semestreAsignatura'
    ];
    const headers = Object.keys(rows[0]);
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

    if (missingHeaders.length > 0) {
      return new NextResponse(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`, {
        status: 400,
      });
    }

    const asignaturasMap = new Map<string, SubjectWithCode>();
    const processedRows: RowData[] = [];
    const errors: string[] = [];

    // Procesar en transacción
    if (isPreview) {
      // Solo validar los datos sin guardar
      const previewData = rows.map((row) => {
        try {
          const codigo = row['codigoAsignatura']?.toString().trim();
          const nombre = row['nombreAsignatura']?.toString().trim();
          const fechaClase = new Date(row['fechaClase (YYYY-MM-DD)']);
          const horaInicio = row['horaInicio (HH:MM)'];
          const horaFin = row['horaFin (HH:MM)'];
          
          if (!codigo || !nombre || isNaN(fechaClase.getTime()) || !horaInicio || !horaFin) {
            throw new Error('Datos requeridos faltantes');
          }

          return {
            codigoAsignatura: codigo,
            nombreAsignatura: nombre,
            fechaClase: fechaClase.toISOString(),
            horaInicio,
            horaFin,
            creditosClase: row['creditosClase'] ? Number(row['creditosClase']) : null,
            programa: row['programa']?.toString(),
            semestreAsignatura: row['semestreAsignatura']?.toString(),
            status: 'success' as const,
          };
        } catch (error) {
          return {
            codigoAsignatura: row['codigoAsignatura']?.toString() || '',
            nombreAsignatura: row['nombreAsignatura']?.toString() || '',
            fechaClase: row['fechaClase (YYYY-MM-DD)']?.toString() || '',
            horaInicio: row['horaInicio (HH:MM)']?.toString() || '',
            horaFin: row['horaFin (HH:MM)']?.toString() || '',
            creditosClase: row['creditosClase'] ? Number(row['creditosClase']) : null,
            programa: row['programa']?.toString(),
            semestreAsignatura: row['semestreAsignatura']?.toString(),
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Error desconocido',
          };
        }
      });

      return NextResponse.json({ 
        success: true, 
        previewData 
      });
    }

    // Procesar la carga real
    const result = await db.$transaction(async (tx) => {
      let rowIndex = 0;
      for (const row of rows) {
        try {
          const codigo = row['codigoAsignatura']?.toString().trim();
          const nombre = row['nombreAsignatura']?.toString().trim();
          const fechaClase = new Date(row['fechaClase (YYYY-MM-DD)']);
          const horaInicio = row['horaInicio (HH:MM)'];
          const horaFin = row['horaFin (HH:MM)'];
          const tema = row['temaClase']?.toString();
          const descripcion = row['descripcionClase']?.toString();
          const creditos = row['creditosClase'] ? Number(row['creditosClase']) : null;
          const programa = row['programa']?.toString() || null;
          const semestre = row['semestreAsignatura']?.toString() || null;

          rowIndex++;
          
          // Validar datos
          if (!codigo || !nombre || isNaN(fechaClase.getTime()) || !horaInicio) {
            errors.push(`Fila ${rowIndex}: Datos requeridos faltantes (código, nombre, fecha u hora de inicio)`);
            continue;
          }

          // Convert semester to number if it exists
          const semesterNumber = semestre ? parseInt(semestre, 10) : null;
          
          // Ensure the subject exists or create it
          const asignatura = await tx.subject.upsert({
            where: { code: codigo },
            update: {
              name: nombre,
              credits: creditos,
              program: programa,
              semester: semesterNumber,
              teacher: { connect: { id: session.user.id } },
            },
            create: {
              code: codigo,
              name: nombre,
              credits: creditos,
              program: programa,
              semester: semesterNumber,
              teacher: { connect: { id: session.user.id } },
              studentIds: [],
            },
          });
          
          // Store in map for future reference with the code included
          asignaturasMap.set(codigo, { ...asignatura, code: codigo });

          const startTime = new Date(`${row['fechaClase (YYYY-MM-DD)']}T${horaInicio}`);
          const endTime = horaFin ? new Date(`${row['fechaClase (YYYY-MM-DD)']}T${horaFin}`) : null;

          // Validar horarios
          if (endTime && startTime >= endTime) {
            errors.push(`Horario inválido: inicio=${horaInicio}, fin=${horaFin}`);
            continue;
          }

          if (!endTime) {
            errors.push(`Fila ${rowIndex}: Hora de fin no especificada`);
            continue;
          }

          if (startTime >= endTime) {
            errors.push(`Fila ${rowIndex}: La hora de inicio debe ser anterior a la hora de fin`);
            continue;
          }

          // Only create class if there are no errors
          if (errors.length === 0) {
            await tx.class.create({
              data: {
                subject: { connect: { id: asignatura.id } },
                date: startTime,
                endTime: endTime,
                topic: tema || null,
                description: descripcion || null,
              },
            });
          }

          processedRows.push(row);
        } catch (err) {
          errors.push(`Error procesando fila: ${(err as Error).message}`);
        }
      }

      return {
        asignaturas: Array.from(asignaturasMap.values()),
        processedRows: processedRows.length,
        totalRows: rows.length,
        errors,
      } as UploadResult;
    });

    return NextResponse.json({
      message: 'Carga completada',
      result,
      success: errors.length === 0,
    });

  } catch (error) {
    console.error('Error en la carga:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error en la carga',
    }, { status: 500 });
  } finally {
    // Limpiar archivo temporal si existe
    if (filePath) {
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch (err) {
        // Ignorar si el archivo no existe
        const fsError = err as NodeJS.ErrnoException;
        if (fsError.code !== 'ENOENT') {
          console.error('Error al eliminar archivo temporal:', err);
        }
      }
    }
  }
}
