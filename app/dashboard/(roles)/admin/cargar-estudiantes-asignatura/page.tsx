'use client';

import { SubjectFileUpload } from '@/components/SubjectFileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// --- Tipos de Datos ---
interface PreviewStudentDetail {
  doc: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

interface PreviewData {
  codigoAsignatura: string;
  estudiantes: PreviewStudentDetail[];
  error?: string;
}

interface UploadError {
  codigoAsignatura: string;
  message: string;
}

interface UploadResult {
  success: boolean;
  processedRows: number;
  totalRows: number;
  errors: UploadError[];
}

export default function UploadStudentsToSubjectsPage() {
  // --- Estados del Componente ---
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // --- Manejadores de Eventos ---
  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      setIsPreview(false);
      setPreviewData([]);
      setUploadResult(null);
    } else {
      setUploadResult(null);
      setIsPreview(false);
      setPreviewData([]);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo .xlsx para continuar.');
      return;
    }
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/cargar-estudiantes-asignaturas?preview=true', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      console.log('--- Respuesta del Backend ---');
      console.log(JSON.stringify(result, null, 2));

      if (res.ok && result.success) {
        console.log('--- Datos de Vista Previa a renderizar ---');
        console.log(JSON.stringify(result.previewData, null, 2));
        setPreviewData(result.previewData || []);
        setIsPreview(true);
        toast.success('Vista previa generada con éxito');
      } else {
        toast.error(result.message || 'Error al generar la vista previa');
        handleCancel();
      }
    } catch {
      toast.error('Ocurrió un error inesperado al procesar el archivo.');
      handleCancel();
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!file) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/cargar-estudiantes-asignaturas', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setUploadResult({
          success: true,
          processedRows: result.resultados.length,
          totalRows: result.totalRows,
          errors: result.errors || [],
        });
        toast.success(result.message || 'Carga completada');
      } else {
        setUploadResult({
          success: false,
          processedRows: 0,
          totalRows: result.totalRows || 0,
          errors: result.errors || [
            { codigoAsignatura: '', message: result.message || 'Error desconocido' },
          ],
        });
        toast.error(result.message || 'Error en la carga');
      }
    } catch {
      toast.error('Error de conexión o en el servidor.');
    } finally {
      setIsLoading(false);
      setIsPreview(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setUploadResult(null);
  };

  const handleNewUpload = () => {
    handleCancel();
  };

  // --- Renderizado ---
  return (
    <main className="space-y-4">
      <div className="pb-4 col-span-1 w-full">
        <CardTitle className="text-2xl font-semibold tracking-heading">
          Cargar Estudiantes a Asignaturas
        </CardTitle>
        <CardDescription className="text-xs">
          Sube un archivo .xlsx para cargar masivamente estudiantes a las asignaturas.
        </CardDescription>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Plantilla de Carga
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Descarga la plantilla para asegurar que tu archivo tiene el formato correcto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/formatos/plantilla_admin_estudiantes_asignatura.xlsx" download>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Plantilla
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Subir Archivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SubjectFileUpload onFileSelect={handleFileSelect} file={file} />
              <div className="flex gap-2 mt-4 flex-col">
                <Button
                  onClick={handlePreview}
                  disabled={!file || isLoading || isPreview}
                  className="w-full text-xs"
                >
                  {isLoading && !isPreview ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Vista Previa
                </Button>
                {file && (
                  <Button onClick={handleCancel} variant="destructive" className="w-full text-xs">
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* card */}
        <div className="lg:col-span-2">
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Previsualización y Confirmación
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Revisa los datos antes de confirmar la carga. Las filas con errores no serán
                procesadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col justify-center">
              {isLoading && !isPreview ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : uploadResult ? (
                <div className="bg-card text-center mt-4">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {uploadResult.success ? (
                      <CheckCircle className="h-16 w-16 text-green-500" />
                    ) : (
                      <AlertCircle className="h-16 w-16 text-red-500" />
                    )}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold tracking-heading">
                    {uploadResult.success ? 'Carga completada' : 'Error en la carga'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Se procesaron {uploadResult.processedRows} de {uploadResult.totalRows}{' '}
                    asignaturas.
                  </p>

                  {uploadResult.errors.length > 0 && (
                    <div className="space-y-3 mt-4 text-left">
                      <p className="text-sm font-medium">Detalles:</p>
                      <div className="bg-muted/50 rounded-md p-3 max-h-40 overflow-y-auto">
                        <div className="space-y-1 text-sm">
                          {uploadResult.errors.map((error, index) => (
                            <div key={index} className="text-muted-foreground">
                              {error.codigoAsignatura && (
                                <span className="font-mono font-medium text-foreground">
                                  {error.codigoAsignatura}:{' '}
                                </span>
                              )}
                              {error.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleNewUpload} className="mt-6">
                    Cargar otro archivo
                  </Button>
                </div>
              ) : isPreview && previewData.length > 0 ? (
                <>
                  <div className="rounded-lg border max-h-[60vh] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/60">
                          <TableHead className="px-4 py-3 w-32">Código</TableHead>
                          <TableHead className="px-4 py-3">Estudiantes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono px-4 py-3 font-medium">
                              {row.codigoAsignatura}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              {row.error ? (
                                <span className="text-muted-foreground">{row.error}</span>
                              ) : (
                                (() => {
                                  const groupedStudents = (row.estudiantes || []).reduce(
                                    (acc, student) => {
                                      const status = student.status;
                                      if (!acc[status]) {
                                        acc[status] = [];
                                      }
                                      acc[status].push(student);
                                      return acc;
                                    },
                                    {} as Record<string, PreviewStudentDetail[]>
                                  );

                                  const successCount = (groupedStudents['success'] || []).length;
                                  const warningCount = (groupedStudents['warning'] || []).length;
                                  const errorCount = (groupedStudents['error'] || []).length;
                                  const totalCount = successCount + warningCount + errorCount;

                                  if (totalCount === 0) {
                                    return (
                                      <span className="text-muted-foreground">Sin estudiantes</span>
                                    );
                                  }

                                  return (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <button className="text-left text-sm hover:underline">
                                          {successCount > 0 && `${successCount} listos`}
                                          {successCount > 0 &&
                                            (warningCount > 0 || errorCount > 0) &&
                                            ', '}
                                          {warningCount > 0 && `${warningCount} ya están inscritos`}
                                          {warningCount > 0 && errorCount > 0 && ', '}
                                          {errorCount > 0 && `${errorCount} errores`}
                                        </button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl max-h-[80vh]">
                                        <DialogHeader>
                                          <DialogTitle className="text-xl font-semibold tracking-heading">
                                            {row.codigoAsignatura}
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="overflow-y-auto space-y-4">
                                          {Object.entries(groupedStudents).map(
                                            ([status, students]) => {
                                              if (students.length === 0) return null;

                                              const statusTitle = {
                                                success: 'Listos para inscribir',
                                                warning: 'Ya están inscritos',
                                                error: 'Con errores',
                                              }[status];

                                              return (
                                                <div key={status}>
                                                  <h4 className="font-medium text-sm mb-2">
                                                    {statusTitle} ({students.length})
                                                  </h4>
                                                  <div className="space-y-1 text-sm">
                                                    {students.map((student, sIndex) => (
                                                      <div key={sIndex} className="flex gap-3">
                                                        <span className="font-mono">
                                                          {student.doc}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                          {student.message}
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              );
                                            }
                                          )}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  );
                                })()
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      onClick={handleConfirmUpload}
                      disabled={isLoading || previewData.length === 0}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Confirmar Carga
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-xs font-normal text-muted-foreground py-24">
                  <p>Sube un archivo para ver la previsualización aquí.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
