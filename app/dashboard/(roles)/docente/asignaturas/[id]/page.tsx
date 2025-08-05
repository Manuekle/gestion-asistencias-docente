'use client';

import type React from 'react';

import { EventsCard } from '@/components/EventsCard';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Class } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Ban,
  CalendarIcon,
  CheckCircle,
  Clock,
  Edit,
  MoreHorizontal,
  UserCheck,
  UserX,
} from 'lucide-react';
// Removed unused import
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Tipos
type Student = {
  id: string;
  name: string | null;
  correoInstitucional: string | null;
  correoPersonal: string | null;
  document?: string | null;
  telefono?: string | null;
};

type StudentAttendance = {
  id: string;
  name: string | null;
  status: string;
};

// Se definen tipos locales para asegurar que los campos necesarios estén presentes.
// Esto soluciona los errores de TypeScript después de modificar el schema.prisma.
type ClassWithStatus = Class & {
  status: 'PROGRAMADA' | 'REALIZADA' | 'CANCELADA';
  cancellationReason?: string | null;
};
type ClassStatus = ClassWithStatus['status'];

const classStatusMap: Record<ClassStatus, { label: string; color: string }> = {
  PROGRAMADA: {
    label: 'Programada',
    color: 'text-xs font-normal',
  },
  REALIZADA: {
    label: 'Realizada',
    color: 'text-xs font-normal',
  },
  CANCELADA: {
    label: 'Cancelada',
    color: 'text-xs font-normal',
  },
};

