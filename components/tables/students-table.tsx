import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserX } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { TablePagination } from '../shared/table-pagination';

export interface Student {
  id: string;
  name: string | null;
  correoInstitucional: string | null;
  correoPersonal: string | null;
  document?: string | null;
  telefono?: string | null;
}

interface StudentsTableProps {
  students: Student[];
  isLoading: boolean;
  currentStudentForUnenroll: { id: string; name: string } | null;
  unenrollReason: string;
  setUnenrollReason: (reason: string) => void;
  setCurrentStudentForUnenroll: (student: { id: string; name: string } | null) => void;
  handleUnenrollRequest: (studentId: string, reason: string) => Promise<void>;
  isSubmitting: boolean;
}

export const StudentsTable: React.FC<StudentsTableProps> = ({
  students: allStudents,
  isLoading,
  currentStudentForUnenroll,
  unenrollReason,
  setUnenrollReason,
  setCurrentStudentForUnenroll,
  handleUnenrollRequest,
  isSubmitting,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate pagination
  const totalItems = allStudents.length;
  const currentStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [allStudents, currentPage, itemsPerPage]);

  // Reset to first page when students change
  useEffect(() => {
    setCurrentPage(1);
  }, [allStudents]);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-semibold tracking-heading">
            Gestión de Estudiantes
          </CardTitle>
          <CardDescription className="text-xs">
            Matricula y administra a los estudiantes de esta asignatura.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loading className="h-8 w-8" />
          </div>
        ) : allStudents.length > 0 ? (
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
                {currentStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="text-xs px-4 py-2">{student.name || 'N/A'}</TableCell>
                    <TableCell className="text-xs px-4 py-2">{student.document || 'N/A'}</TableCell>
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
                    <TableCell className="text-xs px-4 py-2">
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
                    <TableCell className="text-xs px-4 py-2">
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
                    <TableCell className="text-xs tracking-tight text-right px-4 py-2">
                      <Dialog>
                        <DialogTrigger asChild>
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
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="font-sans text-xl font-semibold tracking-tight">
                              Solicitar desmatrícula
                            </DialogTitle>
                            <DialogDescription className="space-y-4 font-sans">
                              <p>
                                Se enviará una solicitud al administrador para desmatricular a{' '}
                                {currentStudentForUnenroll?.name} de la asignatura.
                              </p>
                              <div className="space-y-2">
                                <Label
                                  className="text-xs font-normal text-black dark:text-white"
                                  htmlFor="reason"
                                >
                                  Motivo de la solicitud
                                </Label>
                                <Input
                                  id="reason"
                                  placeholder="Ingrese el motivo de la solicitud"
                                  value={unenrollReason}
                                  className="text-xs"
                                  onChange={e => setUnenrollReason(e.target.value)}
                                  required
                                />
                              </div>
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose
                              className="font-sans"
                              onClick={() => {
                                setUnenrollReason('');
                                setCurrentStudentForUnenroll(null);
                              }}
                            >
                              Cancelar
                            </DialogClose>
                            <Button
                              onClick={async () => {
                                if (currentStudentForUnenroll && unenrollReason.trim()) {
                                  await handleUnenrollRequest(
                                    currentStudentForUnenroll.id,
                                    unenrollReason
                                  );
                                }
                              }}
                              className="bg-amber-600 text-white hover:bg-amber-700 font-sans"
                              disabled={!unenrollReason.trim() || isSubmitting}
                            >
                              {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              className="border-t"
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-12">
            No hay estudiantes matriculados en esta asignatura.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
