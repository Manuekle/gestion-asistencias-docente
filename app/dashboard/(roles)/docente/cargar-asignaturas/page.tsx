'use client';

import { SubjectFileUpload } from '@/components/SubjectFileUpload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Icons from lucide-react
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { CheckCircle, ChevronDown, Download, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

// Interface for the raw data from the API/Excel file
interface RawApiPreviewItem {
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditosClase: number;
  fechaClase: string;
  horaInicio: string;
  horaFin: string;
  temaClase?: string; // Optional
  descripcionClase?: string; // Optional
  semestreAsignatura: number;
  programa: string;
  error?: string;
  isDuplicate?: boolean;
}

// Interface for a class's data within the component's state
interface ClassDataItem {
  id: number; // Temporary unique ID for React keys
  fechaClase: string;
  horaInicio: string;
  horaFin: string;
  temaClase: string;
  descripcionClase: string;
}

// Interface for a subject, including its classes, for the preview
interface PreviewItem {
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditosClase: number;
  semestreAsignatura: number;
  programa: string;
  status: 'success' | 'error' | 'duplicate';
  classes: ClassDataItem[];
  error?: string;
}

// Interface for the data being edited in the dialog
interface EditableClass {
  subjectCodigo: string;
  subjectName: string;
  classId: string;
  fechaClase: string;
  horaInicio: string;
  horaFin: string;
  temaClase: string;
  descripcionClase: string;
}

export default function UploadSubjectsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [uploadResult, setUploadResult] = useState<{
    processed: number;
    errors: string[];
  } | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<EditableClass | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    // Reset preview state if file is deselected
    if (!selectedFile) {
      setIsPreview(false);
      setPreviewData([]);
      setUploadResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo .xlsx para continuar.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('preview', 'true');

    try {
      const response = await fetch('/api/docente/cargar-asignaturas', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener la vista previa');
      }

      const groupedBySubject: Record<string, PreviewItem> = {};

      for (const item of result.previewData as RawApiPreviewItem[]) {
        const subjectCode = item.codigoAsignatura;

        if (!groupedBySubject[subjectCode]) {
          let status: 'success' | 'error' | 'duplicate' = 'success';
          if (item.error) {
            status = 'error';
          } else if (item.isDuplicate) {
            status = 'duplicate';
          }

          groupedBySubject[subjectCode] = {
            codigoAsignatura: subjectCode,
            nombreAsignatura: item.nombreAsignatura ?? '',
            creditosClase: item.creditosClase ?? 0,
            semestreAsignatura: item.semestreAsignatura ?? 0,
            programa: item.programa ?? '',
            status,
            classes: [],
            error: item.error,
          };
        }

        // Add class only if the row itself doesn't have an error about the class fields
        if (!item.error) {
          groupedBySubject[subjectCode].classes.push({
            id: groupedBySubject[subjectCode].classes.length,
            fechaClase: item.fechaClase ? item.fechaClase.split('T')[0] : '', // Format to YYYY-MM-DD
            horaInicio: item.horaInicio ?? '',
            horaFin: item.horaFin ?? '',
            temaClase: item.temaClase ?? '',
            descripcionClase: item.descripcionClase ?? '',
          });
        }
      }

      setPreviewData(Object.values(groupedBySubject));
      setIsPreview(true);
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('No hay archivo para cargar.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/docente/cargar-asignaturas', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar el archivo');
      }

      setUploadResult({
        processed: result.processed || 0,
        errors: result.errors || [],
      });
      toast.success('Archivo cargado exitosamente!');
      setIsPreview(false);
      setPreviewData([]);
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setUploadResult(null);
    setExpandedSubjects(new Set());
  };

  const handleNewUpload = () => {
    setFile(null);
    setIsPreview(false);
    setPreviewData([]);
    setUploadResult(null);
    setExpandedSubjects(new Set());
  };

  const toggleSubjectExpansion = (subjectCode: string) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subjectCode)) {
        newSet.delete(subjectCode);
      } else {
        newSet.add(subjectCode);
      }
      return newSet;
    });
  };

  const handleEditClick = (subject: PreviewItem, classItem: ClassDataItem) => {
    setEditingClass({
      subjectCodigo: subject.codigoAsignatura,
      subjectName: subject.nombreAsignatura,
      classId: String(classItem.id),
      fechaClase: classItem.fechaClase,
      horaInicio: classItem.horaInicio,
      horaFin: classItem.horaFin,
      temaClase: classItem.temaClase,
      descripcionClase: classItem.descripcionClase,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveClass = () => {
    if (!editingClass) return;

    const updatedPreviewData = previewData.map(subject => {
      if (subject.codigoAsignatura === editingClass.subjectCodigo) {
        const updatedClasses = subject.classes.map(classItem => {
          if (String(classItem.id) === editingClass.classId) {
            return {
              ...classItem,
              fechaClase: editingClass.fechaClase,
              horaInicio: editingClass.horaInicio,
              horaFin: editingClass.horaFin,
              temaClase: editingClass.temaClase,
              descripcionClase: editingClass.descripcionClase,
            };
          }
          return classItem;
        });
        return { ...subject, classes: updatedClasses };
      }
      return subject;
    });

    setPreviewData(updatedPreviewData);
    setIsEditDialogOpen(false);
    setEditingClass(null);
    toast.success('Clase actualizada correctamente.');
  };

  const handleEditingClassChange = (
    field: keyof EditableClass,
    value: string | Date | undefined
  ) => {
    if (editingClass) {
      let finalValue = value;
      if (field === 'fechaClase' && value instanceof Date) {
        // Formatear la fecha a YYYY-MM-DD para mantener la consistencia del estado
        finalValue = value.toISOString().split('T')[0];
      }
      setEditingClass({ ...editingClass, [field]: finalValue });
    }
  };

  return (
    <main className="space-y-4">
      {/* Header */}
      <div className="pb-4 col-span-1 w-full">
        <CardTitle className="text-2xl font-semibold tracking-heading">
          Cargar Asignaturas y Clases
        </CardTitle>
        <CardDescription className="text-xs">
          Sube un archivo .xlsx para cargar masivamente las asignaturas y sus respectivas clases.
        </CardDescription>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Download Template */}
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
              <a href="/formatos/plantilla_docente_asignaturas_clases.xlsx" download>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Plantilla
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Upload Form */}
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
                  disabled={!file || isLoading}
                  className="w-full text-xs"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <></>}
                  Vista Previa
                </Button>
                {isPreview && (
                  <Button onClick={handleCancel} variant="destructive" className="w-full text-xs">
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

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
                <div className="mt-4 bg-card text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  </div>
                  <h3 className="font-medium text-xl tracking-heading">Carga completada</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Se procesaron {uploadResult.processed} asignaturas.
                  </p>

                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="space-y-3 mt-4 text-left">
                      <p className="text-sm font-medium text-red-600">Detalles de errores:</p>
                      <div className="bg-muted/50 rounded-md p-3 max-h-40 overflow-y-auto">
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-500">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleNewUpload} className="mt-6">
                    Cargar otro archivo
                  </Button>
                </div>
              ) : isPreview && previewData.length > 0 ? (
                <>
                  <div className="rounded-lg border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/60">
                          <TableHead className="text-xs font-normal px-4 py-2">Código</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2">
                            Nombre Asignatura
                          </TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2">Créditos</TableHead>
                          <TableHead className="text-xs font-normal px-4 py-2">Estado</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map(subject => (
                          <React.Fragment key={subject.codigoAsignatura}>
                            <TableRow className="hover:bg-muted/50 transition-colors">
                              <TableCell className="text-xs font-normal px-4 py-2 font-mono">
                                {subject.codigoAsignatura}
                              </TableCell>
                              <TableCell className="text-xs font-normal px-4 py-2">
                                {subject.nombreAsignatura}
                              </TableCell>
                              <TableCell className="text-xs font-normal px-4 py-2">
                                {subject.creditosClase}
                              </TableCell>
                              <TableCell>
                                {subject.status === 'duplicate' ? (
                                  <Badge variant="destructive" className="text-xs">
                                    Duplicado
                                  </Badge>
                                ) : subject.status === 'error' ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs font-normal text-white"
                                  >
                                    Error
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs font-normal">
                                    Correcto
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {subject.classes.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleSubjectExpansion(subject.codigoAsignatura)}
                                    className="h-8 w-8 p-0 hover:bg-muted"
                                  >
                                    <ChevronDown
                                      className={`h-4 w-4 transition-transform duration-200 ${
                                        expandedSubjects.has(subject.codigoAsignatura)
                                          ? 'rotate-180'
                                          : ''
                                      }`}
                                    />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>

                            {expandedSubjects.has(subject.codigoAsignatura) && (
                              <TableRow className="hover:bg-none">
                                <TableCell colSpan={5} className="p-0">
                                  <div className="bg-muted/20 px-4 py-3">
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="font-medium text-sm">Clases Programadas</h4>
                                      <Badge variant="outline" className="text-xs font-normal">
                                        {subject.classes.length} clases
                                      </Badge>
                                    </div>

                                    {subject.classes.length > 0 ? (
                                      <div className="space-y-3">
                                        {subject.classes.map(cls => (
                                          <div
                                            key={cls.id}
                                            className="bg-background rounded-md border p-4 hover:bg-muted/30 transition-colors"
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-6">
                                                <div>
                                                  <p className="text-xs text-muted-foreground mb-1">
                                                    Fecha
                                                  </p>
                                                  <p className="text-sm font-medium">
                                                    {cls.fechaClase}
                                                  </p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-muted-foreground mb-1">
                                                    Inicio
                                                  </p>
                                                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                                    {cls.horaInicio}
                                                  </code>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-muted-foreground mb-1">
                                                    Fin
                                                  </p>
                                                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                                    {cls.horaFin}
                                                  </code>
                                                </div>
                                              </div>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditClick(subject, cls)}
                                                className="h-8 px-3 text-xs"
                                              >
                                                Editar
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="bg-background rounded-md border p-8 text-center">
                                        <div className="text-muted-foreground">
                                          <p className="text-sm">No hay clases programadas</p>
                                          <p className="text-xs mt-1">
                                            Las clases aparecerán aquí cuando sean agregadas
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleUpload}
                      disabled={isLoading || previewData.every(s => s.status !== 'success')}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <></>}
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

      {/* Edit Dialog */}
      {editingClass && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-sans text-xl font-semibold tracking-tight">
                Editar Clase
              </DialogTitle>
              <DialogDescription className="font-sans text-xs text-muted-foreground">
                Modifica los detalles de la clase para la asignatura{' '}
                <span className="font-semibold">
                  {editingClass.subjectName} ({editingClass.subjectCodigo})
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fechaClase" className="text-right">
                  Fecha
                </Label>
                <DatePicker
                  value={editingClass.fechaClase ? new Date(editingClass.fechaClase) : undefined}
                  onChange={date => handleEditingClassChange('fechaClase', date)}
                  className="col-span-3 text-xs "
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="horaInicio" className="text-right">
                  Hora Inicio
                </Label>
                <TimePicker
                  value={editingClass.horaInicio}
                  onChange={time => handleEditingClassChange('horaInicio', time)}
                  className="col-span-3 text-xs"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="horaFin" className="text-right">
                  Hora Fin
                </Label>
                <TimePicker
                  value={editingClass.horaFin}
                  onChange={time => handleEditingClassChange('horaFin', time)}
                  className="col-span-3 text-xs"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="temaClase" className="text-right">
                  Tema
                </Label>
                <Input
                  id="temaClase"
                  value={editingClass.temaClase}
                  onChange={e => handleEditingClassChange('temaClase', e.target.value)}
                  className="col-span-3 text-xs"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="descripcionClase" className="text-right">
                  Descripción
                </Label>
                <Input
                  id="descripcionClase"
                  value={editingClass.descripcionClase}
                  onChange={e => handleEditingClassChange('descripcionClase', e.target.value)}
                  className="col-span-3 text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveClass}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
