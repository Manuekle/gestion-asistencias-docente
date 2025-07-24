'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, CheckCircle, Download, Loader2, Upload, X } from 'lucide-react';
import { type ChangeEvent, useState } from 'react';
import { toast } from 'sonner';

interface PreviewDataItem {
  codigoAsignatura: string;
  nombreAsignatura: string;
  fechaClase: string;
  horaInicio: string;
  horaFin: string;
  creditosClase: number | null;
  programa: string | null;
  semestreAsignatura: string | null;
  status: 'success' | 'error';
  error?: string;
}

export default function UploadSubjectsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewDataItem[]>([]);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    processedRows: number;
    totalRows: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error('Selecciona un archivo .xlsx');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('preview', 'true');

    try {
      setIsLoading(true);
      const res = await fetch('/api/docente/cargar-asignaturas', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Error al obtener la vista previa');
      }

      const previewItems: PreviewDataItem[] = Array.isArray(result.previewData)
        ? result.previewData.map((item: any) => ({
            codigoAsignatura: String(item.codigoAsignatura || ''),
            nombreAsignatura: String(item.nombreAsignatura || ''),
            fechaClase: item.fechaClase ? String(item.fechaClase) : new Date().toISOString(),
            horaInicio: String(item.horaInicio || ''),
            horaFin: String(item.horaFin || ''),
            creditosClase: typeof item.creditosClase === 'number' ? item.creditosClase : null,
            programa: item.programa ? String(item.programa) : null,
            semestreAsignatura: item.semestreAsignatura ? String(item.semestreAsignatura) : null,
            status: item.status === 'success' ? 'success' : 'error',
            error: item.error ? String(item.error) : undefined,
          }))
        : [];

      setPreviewData(previewItems);
      setIsPreview(true);
      setUploadResult(null);
      toast.success('Vista previa generada');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const res = await fetch('/api/docente/cargar-asignaturas', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setUploadResult({
          success: true,
          processedRows: result.processedRows || 0,
          totalRows: result.totalRows || 0,
          errors: [],
        });
        setFile(null);
        setPreviewData([]);
        setIsPreview(false);
        toast.success('Archivo cargado exitosamente');
      } else {
        throw new Error(result.error || 'Error al cargar el archivo');
      }
    } catch (error) {
      console.error('Error:', error);
      setUploadResult({
        success: false,
        processedRows: 0,
        totalRows: 0,
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      });
      toast.error('Error al cargar el archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPreview = () => {
    setIsPreview(false);
    setPreviewData([]);
  };

  const resetForm = () => {
    setFile(null);
    setPreviewData([]);
    setUploadResult(null);
    setIsPreview(false);
  };

  const requiredColumns = [
    'codigoAsignatura',
    'nombreAsignatura',
    'fechaClase',
    'horaInicio',
    'horaFin',
    'temaClase',
    'descripcionClase',
    'creditosClase',
    'programa',
    'semestreAsignatura',
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Cargar Asignaturas</h1>
        <p className="text-xs text-muted-foreground">
          Sube un archivo Excel con la información de las asignaturas
        </p>
      </div>

      {/* Main Upload Card */}
      <Card className="p-8">
        {!file && !isPreview && !uploadResult && (
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center hover:border-muted-foreground/50 transition-colors">
              <input
                type="file"
                accept=".xlsx"
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
                <p className="text-xs text-muted-foreground">Solo archivos .xlsx hasta 10MB</p>
              </label>
            </div>

            {/* Quick Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-xs mb-3">Formato requerido</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Fechas: YYYY-MM-DD</li>
                  <li>• Horas: HH:MM</li>
                  <li>• Extensión: .xlsx</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-xs mb-3">Plantilla</h3>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="/formatos/plantilla_docente_asignaturas_clases.xlsx"
                    download="plantilla_docente_asignaturas_clases.xlsx"
                    className="inline-flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar ejemplo
                  </a>
                </Button>
              </div>
            </div>

            {/* Required Columns */}
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

        {/* File Selected */}
        {file && !isPreview && (
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
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Vista previa'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Preview */}
        {isPreview && previewData.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-xs">Vista previa</h3>
              <Badge variant="outline" className="text-xs font-normal">
                {previewData.length} registros
              </Badge>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Estado</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Asignatura</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Horario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 5).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {item.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.codigoAsignatura}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-normal">{item.nombreAsignatura}</p>
                          {item.error && <p className="text-xs text-red-600 mt-1">{item.error}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.fechaClase}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.horaInicio} - {item.horaFin}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {previewData.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrando 5 de {previewData.length} registros
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancelPreview}
                className="flex-1 bg-transparent"
              >
                Volver
              </Button>
              <Button onClick={handleConfirmUpload} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  'Confirmar carga'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {uploadResult && (
          <div
            className={`p-6 rounded-lg border-2 ${
              uploadResult.success
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
                  className={`font-normal ${
                    uploadResult.success
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {uploadResult.success ? 'Carga completada' : 'Error en la carga'}
                </h3>
                <p
                  className={`text-sm ${
                    uploadResult.success
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {uploadResult.success
                    ? `${uploadResult.processedRows} de ${uploadResult.totalRows} registros procesados`
                    : 'Se encontraron errores al procesar el archivo'}
                </p>
              </div>
            </div>

            {!uploadResult.success && uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-normal text-red-800 dark:text-red-200">Errores:</p>
                <div className="bg-white/50 dark:bg-black/20 rounded p-3">
                  {uploadResult.errors.map((error: string, index: number) => (
                    <p key={index} className="text-xs text-red-700 dark:text-red-300">
                      • {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={resetForm} className="mt-4 w-full bg-transparent" variant="outline">
              Cargar otro archivo
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
