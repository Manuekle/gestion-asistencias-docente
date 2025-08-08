'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Subject } from '@prisma/client';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

export default function SubjectsPage() {
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Get current year and period (1: Jan-Jun, 2: Jul-Dec)
  const getCurrentPeriod = () => {
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
    const currentPeriod = currentMonth <= 6 ? '1' : '2';
    return `${currentYear}-${currentPeriod}`;
  };

  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentPeriod());
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/docente/asignaturas?page=1&limit=100&sortBy=createdAt&sortOrder=desc`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudieron cargar las asignaturas.');
      }

      const responseData = await response.json();

      const allSubjects = responseData.data || [];

      if (allSubjects.length > 0) {
      }

      // Filtrar por año y período seleccionado
      const [selectedYearStr, selectedPeriodNum] = selectedPeriod.split('-');
      const selectedYear = parseInt(selectedYearStr, 10);

      // Definir un tipo extendido que incluya los campos que necesitamos
      type SubjectWithDate = Subject & {
        createdAt: string | Date | { toISOString: () => string };
      };

      const filteredSubjects = allSubjects.filter((subject: SubjectWithDate) => {
        try {
          // Si no hay fecha, usar la fecha actual
          if (!subject.createdAt) {
            const now = new Date();
            const year = now.getFullYear();
            const period = now.getMonth() < 6 ? '1' : '2';
            const currentPeriod = `${year}-${period}`;
            return currentPeriod === selectedPeriod;
          }

          // Manejar diferentes formatos de fecha
          let subjectDate: Date;

          // Manejar diferentes formatos de fecha
          if (typeof subject.createdAt === 'string') {
            // Si es un string, intentar parsearlo
            subjectDate = new Date(subject.createdAt);

            // Si no es una fecha válida, intentar agregar 'Z' al final
            if (isNaN(subjectDate.getTime()) && !subject.createdAt.endsWith('Z')) {
              subjectDate = new Date(`${subject.createdAt}Z`);
            }
          } else if (subject.createdAt instanceof Date) {
            // Si ya es un objeto Date
            subjectDate = subject.createdAt;
          } else if (
            subject.createdAt &&
            typeof subject.createdAt === 'object' &&
            'toISOString' in subject.createdAt
          ) {
            // Si es un objeto con método toISOString (como las fechas de Prisma)
            const dateObj = subject.createdAt as { toISOString: () => string };
            subjectDate = new Date(dateObj.toISOString());
          } else {
            // Cualquier otro caso, intentar convertir a fecha
            subjectDate = new Date(String(subject.createdAt));
          }

          // Verificar si la fecha es válida
          if (isNaN(subjectDate.getTime())) {
            const now = new Date();
            const year = now.getFullYear();
            const period = now.getMonth() < 6 ? '1' : '2';
            const currentPeriod = `${year}-${period}`;
            return currentPeriod === selectedPeriod;
          }

          const subjectYear = subjectDate.getFullYear();
          const subjectMonth = subjectDate.getMonth() + 1;
          const subjectPeriod = subjectMonth <= 6 ? '1' : '2';
          const subjectPeriodStr = `${subjectYear}-${subjectPeriod}`;

          return subjectPeriodStr === selectedPeriod;
        } catch (error) {
          return false;
        }
      });

      // Obtener años y períodos únicos de las asignaturas
      const periods = new Set<string>();

      // Agregar el período actual primero
      periods.add(selectedPeriod);

      // Agregar períodos de las asignaturas existentes
      allSubjects.forEach((subject: Subject) => {
        try {
          if (!subject.createdAt) {
            const now = new Date();
            const year = now.getFullYear();
            const period = now.getMonth() < 6 ? '1' : '2';
            periods.add(`${year}-${period}`);
            return;
          }

          let subjectDate: Date;

          // Manejar diferentes formatos de fecha
          if (typeof subject.createdAt === 'string') {
            const dateStr = subject.createdAt;
            const dateStrAsString = String(dateStr);
            subjectDate = new Date(dateStrAsString);
            if (isNaN(subjectDate.getTime()) && !dateStrAsString.endsWith('Z')) {
              subjectDate = new Date(`${dateStrAsString}Z`);
            }
          } else if (subject.createdAt instanceof Date) {
            subjectDate = subject.createdAt;
          } else if (
            subject.createdAt &&
            typeof subject.createdAt === 'object' &&
            'toISOString' in subject.createdAt
          ) {
            const dateObj = subject.createdAt as { toISOString: () => string };
            subjectDate = new Date(dateObj.toISOString());
          } else {
            subjectDate = new Date(String(subject.createdAt));
          }

          if (isNaN(subjectDate.getTime())) {
            const now = new Date();
            const year = now.getFullYear();
            const period = now.getMonth() < 6 ? '1' : '2';
            periods.add(`${year}-${period}`);
            return;
          }

          const year = subjectDate.getFullYear();
          const month = subjectDate.getMonth() + 1;
          const period = month <= 6 ? '1' : '2';
          periods.add(`${year}-${period}`);
        } catch (error) {
          const now = new Date();
          const year = now.getFullYear();
          const period = now.getMonth() < 6 ? '1' : '2';
          periods.add(`${year}-${period}`);
        }
      });

      // Convertir a array, filtrar valores inválidos y ordenar
      const sortedPeriods = Array.from(periods)
        .filter(period => {
          const [year] = period.split('-');
          return !isNaN(parseInt(year, 10));
        })
        .sort((a, b) => {
          const [yearA, periodA] = a.split('-');
          const [yearB, periodB] = b.split('-');
          return yearB !== yearA
            ? parseInt(yearB, 10) - parseInt(yearA, 10)
            : parseInt(periodB, 10) - parseInt(periodA, 10);
        });

      setAvailablePeriods(sortedPeriods);
      setSubjects(filteredSubjects);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado';
      setFeedback({ type: 'error', message: errorMessage });
      setSubjects([]); // Asegurarnos de que no haya datos viejos si falla la carga
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, setSubjects]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="pb-4 col-span-1 w-full">
          <CardTitle className="text-2xl font-semibold tracking-tight">Mis Asignaturas</CardTitle>
          <CardDescription className="text-xs">
            Listado de asignaturas por período académico
          </CardDescription>
        </div>
        <div className="justify-end col-span-1 w-full items-center flex">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {availablePeriods.map(period => (
                <SelectItem key={period} value={period} className="text-xs font-sans">
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <CardContent className="p-0">
        {feedback?.type === 'success' && (
          <Alert variant="default">
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
        <div>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="text-xs font-normal px-4 py-2">Nombre</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Código</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Programa</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Semestre</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Créditos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loading />
                    </TableCell>
                  </TableRow>
                ) : subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <BookOpen className="h-16 w-16 text-muted-foreground/50" />
                        <h3 className="text-xl font-semibold">No hay asignaturas disponibles</h3>
                        <div className="text-xs text-muted-foreground">
                          No se encontraron asignaturas para el período seleccionado
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map(subject => (
                    <TableRow key={subject.id} className="border-b">
                      <TableCell className="font-normal whitespace-nowrap px-4 py-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/dashboard/docente/asignaturas/${subject.id}`}
                                className="hover:underline"
                              >
                                {subject.name}
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ir a mi clase</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="px-4 py-2">{subject.code}</TableCell>
                      <TableCell className="px-4 py-2">{subject.program || 'N/A'}</TableCell>
                      <TableCell className="px-4 py-2">{subject.semester || 'N/A'}</TableCell>
                      <TableCell className="px-4 py-2">{subject.credits || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </div>
  );
}
