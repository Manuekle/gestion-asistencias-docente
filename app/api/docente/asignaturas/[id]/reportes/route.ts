import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { z } from 'zod';
import { generateAttendanceReportPDF } from '@/lib/generar-reporte-docente';

// Esquema de validación para la creación de un reporte
const createReportSchema = z.object({
  format: z.enum(['PDF', 'CSV']).optional().default('PDF'),
});

/**
 * GET /api/docente/asignaturas/[id]/reportes
 * Obtiene el historial de reportes generados para una asignatura.
 */
export async function GET(request: Request, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const subjectId = context.params.id;

  try {
    // Verificar que la asignatura pertenece al docente
    const subject = await db.subject.findFirst({
      where: {
        id: subjectId,
        teacherId: session.user.id,
      },
    });

    if (!subject) {
      return NextResponse.json({ error: 'Asignatura no encontrada o no pertenece al docente' }, {
        status: 404,
      });
    }

    const reports = await db.report.findMany({
      where: {
        subjectId: subjectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('[REPORTS_GET]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/docente/asignaturas/[id]/reportes
 * Inicia la generación de un nuevo reporte para una asignatura.
 */
export async function POST(request: Request, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const subjectId = context.params.id;

  try {
    const body = await request.json();
    const { format } = createReportSchema.parse(body);

    // Verificar que la asignatura pertenece al docente
    const subject = await db.subject.findFirst({
      where: {
        id: subjectId,
        teacherId: session.user.id,
      },
    });

    if (!subject) {
      return NextResponse.json({ error: 'Asignatura no encontrada o no pertenece al docente' }, {
        status: 404,
      });
    }

    // Crear el registro del reporte en la base de datos
    const newReport = await db.report.create({
      data: {
        subjectId: subjectId,
        requestedById: session.user.id,
        status: 'PENDIENTE', // El estado inicial es pendiente
        format: format,
        fileName: `Reporte_${subject.code}_${new Date().toISOString()}.pdf`,
      },
    });

    // Invocar la generación del PDF en segundo plano (sin await)
    generateAttendanceReportPDF(subjectId, newReport.id);

    return NextResponse.json(newReport, { status: 202 }); // 202 Accepted: La solicitud ha sido aceptada para procesamiento
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    console.error('[REPORTS_POST]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
