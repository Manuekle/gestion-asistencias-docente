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
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, UserX } from 'lucide-react';
import React from 'react';

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
  page: number;
  totalPages: number;
  start: number;
  end: number;
  onPageChange: (page: number) => void;
  currentStudentForUnenroll: { id: string; name: string } | null;
  unenrollReason: string;
  setUnenrollReason: (reason: string) => void;
  setCurrentStudentForUnenroll: (student: { id: string; name: string } | null) => void;
  handleUnenrollRequest: (studentId: string, reason: string) => Promise<void>;
  isSubmitting: boolean;
}

export const StudentsTable: React.FC<StudentsTableProps> = ({
  students,
  isLoading,
  page,
  totalPages,
  start,
  end,
  onPageChange,
  currentStudentForUnenroll,
  unenrollReason,
  setUnenrollReason,
  setCurrentStudentForUnenroll,
  handleUnenrollRequest,
  isSubmitting,
}) => {
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
          <Loading />
        ) : students.length > 0 ? (
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
                {students.map(student => (
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
            {/* Paginación estudiantes */}
            {totalPages > 1 && (
              <div className="grid grid-cols-2 py-2 px-4 gap-2 items-center border-t">
                <span className="text-xs text-muted-foreground col-span-1 justify-self-start items-center">
                  Mostrando {start}–{end} de {students.length} registros
                </span>
                <Pagination className="col-span-1 justify-end items-center">
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                      >
                        <span className="sr-only">Anterior</span>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <Button
                          variant={page === i + 1 ? 'outline' : 'ghost'}
                          className="h-8 w-8 p-0"
                          onClick={() => onPageChange(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                      >
                        <span className="sr-only">Siguiente</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-12">
            Aún no hay estudiantes matriculados en esta asignatura.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
