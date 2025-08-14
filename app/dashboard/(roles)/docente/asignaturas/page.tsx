'use client';

import { TablePagination } from '@/components/shared/table-pagination';
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
import { Subject as PrismaSubject } from '@prisma/client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

// Extend the base Subject type with period information
type SubjectWithPeriod = Omit<PrismaSubject, 'createdAt'> & {
  period?: string;
  createdAt: Date | string;
};

export default function SubjectsPage() {
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [subjects, setSubjects] = useState<SubjectWithPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get current year and period (1: Jan-Jun, 2: Jul-Dec)
  const getCurrentPeriod = () => {
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
    const currentPeriod = currentMonth <= 6 ? '1' : '2';
    return `${currentYear}-${currentPeriod}`;
  };

  // Get period from a date (1: Jan-Jun, 2: Jul-Dec)
  const getPeriodFromDate = (date: Date | string): string => {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // getMonth() is 0-indexed
    const period = month <= 6 ? '1' : '2';
    return `${year}-${period}`;
  };

  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentPeriod());
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<SubjectWithPeriod[]>([]);

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      // Include the period in the API request
      const url = new URL('/api/docente/asignaturas', window.location.origin);
      url.searchParams.append('sortBy', 'createdAt');
      url.searchParams.append('sortOrder', 'desc');
      url.searchParams.append('period', selectedPeriod);

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudieron cargar las asignaturas.');
      }

      const responseData = await response.json();
      const allSubjects = responseData.data || [];

      // Extract unique periods from the API response
      const periods = new Set<string>();

      // Add the current period first
      periods.add(selectedPeriod);

      // Add periods from all subjects
      allSubjects.forEach((subject: SubjectWithPeriod) => {
        if (subject.period) {
          periods.add(subject.period);
        }
      });

      // Sort periods from newest to oldest
      const sortedPeriods = Array.from(periods).sort((a, b) => {
        const [yearA, periodA] = a.split('-');
        const [yearB, periodB] = b.split('-');

        // Sort by year descending, then by period descending
        return yearB !== yearA
          ? parseInt(yearB, 10) - parseInt(yearA, 10)
          : parseInt(periodB, 10) - parseInt(periodA, 10);
      });

      setAvailablePeriods(sortedPeriods);
      setSubjects(allSubjects);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado';
      setFeedback({ type: 'error', message: errorMessage });
      setSubjects([]); // Asegurarnos de que no haya datos viejos si falla la carga
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Update filtered subjects when subjects or selectedPeriod changes
  useEffect(() => {
    if (subjects.length === 0) {
      setFilteredSubjects([]);
      return;
    }

    // Filter subjects by selected period
    const filtered = subjects.filter(subject => {
      const subjectPeriod = getPeriodFromDate(subject.createdAt);
      return subjectPeriod === selectedPeriod;
    });

    setFilteredSubjects(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [selectedPeriod, subjects]);

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
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="text-xs font-normal px-4 py-2">Nombre</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Código</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Programa</TableHead>
                  <TableHead className="text-xs font-normal px-4 py-2">Semestre</TableHead>
                  <TableHead className="text-xs font-normal text-right px-4 py-2">
                    Créditos
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loading />
                    </TableCell>
                  </TableRow>
                ) : filteredSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center">
                        <h3 className="text-xs font-normal">No hay asignaturas disponibles</h3>
                        <div className="text-xs text-muted-foreground">
                          No se encontraron asignaturas para el período seleccionado
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubjects
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map(subject => (
                      <TableRow key={subject.id}>
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
                        <TableCell className="px-4 py-2 text-right">
                          {subject.credits || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
            {filteredSubjects.length > 0 && (
              <div className="border-t">
                <TablePagination
                  currentPage={currentPage}
                  totalItems={filteredSubjects.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </div>
  );
}
