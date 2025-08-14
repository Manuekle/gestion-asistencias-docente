import { authOptions } from '@/lib/auth';
import { generateAttendanceReportPDF } from '@/lib/generar-reporte-docente';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST({ params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const reportId = params.id;

    // Verificar que el reporte existe y pertenece al docente
    const report = await db.report.findUnique({
      where: {
        id: reportId,
        subject: {
          teacherId: session.user.id,
        },
      },
      include: {
        subject: true,
      },
    });

    if (!report) {
      return new NextResponse('Reporte no encontrado', { status: 404 });
    }

    // Actualizar el estado del reporte a PENDIENTE
    const updatedReport = await db.report.update({
      where: { id: reportId },
      data: {
        status: 'PENDIENTE',
        error: null,
        fileUrl: null,
        fileName: null,
      },
      include: {
        subject: true,
      },
    });

    // Iniciar la generación del reporte en segundo plano
    generateAttendanceReportPDF(report.subjectId, reportId)
      .then(() => console.log(`Report ${reportId} regenerated successfully`))
      .catch(error => {
        console.error(`Error regenerating report ${reportId}:`, error);
        db.report.update({
          where: { id: reportId },
          data: {
            status: 'FALLIDO',
            error: error.message || 'Error al regenerar el reporte',
          },
        });
      });

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Error en el endpoint de reintento de reporte:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
