'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Interfaz para el objeto Reporte, coincidiendo con el modelo de Prisma
interface Report {
  id: string;
  status: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'FALLIDO';
  format: 'pdf' | 'csv';
  fileUrl: string | null;
  fileName: string | null;
  error: string | null;
  createdAt: string;
}

const ReportStatusBadge = ({ status }: { status: Report['status'] }) => {
  const statusConfig = {
    PENDIENTE: {
      variant: 'secondary',
      text: 'Pendiente',
    },
    EN_PROCESO: {
      variant: 'default',
      text: 'Procesando',
    },
    COMPLETADO: {
      variant: 'success',
      text: 'Completado',
    },
    FALLIDO: {
      variant: 'destructive',
      text: 'Fallido',
    },
  };

  const { variant, text } = statusConfig[status] || statusConfig.PENDIENTE;

  // Define a type that matches the expected variant values for the Badge component
  type BadgeVariant =
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'info';

  return (
    <Badge
      variant={variant as BadgeVariant}
      className="flex items-center gap-1.5 whitespace-nowrap w-1/2"
    >
      <span className="text-xs font-normal">{text}</span>
    </Badge>
  );
};

const SubjectReportPage = () => {
  const params = useParams();
  const subjectId = params.id as string;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!subjectId) return;
    try {
      const response = await fetch(`/api/docente/asignaturas/${subjectId}/reportes`);
      if (!response.ok) {
        throw new Error('No se pudo cargar el historial de reportes.');
      }
      const data: Report[] = await response.json();
      setReports(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los reportes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Polling para actualizar el estado de los reportes en proceso
  useEffect(() => {
    const hasPendingReports = reports.some(
      r => r.status === 'PENDIENTE' || r.status === 'EN_PROCESO'
    );
    if (!hasPendingReports) return;

    const interval = setInterval(() => {
      fetchReports();
    }, 5000); // Refresca cada 5 segundos

    return () => clearInterval(interval);
  }, [reports, fetchReports]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    toast.info('Iniciando la generación del reporte...');
    try {
      const response = await fetch(`/api/docente/asignaturas/${subjectId}/reportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'PDF' }),
      });

      if (response.status !== 202) {
        throw new Error('El servidor no pudo iniciar la generación del reporte.');
      }

      toast.success('Solicitud de reporte enviada. Aparecerá en el historial en breve.');
      await fetchReports(); // Actualizar la lista inmediatamente
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ocurrió un error al generar el reporte';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (report: Report) => {
    if (!report.fileUrl || !report.fileName) {
      toast.error('La URL o el nombre del archivo no están disponibles.');
      return;
    }

    setDownloadingReportId(report.id);
    toast.info('Iniciando la descarga...');

    try {
      const response = await fetch(report.fileUrl);
      if (!response.ok) {
        throw new Error(`Error al descargar el archivo: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Descarga completada.');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ocurrió un error al descargar el reporte';
      toast.error(errorMessage);
    } finally {
      setDownloadingReportId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <CardHeader className="p-0 w-full">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Gestión de Reportes de Asistencia
          </CardTitle>
          <CardDescription className="text-xs">
            Genera y descarga los reportes de asistencia de la asignatura.
          </CardDescription>
        </CardHeader>
        <Button onClick={handleGenerateReport} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Generar Reporte</>}
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs tracking-tight font-normal px-4 py-2">
                Fecha de Solicitud
              </TableHead>
              <TableHead className="text-xs tracking-tight font-normal px-4 py-2">
                Formato
              </TableHead>
              <TableHead className="text-xs tracking-tight font-normal px-4 py-2">Estado</TableHead>
              <TableHead className="text-right text-xs tracking-tight font-normal px-4 py-2">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Aún no se ha generado ningún reporte.
                </TableCell>
              </TableRow>
            ) : (
              reports.map(report => (
                <TableRow key={report.id}>
                  <TableCell className="text-sm px-4 py-2">
                    {format(new Date(report.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell className="text-sm px-4 py-2">
                    <Badge variant="outline" className="text-xs font-normal lowercase">
                      {report.format}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm py-2 font-normal">
                    <ReportStatusBadge status={report.status} />
                  </TableCell>
                  <TableCell className="text-right text-sm py-2">
                    {report.status === 'COMPLETADO' && report.fileUrl ? (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(report)}
                        disabled={downloadingReportId === report.id}
                      >
                        {downloadingReportId === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Descargar'
                        )}
                      </Button>
                    ) : report.status === 'FALLIDO' ? (
                      <span className="text-xs text-destructive">
                        {report.error || 'Error desconocido'}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No disponible</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SubjectReportPage;