export default function SubjectDetailPage() {
  const params = useParams();
  const subjectId = params.id as string;

  // --- STATE MANAGEMENT ---

  // State for Subject
  const [subjectName, setSubjectName] = useState<string>('');
  const [isLoadingSubject, setIsLoadingSubject] = useState(true);

  // State for Classes
  const [classes, setClasses] = useState<ClassWithStatus[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<ClassWithStatus | null>(null);

  const [classDate, setClassDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [classTopic, setClassTopic] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isStartTimePickerOpen, setIsStartTimePickerOpen] = useState(false);
  const [isEndTimePickerOpen, setIsEndTimePickerOpen] = useState(false);

  // State for Students & Attendance
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [unenrollReason, setUnenrollReason] = useState('');

  const [currentStudentForUnenroll, setCurrentStudentForUnenroll] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [classToCancel, setClassToCancel] = useState<ClassWithStatus | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [attendances, setAttendances] = useState<StudentAttendance[]>([]);
  const [isUpdatingAttendance, setIsUpdatingAttendance] = useState<string | null>(null);
  const [popoverStates, setPopoverStates] = useState<Record<string, boolean>>({});

  // Paginación estudiantes
  const [studentPage, setStudentPage] = useState(1);
  const studentsPerPage = 10;
  const totalStudentPages = Math.ceil(enrolledStudents.length / studentsPerPage);
  const paginatedStudents = enrolledStudents.slice(
    (studentPage - 1) * studentsPerPage,
    studentPage * studentsPerPage
  );
  const studentStart = (studentPage - 1) * studentsPerPage + 1;
  const studentEnd = Math.min(studentPage * studentsPerPage, enrolledStudents.length);

  // --- HANDLERS ---
  const handleUpdateClassStatus = async (classId: string, status: ClassStatus, reason?: string) => {
    const originalClasses = [...classes];

    // Optimistic update
    setClasses(prev => prev.map(c => (c.id === classId ? { ...c, status } : c)));

    try {
      const response = await fetch(`/api/docente/clases/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo actualizar el estado de la clase.');
      }

      const responseData = await response.json();
      const updatedClass = responseData.data;

      // Final update with server data
      setClasses(prev => prev.map(c => (c.id === classId ? updatedClass : c)));
      toast.success(`La clase ha sido marcada como ${status.toLowerCase()}.`);
      // Refresh the current page to ensure data is in sync
      fetchClasses(pagination.page, pagination.limit);
    } catch (error) {
      console.error(error);
      // Revert on error
      setClasses(originalClasses);
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado.');
    }
  };

  // --- DATA FETCHING ---
  const fetchClasses = useCallback(
    async (page: number, limit: number) => {
      if (!subjectId) return;

      try {
        setIsLoadingClasses(true);
        const response = await fetch(
          `/api/docente/clases?subjectId=${subjectId}&page=${page}&limit=${limit}&sortBy=date&sortOrder=desc`
        );

        if (!response.ok) {
          throw new Error('Error al cargar las clases');
        }

        const { data, pagination: paginationData } = await response.json();
        setClasses(data);
        setPagination(prev => ({
          ...prev,
          page: paginationData.page,
          limit: paginationData.limit,
          total: paginationData.total,
          totalPages: paginationData.totalPages,
        }));
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Error al cargar las clases');
      } finally {
        setIsLoadingClasses(false);
      }
    },
    [subjectId]
  );

  // Pagination handlers
  const handleClassPageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
        setPagination(prev => ({ ...prev, page: newPage }));
        fetchClasses(newPage, pagination.limit);
      }
    },
    [pagination.totalPages, pagination.limit, fetchClasses]
  );

  // Pagination is handled by handleClassPageChange

  const fetchSubject = useCallback(async () => {
    if (!subjectId) {
      console.error('No se proporcionó un ID de asignatura');
      setSubjectName('Asignatura');
      setIsLoadingSubject(false);
      return;
    }

    try {
      setIsLoadingSubject(true);
      const response = await fetch(`/api/subjects/${subjectId}`);
      if (!response.ok) {
        throw new Error('Error al cargar la asignatura');
      }
      const data = await response.json();
      setSubjectName(data.name);
    } catch (error) {
      console.error('Error al cargar la asignatura:', error);
      setSubjectName('Asignatura');
    } finally {
      setIsLoadingSubject(false);
    }
  }, [subjectId]);

  const fetchEnrolledStudents = useCallback(async () => {
    if (!subjectId) return;
    setIsLoadingStudents(true);
    try {
      const response = await fetch(`/api/docente/matriculas?subjectId=${subjectId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudieron cargar los estudiantes.');
      }
      const result = await response.json();
      if (result.data) {
        setEnrolledStudents(result.data);
      } else {
        // If the response doesn't have a data property, use the entire response
        setEnrolledStudents(Array.isArray(result) ? result : []);
      }
    } catch (err) {
      console.error('Error al cargar los estudiantes:', err);
      toast.error(err instanceof Error ? err.message : 'Error al cargar los estudiantes');
    } finally {
      setIsLoadingStudents(false);
    }
  }, [subjectId]);

  useEffect(() => {
    if (subjectId) {
      fetchSubject();
      fetchClasses(pagination.page, pagination.limit);
      fetchEnrolledStudents();
    }
  }, [
    subjectId,
    fetchSubject,
    fetchClasses,
    fetchEnrolledStudents,
    pagination.page,
    pagination.limit,
  ]);

  const formatClassDate = (cls: Class) => {
    // Usar la fecha directamente sin conversiones de zona horaria
    let displayDate = 'N/A';
    let timeRange = '';

    if (cls.date) {
      // Crear fecha desde la cadena de fecha (YYYY-MM-DD) sin zona horaria
      const dateParts = cls.date.toString().split('T')[0].split('-');
      const year = Number.parseInt(dateParts[0]);
      const month = Number.parseInt(dateParts[1]) - 1; // Los meses en JS van de 0-11
      const day = Number.parseInt(dateParts[2]);

      const classDate = new Date(year, month, day);

      displayDate = classDate.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    // Formatear el rango de horas
    if (cls.startTime && cls.endTime) {
      const startDate = new Date(cls.startTime);
      const endDate = new Date(cls.endTime);

      const formatTimeAMPM = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHour}:${displayMinutes} ${period}`;
      };

      const startTimeFormatted = formatTimeAMPM(startDate);
      const endTimeFormatted = formatTimeAMPM(endDate);

      timeRange = `${startTimeFormatted} - ${endTimeFormatted}`;
    }

    return timeRange ? `${displayDate}, ${timeRange}` : displayDate;
  };

  // --- HANDLERS: ATTENDANCE & CLASSES ---

  const handleUpdateAttendance = useCallback(
    async (classId: string, studentId: string, status: string) => {
      try {
        setIsUpdatingAttendance(studentId);
        const response = await fetch(`/api/docente/clases/${classId}/asistencia`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, status }),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar la asistencia');
        }

        // Update the local state to reflect the change
        setAttendances(prevAttendances =>
          prevAttendances.map(att => (att.id === studentId ? { ...att, status } : att))
        );
      } catch (error) {
        console.error('Error updating attendance:', error);
        toast.error('Error al actualizar la asistencia');
      } finally {
        setIsUpdatingAttendance(null);
      }
    },
    []
  );

  const resetClassForm = () => {
    setCurrentClass(null);
    setClassDate(new Date());
    setStartTime(''); // Changed from null to ''
    setEndTime(''); // Also change this if endTime has the same type
    setClassTopic('');
  };

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classDate || !startTime || !endTime || !classTopic) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setIsSubmitting(true);

    // Validar que la hora de fin sea posterior a la de inicio
    if (startTime >= endTime) {
      toast.error('La hora de fin debe ser posterior a la de inicio');
      setIsSubmitting(false);
      return;
    }

    // Crear fechas combinadas con la fecha y hora
    const startDateTime = new Date(classDate);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(classDate);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    // Formatear fechas para la API - usar la fecha seleccionada, no la actual
    const formattedDate = `${classDate.getFullYear()}-${(classDate.getMonth() + 1).toString().padStart(2, '0')}-${classDate.getDate().toString().padStart(2, '0')}`;
    const formattedStartTime = startDateTime.toISOString();
    const formattedEndTime = endDateTime.toISOString();

    try {
      const response = await fetch(`/api/docente/clases/${currentClass?.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formattedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          topic: classTopic,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No se pudo actualizar la clase.');
      toast.success('¡Clase actualizada con éxito!');
      fetchClasses(pagination.page, pagination.limit);
      setIsEditClassDialogOpen(false);
      resetClassForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la clase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditClassDialog = (cls: ClassWithStatus) => {
    setCurrentClass(cls);
    setClassDate(new Date(cls.date));

    // Extraer la hora de inicio y fin de las fechas ISO
    if (cls.startTime) {
      const startDate = new Date(cls.startTime);
      const hours = startDate.getHours().toString().padStart(2, '0');
      const minutes = startDate.getMinutes().toString().padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
    } else {
      setStartTime('');
    }

    if (cls.endTime) {
      const endDate = new Date(cls.endTime);
      const hours = endDate.getHours().toString().padStart(2, '0');
      const minutes = endDate.getMinutes().toString().padStart(2, '0');
      setEndTime(`${hours}:${minutes}`);
    } else if (cls.startTime) {
      // Si hay hora de inicio pero no de fin, establecer 1 hora después
      const startDate = new Date(cls.startTime);
      startDate.setHours(startDate.getHours() + 1);
      const hours = startDate.getHours().toString().padStart(2, '0');
      const minutes = startDate.getMinutes().toString().padStart(2, '0');
      setEndTime(`${hours}:${minutes}`);
    } else {
      setEndTime('');
    }

    setClassTopic(cls.topic || '');
    setIsEditClassDialogOpen(true);
  };

  // --- MANEJADORES DE MATRÍCULA ---

  const handleUnenrollRequest = async (studentId: string) => {
    if (!subjectId) return;

    try {
      const response = await fetch(
        `/api/docente/asignaturas/${subjectId}/estudiantes/${studentId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Error al eliminar al estudiante');
      }

      // Refresh the students list
      fetchEnrolledStudents();
      toast.success('Estudiante eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      toast.error('Error al eliminar al estudiante');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 w-full flex sm:flex-row flex-col items-start gap-4 justify-between ">
        <div>
          <CardTitle className="text-2xl font-semibold tracking-heading">Mis Clases</CardTitle>
          <CardDescription className="text-xs">Gestiona tus clases y eventos.</CardDescription>
        </div>
        <Link href={`/dashboard/docente/asignaturas/${subjectId}/reportes`}>
          <Button variant="outline">Ver Reporte</Button>
        </Link>
      </div>

      {/* SECCIÓN DE GESTIÓN DE ESTUDIANTES */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold tracking-heading">
              Gestión de Estudiantes
            </CardTitle>
            <CardDescription className="text-sm">
              Matricula y administra a los estudiantes de esta asignatura.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStudents ? (
            <Loading />
          ) : enrolledStudents.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="text-xs tracking-tight font-normal px-4 py-2">
                      Nombre
                    </TableHead>
                    <TableHead className="text-xs tracking-tight font-normal px-4 py-2">
                      Documento
                    </TableHead>
                    <TableHead className="text-xs tracking-tight font-normal px-4 py-2">
                      Correo Institucional
                    </TableHead>
                    <TableHead className="text-xs tracking-tight font-normal px-4 py-2">
                      Correo Personal
                    </TableHead>
                    <TableHead className="text-xs tracking-tight font-normal px-4 py-2">
                      Teléfono
                    </TableHead>
                    <TableHead className="text-xs tracking-tight font-normal text-right px-4 py-2">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="text-sm px-4 py-2">{student.name || 'N/A'}</TableCell>
                      <TableCell className="text-sm px-4 py-2">
                        {student.document || 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-2">
                        {student.correoInstitucional ? (
                          <a
                            href={`mailto:${student.correoInstitucional}`}
                            title="Enviar correo"
                            className="hover:underline"
                          >
                            {student.correoInstitucional}
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell className="text-sm px-4 py-2">
                        {student.correoPersonal ? (
                          <a
                            href={`mailto:${student.correoPersonal}`}
                            title="Enviar correo"
                            className="hover:underline"
                          >
                            {student.correoPersonal}
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell className="text-sm px-4 py-2">
                        {student.telefono ? (
                          <a
                            href={`tel:${student.telefono}`}
                            className="hover:underline"
                            title="Llamar"
                          >
                            {student.telefono}
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell className="text-sm tracking-tight text-right px-4 py-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Solicitar desmatrícula"
                              onClick={() =>
                                setCurrentStudentForUnenroll({
                                  id: student.id,
                                  name: student.name || 'el estudiante',
                                })
                              }
                            >
                              <UserX className="h-4 w-4 text-amber-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-sans text-xl font-semibold tracking-tight">
                                Solicitar desmatrícula
                              </AlertDialogTitle>
                              <AlertDialogDescription className="space-y-4 font-sans">
                                <p>
                                  Se enviará una solicitud al administrador para desmatricular a{' '}
                                  {currentStudentForUnenroll?.name} de la asignatura.
                                </p>
                                <div className="space-y-2">
                                  <Label htmlFor="reason">Motivo de la solicitud</Label>
                                  <Input
                                    id="reason"
                                    placeholder="Ingrese el motivo de la solicitud"
                                    value={unenrollReason}
                                    className="text-xs"
                                    onChange={e => setUnenrollReason(e.target.value)}
                                    required
                                  />
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                className="font-sans"
                                onClick={() => {
                                  setUnenrollReason('');
                                  setCurrentStudentForUnenroll(null);
                                }}
                              >
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  if (currentStudentForUnenroll) {
                                    await handleUnenrollRequest(currentStudentForUnenroll.id);
                                  }
                                }}
                                className="bg-amber-600 text-white hover:bg-amber-700 font-sans"
                                disabled={!unenrollReason.trim() || isSubmitting}
                              >
                                {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Paginación estudiantes */}
              {totalStudentPages > 1 && (
                <div className="grid grid-cols-2 py-2 px-4 gap-2 items-center border-t">
                  <span className="text-xs text-muted-foreground col-span-1 justify-self-start items-center">
                    Mostrando {studentStart}–{studentEnd} de {enrolledStudents.length} registros
                  </span>
                  <Pagination className="col-span-1 justify-end items-center">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={e => {
                            e.preventDefault();
                            setStudentPage(p => Math.max(1, p - 1));
                          }}
                          aria-disabled={studentPage === 1}
                        >
                          Anterior
                        </PaginationPrevious>
                      </PaginationItem>
                      {Array.from({ length: totalStudentPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            isActive={studentPage === i + 1}
                            onClick={e => {
                              e.preventDefault();
                              setStudentPage(i + 1);
                            }}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={e => {
                            e.preventDefault();
                            setStudentPage(p => Math.min(totalStudentPages, p + 1));
                          }}
                          aria-disabled={studentPage === totalStudentPages}
                        >
                          Siguiente
                        </PaginationNext>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Aún no hay estudiantes matriculados en esta asignatura.
            </p>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN DE GESTIÓN DE CLASES */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold tracking-heading">
              Gestión de Clases
            </CardTitle>
            <CardDescription className="text-sm">
              Crea y administra las sesiones de clase para esta asignatura.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingClasses ? (
            <Loading />
          ) : classes.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="text-xs font-normal px-4 py-2">Fecha</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2">Tema</TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2">Estado</TableHead>
                    <TableHead className="text-xs font-normal text-right px-4 py-2">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map(cls => {
                    const now = new Date();
                    const classEndTime = cls.endTime ? new Date(cls.endTime) : new Date(cls.date);
                    const isPast = classEndTime < now;
                    const isFuture = new Date(cls.date) > now;
                    const statusInfo = classStatusMap[cls.status as ClassStatus] || {
                      label: 'Desconocido',
                      color: 'bg-gray-100 text-gray-800',
                    };

                    // Determine which actions should be enabled
                    const canEdit = cls.status === 'PROGRAMADA' && isFuture;
                    const canCancel = cls.status === 'PROGRAMADA' && isFuture;
                    const canMarkAsDone = cls.status === 'PROGRAMADA' && isPast;
                    const canTakeAttendance = cls.status !== 'CANCELADA' && (isPast || !isFuture);

                    return (
                      <TableRow
                        key={cls.id}
                        className={
                          cls.status === 'CANCELADA' ? 'opacity-70 bg-gray-50 dark:bg-zinc-900' : ''
                        }
                        data-state={cls.status === 'CANCELADA' ? 'cancelled' : undefined}
                      >
                        <TableCell className="text-sm px-4 py-2">
                          <div className="flex flex-col">
                            <span>{formatClassDate(cls)}</span>
                            {cls.status === 'CANCELADA' && cls.cancellationReason && (
                              <span className="text-xs text-amber-600 mt-1 dark:text-amber-400">
                                Motivo: {cls.cancellationReason}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm px-4 py-2">{cls.topic || 'N/A'}</TableCell>
                        <TableCell className="px-4 py-2">
                          <Badge
                            variant="outline"
                            className={cn('font-light text-xs dark:text-white', statusInfo.color)}
                          >
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right px-4 py-2 font-sans">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel className="font-sans">Acciones</DropdownMenuLabel>
                              <DropdownMenuItem asChild disabled={!canTakeAttendance}>
                                <Link
                                  href={`/dashboard/docente/clases/${cls.id}/asistencia`}
                                  className={`flex items-center w-full ${canTakeAttendance ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  <span className="font-sans">Asistencia</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditClassDialog(cls)}
                                disabled={!canEdit}
                                className={!canEdit ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                <span className="font-sans">Editar</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setClassToCancel(cls)}
                                disabled={!canCancel}
                                className={`${!canCancel ? 'opacity-50 cursor-not-allowed' : 'text-amber-600 hover:text-amber-600 hover:bg-amber-50'}`}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                <span className="font-sans">Cancelar Clase</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateClassStatus(cls.id, 'REALIZADA')}
                                disabled={!canMarkAsDone}
                                className={!canMarkAsDone ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span className="font-sans">Marcar como Realizada</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {/* Paginación clases */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 px-4 gap-2 border-t">
                <span className="text-xs text-muted-foreground w-full">
                  Mostrando {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} clases
                </span>
                {pagination.totalPages > 1 && (
                  <Pagination className="w-full sm:justify-end justify-center">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={e => {
                            e.preventDefault();
                            if (pagination.page > 1) handleClassPageChange(pagination.page - 1);
                          }}
                          className={pagination.page === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={e => {
                                e.preventDefault();
                                handleClassPageChange(pageNum);
                              }}
                              isActive={pagination.page === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={e => {
                            e.preventDefault();
                            if (pagination.page < pagination.totalPages)
                              handleClassPageChange(pagination.page + 1);
                          }}
                          className={
                            pagination.page === pagination.totalPages
                              ? 'pointer-events-none opacity-50'
                              : ''
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no has creado ninguna clase para esta asignatura.
            </p>
          )}
        </CardContent>
      </Card>

      <EventsCard subjectId={subjectId} />

      {/* DIÁLOGO DE CONFIRMACIÓN DE CANCELACIÓN */}
      <AlertDialog
        open={!!classToCancel}
        onOpenChange={isOpen => {
          if (!isOpen) {
            setClassToCancel(null);
            setCancelReason('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Clase</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cancelar la clase de{' '}
              <strong>{classToCancel?.topic || 'tema por definir'}</strong> del{' '}
              <strong>{classToCancel ? formatClassDate(classToCancel) : ''}</strong>. Se enviará una
              notificación a todos los estudiantes matriculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">Motivo de la cancelación (requerido)</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Ej: calamidad doméstica, cita médica, etc."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="mt-2 text-xs"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!cancelReason.trim()}
              onClick={() => {
                if (classToCancel) {
                  handleUpdateClassStatus(classToCancel.id, 'CANCELADA', cancelReason);
                  setClassToCancel(null);
                  setCancelReason('');
                }
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Confirmar Cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIÁLOGO DE EDICIÓN DE CLASE */}
      <Dialog
        open={isEditClassDialogOpen}
        onOpenChange={isOpen => {
          setIsEditClassDialogOpen(isOpen);
          if (!isOpen) {
            resetClassForm();
            setIsDatePickerOpen(false);
            setIsStartTimePickerOpen(false);
            setIsEndTimePickerOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] font-sans">
          <DialogHeader>
            <DialogTitle className="text-foreground font-semibold text-xl tracking-tight">
              Editar Clase
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Modifica los detalles de la clase. Haz clic en Guardar Cambios cuando hayas terminado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitClass} className="font-sans">
            <div className="space-y-6 py-4">
              {/* Selector de Fecha */}
              <div className="space-y-2">
                <Label className="text-sm font-normal">Fecha</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal h-11 px-3',
                        !classDate && 'text-muted-foreground'
                      )}
                      type="button"
                    >
                      <CalendarIcon className="mr-3 h-4 w-4 opacity-50" />
                      {classDate ? (
                        format(classDate, "EEEE, d 'de' MMMM 'de' yyyy", {
                          locale: es,
                        })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 shadow-lg border"
                    align="start"
                    onOpenAutoFocus={e => e.preventDefault()}
                  >
                    <Calendar
                      mode="single"
                      selected={classDate}
                      onSelect={date => {
                        if (date) {
                          setClassDate(date);
                          setIsDatePickerOpen(false);
                        }
                      }}
                      initialFocus
                      locale={es}
                      disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="rounded-md"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selector de Horario */}
              <div className="space-y-4">
                <Label className="text-sm font-normal">Horario de Clase</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Hora de Inicio */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Hora de inicio</Label>
                    <Popover open={isStartTimePickerOpen} onOpenChange={setIsStartTimePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-11"
                          type="button"
                        >
                          <Clock className="mr-2 h-4 w-4 opacity-50" />
                          {startTime
                            ? (() => {
                                const hour = Number.parseInt(startTime.split(':')[0]);
                                const period = hour >= 12 ? 'PM' : 'AM';
                                const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                                return `${displayHour}:00 ${period}`;
                              })()
                            : 'Seleccionar'}
                          {!startTime && <span className="text-muted-foreground">Requerido</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-48 p-0"
                        align="start"
                        onOpenAutoFocus={e => e.preventDefault()}
                      >
                        <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-2">
                          {Array.from({ length: 16 }, (_, i) => {
                            const hour = i + 7; // 7AM a 10PM
                            const time24 = `${hour.toString().padStart(2, '0')}:00`;
                            const period = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                            const timeDisplay = `${displayHour}:00 ${period}`;

                            return (
                              <Button
                                key={time24}
                                variant="ghost"
                                className="font-sans w-full justify-center text-center h-9 px-3 text-sm hover:bg-accent rounded-sm"
                                onClick={() => {
                                  setStartTime(time24);
                                  setIsStartTimePickerOpen(false); // Cerrar popover
                                  // Auto-ajustar hora de fin si es necesaria
                                  const startHour = Number.parseInt(time24.split(':')[0]);
                                  const endHour = Math.min(startHour + 2, 22); // Mínimo 2 horas, máximo 10PM
                                  const newEndTime = `${endHour.toString().padStart(2, '0')}:00`;
                                  if (
                                    !endTime ||
                                    endTime <= time24 ||
                                    Number.parseInt(endTime.split(':')[0]) - startHour < 2
                                  ) {
                                    setEndTime(newEndTime);
                                  }
                                }}
                                type="button"
                              >
                                {timeDisplay}
                              </Button>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Hora de Fin */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Hora de fin</Label>
                    <Popover open={isEndTimePickerOpen} onOpenChange={setIsEndTimePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-11"
                          type="button"
                          disabled={!startTime}
                        >
                          <Clock className="mr-2 h-4 w-4 opacity-50" />
                          {endTime
                            ? (() => {
                                const hour = Number.parseInt(endTime.split(':')[0]);
                                const period = hour >= 12 ? 'PM' : 'AM';
                                const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                                return `${displayHour}:00 ${period}`;
                              })()
                            : 'Seleccionar'}
                          {!endTime && startTime && (
                            <span className="text-muted-foreground ml-2">Requerido</span>
                          )}
                          {!startTime && (
                            <span className="text-muted-foreground ml-2">
                              Seleccione hora de inicio primero
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-48 p-0"
                        align="start"
                        onOpenAutoFocus={e => e.preventDefault()}
                      >
                        <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-2">
                          {startTime &&
                            Array.from({ length: 16 }, (_, i) => {
                              const hour = i + 7; // 7AM a 10PM
                              const time24 = `${hour.toString().padStart(2, '0')}:00`;
                              const period = hour >= 12 ? 'PM' : 'AM';
                              const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                              const timeDisplay = `${displayHour}:00 ${period}`;
                              const startHour = Number.parseInt(startTime.split(':')[0]);
                              const currentHour = Number.parseInt(time24.split(':')[0]);

                              // Solo mostrar horas que sean al menos 2 horas después del inicio
                              if (currentHour < startHour + 2) return null;

                              return (
                                <Button
                                  key={time24}
                                  variant="ghost"
                                  className="font-sans w-full justify-center text-center h-9 px-3 text-sm hover:bg-accent rounded-sm"
                                  onClick={() => {
                                    setEndTime(time24);
                                    setIsEndTimePickerOpen(false);
                                  }}
                                  type="button"
                                >
                                  {timeDisplay}
                                </Button>
                              );
                            }).filter(Boolean)}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Indicador de Duración */}
                {startTime && endTime && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                    <Clock className="h-4 w-4" />
                    <span>
                      Duración:{' '}
                      {(() => {
                        const start = Number.parseInt(startTime.split(':')[0]);
                        const end = Number.parseInt(endTime.split(':')[0]);
                        const duration = end - start;
                        return `${duration} ${duration === 1 ? 'hora' : 'horas'}`;
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Campo de Tema */}
              <div className="space-y-2">
                <Label htmlFor="topic-edit" className="text-sm font-normal">
                  Tema de la Clase
                </Label>
                <Input
                  id="topic-edit"
                  value={classTopic}
                  onChange={e => setClassTopic(e.target.value)}
                  className="h-11 text-xs"
                  placeholder="Ej: Introducción a las Derivadas"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  isSubmitting || !classDate || !startTime || !endTime || startTime >= endTime
                }
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Actualizando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog to confirm class deletion */}
      <AlertDialog
        open={!!classToCancel}
        onOpenChange={isOpen => {
          if (!isOpen) {
            setClassToCancel(null);
            setCancelReason('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans text-xl font-semibold tracking-tight">
              ¿Seguro que quieres cancelar la clase?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-xs text-muted-foreground">
              Estás a punto de cancelar la clase de "{classToCancel?.topic || 'Sin tema'}" del{' '}
              {classToCancel && formatClassDate(classToCancel)}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2 font-sans">
            <Label htmlFor="cancel-reason" className="font-sans font-semibold">
              Motivo de la cancelación
            </Label>
            <p className="text-xs text-muted-foreground">
              Este motivo se enviará a los estudiantes.
            </p>
            <Textarea
              id="cancel-reason"
              placeholder="Ej: calamidad doméstica, problemas de salud, etc."
              value={cancelReason}
              className="resize-none"
              onChange={e => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans">Cerrar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!cancelReason.trim() || isSubmitting}
              onClick={() => {
                if (classToCancel) {
                  handleUpdateClassStatus(classToCancel.id, 'CANCELADA', cancelReason);
                  setClassToCancel(null);
                  setCancelReason('');
                }
              }}
              className="bg-rose-600 text-white hover:bg-rose-700 font-sans"
            >
              {isSubmitting ? 'Cancelando...' : 'Confirmar Cancelación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para Gestionar Asistencia */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between font-sans">
              <DialogTitle>Gestionar Asistencia</DialogTitle>
              {currentClass &&
                (() => {
                  const statusInfo = classStatusMap[currentClass.status] || {
                    label: 'Desconocido',
                    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                  };
                  return (
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-sm font-semibold',
                        statusInfo.color
                      )}
                    >
                      {statusInfo.label}
                    </span>
                  );
                })()}
            </div>
            <DialogDescription>
              {currentClass &&
                `Clase del ${format(new Date(currentClass.date), 'PPP', { locale: es })} - Tema: ${currentClass.topic || 'Sin tema'}`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 font-sans">
            {isUpdatingAttendance ? (
              <Loading />
            ) : attendances.length > 0 ? (
              <div className="max-h-[50vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Correo Institucional</TableHead>
                      <TableHead>Correo Personal</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendances.map(att => (
                      <TableRow key={att.id}>
                        <TableCell className="font-normal">{att.name || 'Sin nombre'}</TableCell>
                        <TableCell>
                          <Badge className="text-xs">{att.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Popover
                            open={popoverStates[att.id] || false}
                            onOpenChange={isOpen =>
                              setPopoverStates(prev => ({
                                ...prev,
                                [att.id]: isOpen,
                              }))
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-[90px]"
                                disabled={
                                  isUpdatingAttendance === att.id ||
                                  currentClass?.status === 'REALIZADA' ||
                                  currentClass?.status === 'CANCELADA'
                                }
                              >
                                {isUpdatingAttendance === att.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                ) : (
                                  'Cambiar'
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-1"
                              onOpenAutoFocus={e => e.preventDefault()}
                            >
                              <div className="flex flex-col gap-1">
                                {['Presente', 'Ausente', 'Tardanza', 'Justificado'].map(status => (
                                  <Button
                                    key={status}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleUpdateAttendance(currentClass?.id || '', att.id, status)
                                    }
                                    className="justify-start"
                                    disabled={att.status === status}
                                  >
                                    {status}
                                  </Button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>No hay estudiantes matriculados en esta asignatura.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAttendanceDialogOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
