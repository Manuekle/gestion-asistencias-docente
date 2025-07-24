'use client';

import { useEffect, useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
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
import { AlertCircle, BarChart3, BookOpen, CheckCircle2, Clock, Info, XCircle } from 'lucide-react';

interface ClassAttendance {
  classId: string;
  classDate: string;
  classTopic: string | null;
  status: string;
}

interface SubjectReport {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  attendances: ClassAttendance[];
  summary: {
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    justifiedCount: number;
    attendancePercentage: number;
  };
}

interface AttendanceReportData {
  summary: {
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    justifiedCount: number;
    attendancePercentage: number;
  };
  bySubject: SubjectReport[];
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PRESENTE':
      return <Badge variant="success">Presente</Badge>;
    case 'AUSENTE':
      return <Badge variant="destructive">Ausente</Badge>;
    case 'TARDANZA':
      return <Badge variant="warning">Tardanza</Badge>;
    case 'JUSTIFICADO':
      return <Badge variant="info">Justificado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getProgressBarColor = (percentage: number) => {
  if (percentage >= 80) return 'bg-success';
  if (percentage >= 60) return 'bg-warning';
  return 'bg-destructive';
};

const AttendanceReportPage = () => {
  const [reportData, setReportData] = useState<AttendanceReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/estudiante/reportes/asistencia');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const responseData = await response.json();
        setReportData(responseData.data);
      } catch (err) {
        setError(
          'No se pudo cargar el reporte de asistencia. Por favor, inténtalo de nuevo más tarde.'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  if (loading) {
    return <LoadingPage />;
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

  if (!reportData || reportData.summary.totalClasses === 0) {
    return (
      <div className="p-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Sin Datos</AlertTitle>
          <AlertDescription>Aún no tienes registros de asistencia para mostrar.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-semibold">Mi Reporte de Asistencia</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal">Clases Totales</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{reportData.summary.totalClasses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal">Presente</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{reportData.summary.presentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal">Ausente</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{reportData.summary.absentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal">Tardanzas</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{reportData.summary.lateCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal">Justificadas</CardTitle>
            <Info className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{reportData.summary.justifiedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Progreso General de Asistencia</h2>
        <div className="w-full bg-muted rounded-full h-4">
          <div
            className={`h-4 rounded-full ${getProgressBarColor(reportData.summary.attendancePercentage)}`}
            style={{ width: `${reportData.summary.attendancePercentage}%` }}
          ></div>
        </div>
        <p className="text-right text-sm font-normal mt-1">
          {reportData.summary.attendancePercentage}%
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {reportData.bySubject.map(subject => (
          <AccordionItem value={subject.subjectId} key={subject.subjectId}>
            <AccordionTrigger>
              <div className="flex justify-between w-full pr-4 items-center">
                <span className="font-semibold text-lg">
                  {subject.subjectName} ({subject.subjectCode})
                </span>
                <Badge
                  variant={subject.summary.attendancePercentage >= 80 ? 'default' : 'destructive'}
                >
                  {subject.summary.attendancePercentage}% Asistencia
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-1">
              <div className="p-4 border rounded-md bg-muted/50 overflow-x-auto">
                <h3 className="text-xl font-semibold mb-4">Detalle de Asistencia</h3>
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Fecha de Clase</TableHead>
                      <TableHead>Tema</TableHead>
                      <TableHead className="text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subject.attendances.map(att => (
                      <TableRow key={att.classId}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(att.classDate), 'PPP', {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell>{att.classTopic || 'N/A'}</TableCell>
                        <TableCell className="text-right">{getStatusBadge(att.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default AttendanceReportPage;
