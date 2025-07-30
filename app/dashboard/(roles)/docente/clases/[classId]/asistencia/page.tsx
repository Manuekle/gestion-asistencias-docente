'use client';

import { QRViewer } from '@/components/QRViewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, QrCode } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Define los estados de asistencia como un mapa para la UI
const AttendanceStatusMap = {
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  TARDANZA: 'Tardanza',
  JUSTIFICADO: 'Justificado',
} as const;

// Tipos derivados del mapa
type AttendanceStatusKey = keyof typeof AttendanceStatusMap;

// Define el tipo para los datos que esperamos de la API
type StudentAttendance = {
  studentId: string;
  name: string;
  email: string;
  status: AttendanceStatusKey; // La API devuelve la clave en mayúsculas
};

type ClassInfo = {
  id: string;
  date: string;
  endTime?: string; // La hora de fin es opcional
  topic: string;
  subject: {
    name: string;
  };
};

export default function AttendancePage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClassPast, setIsClassPast] = useState(false);

  const [qrData, setQrData] = useState<{
    qrUrl: string;
    qrToken: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!classId) return;

    if (!qrData) setIsLoading(true);
    setError(null);
    try {
      const [classRes, attendanceRes] = await Promise.all([
        fetch(`/api/docente/clases/${classId}`),
        fetch(`/api/docente/clases/${classId}/asistencia`),
      ]);

      if (!classRes.ok) throw new Error('No se pudieron cargar los detalles de la clase.');
      const classResponse = await classRes.json();
      const classData: ClassInfo = classResponse.data; // Corregido: usar response.data
      setClassInfo(classData);

      // Comprobar si la clase ya ha finalizado
      const now = new Date();
      const classEndDate = classData.endTime
        ? new Date(classData.endTime)
        : new Date(new Date(classData.date).getTime() + 2 * 60 * 60 * 1000); // Asumir 2h si no hay hora de fin
      setIsClassPast(now > classEndDate);

      if (!attendanceRes.ok) throw new Error('No se pudo cargar la lista de asistencia.');
      const attendanceResponse = await attendanceRes.json();
      setStudents(attendanceResponse.data); // Corregido: usar response.data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los datos de la clase';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [classId, qrData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (expiresIn === null) return;

    if (expiresIn <= 0) {
      setQrData(null);
      setExpiresIn(null);
      toast.info('El código QR ha expirado.');
      fetchData();
      return;
    }

    const timer = setInterval(() => {
      setExpiresIn(prev => (prev ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresIn, fetchData]);

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatusKey) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.studentId === studentId ? { ...student, status: newStatus } : student
      )
    );
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/docente/clases/${classId}/asistencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendances: students.map(({ studentId, status }) => ({
            studentId,
            status,
          })),
        }),
      });

      if (!response.ok) throw new Error('Error al guardar la asistencia.');

      toast.success('Asistencia guardada con éxito.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateQr = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/docente/clases/${classId}/generar-qr`, {
        method: 'POST',
      });
      const responseData = await response.json();

      if (!response.ok) throw new Error(responseData.message || 'Error al generar el código QR.');

      setQrData(responseData.data); // Corregido: usar response.data
      setExpiresIn(300); // 5 minutos en segundos
      toast.success('Código QR generado. Los estudiantes ya pueden escanear.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <p>{error}</p>
        <Button onClick={() => router.back()} variant="outline" className="ml-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-semibold text-2xl tracking-heading">
                Toma de Asistencia
              </CardTitle>
              {classInfo && (
                <CardDescription className="mt-1">
                  {classInfo.subject.name} -{' '}
                  {new Date(classInfo.date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  <br />
                  Tema: {classInfo.topic}
                </CardDescription>
              )}
            </div>
            {isClassPast && (
              <Badge variant="outline" className="text-xs font-normal">
                Realizada
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {qrData && expiresIn !== null ? (
            <QRViewer
              qrUrl={qrData.qrUrl}
              qrToken={qrData.qrToken}
              expiresIn={expiresIn}
              onRefresh={handleGenerateQr}
              onClose={() => {
                setQrData(null);
                setExpiresIn(null);
                fetchData();
              }}
              isRefreshing={isGenerating}
            />
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <Button onClick={handleGenerateQr} disabled={isGenerating || isClassPast} size="lg">
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="mr-2 h-4 w-4" />
                  )}
                  Generar QR
                </Button>
              </div>

              <div className="space-y-4">
                {students.map(student => (
                  <div
                    key={student.studentId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium tracking-card text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                    <Select
                      value={student.status} // e.g., 'PRESENTE'
                      onValueChange={(value: AttendanceStatusKey) =>
                        handleStatusChange(student.studentId, value)
                      }
                      disabled={isClassPast}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AttendanceStatusMap).map(([key, value]) => (
                          <SelectItem
                            key={key}
                            value={key}
                            className="font-sans text-xs font-medium"
                          >
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveChanges} disabled={isSaving || isClassPast}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
