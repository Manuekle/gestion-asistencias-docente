'use client';

import { Button } from '@/components/ui/button';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, CheckCircle, Download, Loader2, Upload, X } from "lucide-react";
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadResult(null);
      setIsPreview(false);
      setPreviewData([]);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo primero.');
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

      if (res.ok && result.success) {
        setPreviewData(result.previewData);
        setIsPreview(true);
        toast.success('Vista previa generada con éxito');
      } else {
        toast.error(result.message || 'Error al generar la vista previa');
        resetForm();
      }
    } catch {
      toast.error('Ocurrió un error inesperado al procesar el archivo.');
      resetForm();
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
          errors: result.errors || [{ codigoAsignatura: '', message: result.message || 'Error desconocido' }],
        });
        toast.error(result.message || 'Error en la carga');
      }
    } catch {
      toast.error('Error de conexión o en el servidor.');
    } finally {
      setIsLoading(false);
      setIsPreview(false); // Ocultar la vista previa después de la carga
    }
  };

  const handleCancelPreview = () => {
    setIsPreview(false);
    setPreviewData([]);
  };

  const resetForm = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setUploadResult(null);
    const inputFile = document.getElementById('file-upload') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  };

  const requiredColumns = ['codigoAsignatura', 'documentoEstudiante'];

  // --- Renderizado Condicional ---
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Cargar Estudiantes a Asignaturas</h1>
        <p className="text-xs text-muted-foreground">
          Sube un archivo Excel para asignar estudiantes masivamente a las asignaturas.
        </p>
      </div>

      <Card className="p-8">
        {/* 1. Vista de Resultados */} 
        {uploadResult && (
           <div
            className={`p-6 rounded-lg border-2 ${uploadResult.success
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {uploadResult.success ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <h3
                  className={`font-normal ${uploadResult.success
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                    }`}
                >
                  {uploadResult.success ? 'Carga completada' : 'Error en la carga'}
                </h3>
                <p
                  className={`text-sm ${uploadResult.success
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                    }`}
                >
                  Se procesaron {uploadResult.processedRows} de {uploadResult.totalRows} asignaturas.
                </p>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-normal text-red-800 dark:text-red-200">Detalles y Advertencias:</p>
                <div className="bg-white/50 dark:bg-black/20 rounded p-3 space-y-1">
                  {uploadResult.errors.map((error, index) => (
                     <p key={index} className="text-xs text-red-700 dark:text-red-300">
                       • {error.codigoAsignatura ? <strong>{`Asignatura ${error.codigoAsignatura}: `}</strong> : ''}{error.message}
                     </p>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={resetForm} variant="outline" className="w-full mt-6">
              Cargar otro archivo
            </Button>
          </div>
        )}

        {/* 2. Vista Previa */} 
        {isPreview && !uploadResult && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-xs">Vista previa de la carga</h3>
              <Badge variant="outline" className="text-xs font-normal">
                {previewData?.length || 0} asignaturas a procesar
              </Badge>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código Asignatura</TableHead>
                    <TableHead>Detalle de Estudiantes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData?.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono whitespace-nowrap">{row.codigoAsignatura}</TableCell>
                      <TableCell>
                        {row.error ? (
                          <span className="text-red-500 font-bold">{row.error}</span>
                        ) : (
                          <div className="flex flex-col space-y-2">
                            {row.estudiantes.map((student, sIndex) => (
                              <div key={sIndex} className="flex items-center space-x-2">
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full w-24 text-center ${{
                                    success: 'bg-green-100 text-green-800',
                                    warning: 'bg-yellow-100 text-yellow-800',
                                    error: 'bg-red-100 text-red-800',
                                  }[student.status]}`}
                                >
                                  {student.message === 'Ya inscrito' ? 'YA INSCRITO' : student.status.toUpperCase()}
                                </span>
                                <span className="font-mono text-sm">{student.doc}</span>
                                <span className="text-muted-foreground">- {student.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancelPreview} className="flex-1 bg-transparent">
                Volver
              </Button>
              <Button onClick={handleConfirmUpload} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...</>
                ) : (
                  'Confirmar carga'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 3. Archivo Seleccionado */} 
        {file && !isPreview && !uploadResult && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-normal text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetForm} className="flex-1 bg-transparent">
                Cancelar
              </Button>
              <Button onClick={handlePreview} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                ) : (
                  'Vista previa'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 4. Vista Inicial (Upload) */} 
        {!file && !isPreview && !uploadResult && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center hover:border-muted-foreground/50 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold tracking-card mb-2">
                  Selecciona tu archivo Excel
                </p>
                <p className="text-xs text-muted-foreground">Solo archivos .xlsx o .xls hasta 10MB</p>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-xs mb-3">Formato requerido</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Un estudiante por fila</li>
                  <li>• Columnas: {requiredColumns.join(', ')}</li>
                  <li>• Extensión: .xlsx o .xls</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-xs mb-3">Plantilla</h3>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="/plantilla_admin_estudiantes_asignatura.xlsx"
                    download
                    className="inline-flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar ejemplo
                  </a>
                </Button>
              </div>
            </div>

            <div className="text-xs">
              <h3 className="font-medium text-xs mb-3">Columnas requeridas</h3>
              <div className="flex flex-wrap gap-2">
                {requiredColumns.map(col => (
                  <Badge key={col} variant="outline" className="font-mono text-xs rounded-md">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
