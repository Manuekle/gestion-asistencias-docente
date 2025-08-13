'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// --- Tipos de Datos ---
interface UserData {
  name: string;
  document: string;
  correoPersonal: string;
  role: string;
  codigoInstitucional?: string;
}

interface PreviewResult {
  data: UserData;
  status: 'success' | 'warning' | 'error';
  message: string;
}

interface FinalResult {
  document: string;
  name: string;
  status: 'created' | 'skipped' | 'error';
  message: string;
}

export default function CargarUsuariosPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResult[]>([]);
  const [finalResults, setFinalResults] = useState<FinalResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      setIsPreview(false);
      setPreviewData([]);
      setFinalResults([]);
    } else {
      setFinalResults([]);
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

      const res = await fetch('/api/admin/cargar-usuarios?preview=true', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setPreviewData(result || []);
        setIsPreview(true);
        toast.success('Vista previa generada con éxito');
      } else {
        toast.error(result.error || 'Error al generar la vista previa');
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
    if (previewData.filter(item => item.status === 'success').length === 0) {
      toast.error('No hay usuarios válidos para crear.');
      return;
    }

    setIsConfirming(true);
    try {
      const response = await fetch('/api/admin/cargar-usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al confirmar la carga.');
      }

      toast.success('Proceso de carga finalizado.');
      setFinalResults(result.results || []);
      setPreviewData([]); // Limpiar la previsualización
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      toast.error(errorMessage);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setFinalResults([]);
  };

  return (
    <main className="space-y-4">
      <div className="pb-4 col-span-1 w-full">
        <CardTitle className="text-2xl font-semibold tracking-heading">Cargar Usuarios</CardTitle>
        <CardDescription className="text-xs">
          Sube un archivo .xlsx para cargar masivamente usuarios.
        </CardDescription>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Plantilla de Carga
              </CardTitle>
              <CardDescription>
                Descarga la plantilla para asegurar que tu archivo tiene el formato correcto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/formatos/plantilla_usuarios.xlsx" download>
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
          <Card className="min-h-[400px] sm:h-[calc(75vh-9rem)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Previsualización y Confirmación
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Revisa los datos antes de confirmar la carga. Las filas con errores no serán
                procesadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col justify-center h-full">
              {isLoading && !isPreview ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
              ) : isPreview && previewData.length > 0 ? (
                <div className="flex flex-col h-full">
                  <div className="rounded-lg border max-h-[60vh] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/60">
                          <TableHead className="px-4 py-3">Nombre</TableHead>
                          <TableHead className="px-4 py-3">Documento</TableHead>
                          <TableHead className="px-4 py-3">Correo</TableHead>
                          <TableHead className="px-4 py-3">Rol</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((item, index) => (
                          <TableRow key={index}>
                            {item.status === 'error' ? (
                              <TableCell colSpan={6} className="text-xs text-red-500">
                                {item.message}
                              </TableCell>
                            ) : (
                              <>
                                <TableCell className="px-4 py-3">{item.data.name}</TableCell>
                                <TableCell className="px-4 py-3">{item.data.document}</TableCell>
                                <TableCell className="px-4 py-3">
                                  {item.data.correoPersonal}
                                </TableCell>
                                <TableCell className="px-4 py-3 lowercase">
                                  {item.data.role}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      onClick={handleConfirmUpload}
                      disabled={
                        isConfirming || previewData.filter(i => i.status === 'success').length === 0
                      }
                    >
                      {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirmar Carga
                    </Button>
                  </div>
                </div>
              ) : finalResults.length > 0 ? (
                (() => {
                  const createdCount = finalResults.filter(r => r.status === 'created').length;
                  const notCreatedCount = finalResults.length - createdCount;

                  return (
                    <div className="text-center p-8 flex flex-col items-center justify-center h-full">
                      <CheckCircle className="h-16 w-16 text-green-500" />
                      <h3 className="mt-4 text-xl font-semibold tracking-heading">
                        Proceso Completado
                      </h3>
                      <div className="mt-3 text-xs text-muted-foreground space-y-1">
                        <p>
                          <span className="font-semibold text-primary">{createdCount}</span>{' '}
                          {createdCount === 1 ? 'usuario creado' : 'usuarios creados'} con éxito.
                        </p>
                        {notCreatedCount > 0 && (
                          <p>
                            <span className="font-semibold text-destructive">
                              {notCreatedCount}
                            </span>{' '}
                            {notCreatedCount === 1
                              ? 'usuario no fue creado'
                              : 'usuarios no fueron creados'}{' '}
                            (omitidos o con errores).
                          </p>
                        )}
                      </div>
                      <Button onClick={handleCancel} className="mt-8">
                        Cargar Otro Archivo
                      </Button>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center text-xs font-medium text-muted-foreground py-24">
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
