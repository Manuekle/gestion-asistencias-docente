'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Label } from '@/components/ui/label';
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
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// Tipos de datos actualizados para reflejar el nuevo esquema
type AttendanceFull = {
  id: string;
  status: string;
  student: {
    name: string | null;
  };
  class: {
    id: string;
    date: string;
    topic: string | null;
    subject: {
      name: string;
    };
  };
};

type User = {
  id: string;
  name: string | null;
  role: string;
};

type ClassInfo = {
  id: string;
  date: string;
  topic: string | null;
  subject: {
    name: string;
    code: string;
  };
};

export default function AttendancesAdminPage() {
  const [attendances, setAttendances] = useState<AttendanceFull[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para la creación
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAttendanceData, setNewAttendanceData] = useState({
    studentId: '',
    classId: '',
    status: 'Presente',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Estados para la edición
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceFull | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Estados para la eliminación
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAttendanceId, setDeletingAttendanceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [attendancesRes, usersRes, classesRes] = await Promise.all([
          fetch('/api/attendances'),
          fetch('/api/users'),
          fetch('/api/admin/clases'),
        ]);

        if (!attendancesRes.ok) throw new Error('No se pudieron cargar las asistencias.');
        if (!usersRes.ok) throw new Error('No se pudieron cargar los usuarios.');
        if (!classesRes.ok) throw new Error('No se pudieron cargar las clases.');

        const attendancesData = await attendancesRes.json();
        const usersData = await usersRes.json();
        const classesData = await classesRes.json();

        setAttendances(attendancesData);
        setUsers(usersData.filter((u: User) => u.role === 'USER')); // Solo mostrar estudiantes
        setClasses(classesData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateSelectChange = (name: string, value: string) => {
    setNewAttendanceData({ ...newAttendanceData, [name]: value });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendanceData.studentId || !newAttendanceData.classId) {
      setCreateError('El estudiante y la clase son obligatorios.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAttendanceData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'No se pudo crear la asistencia.');
      }

      const createdAttendance = await response.json();
      setAttendances([createdAttendance, ...attendances]);
      setSuccess('Asistencia creada con éxito.');
      setIsCreateDialogOpen(false);
      setNewAttendanceData({ studentId: '', classId: '', status: 'Presente' });
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (attendance: AttendanceFull) => {
    setEditingAttendance(attendance);
    setUpdateError(null);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSelectChange = (name: string, value: string) => {
    if (!editingAttendance) return;
    setEditingAttendance({ ...editingAttendance, [name]: value });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendance) return;

    setIsUpdating(true);
    setUpdateError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/attendances?id=${editingAttendance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editingAttendance.status }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'No se pudo actualizar la asistencia.');
      }

      const updatedAttendance = await response.json();
      setAttendances(
        attendances.map(att => (att.id === updatedAttendance.id ? updatedAttendance : att))
      );
      setSuccess('Asistencia actualizada con éxito.');
      setIsEditDialogOpen(false);
    } catch (err: any) {
      setUpdateError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingAttendanceId(id);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAttendanceId) return;
    setIsDeleting(true);
    setDeleteError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/attendances?id=${deletingAttendanceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'No se pudo eliminar la asistencia.');
      }

      setAttendances(attendances.filter(att => att.id !== deletingAttendanceId));
      setSuccess('Asistencia eliminada con éxito.');
      setIsDeleteDialogOpen(false);
      setDeletingAttendanceId(null);
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <Loading />;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestión de Asistencias</CardTitle>
            <CardDescription>Crea, edita y elimina los registros de asistencia.</CardDescription>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nueva Asistencia
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-4">
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asignatura</TableHead>
              <TableHead>Fecha de Clase</TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendances.map(attendance => (
              <TableRow key={attendance.id}>
                <TableCell>{attendance.class.subject.name}</TableCell>
                <TableCell>{new Date(attendance.class.date).toLocaleString()}</TableCell>
                <TableCell>{attendance.student.name || 'N/A'}</TableCell>
                <TableCell>{attendance.status}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(attendance)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(attendance.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Dialogo para Crear Asistencia */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Asistencia</DialogTitle>
            <DialogDescription>
              Selecciona el estudiante, la clase y el estado de la asistencia.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="studentId" className="text-right">
                  Estudiante
                </Label>
                <Select onValueChange={value => handleCreateSelectChange('studentId', value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un estudiante" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="classId" className="text-right">
                  Clase
                </Label>
                <Select onValueChange={value => handleCreateSelectChange('classId', value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona una clase" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {`${c.subject.name} - ${new Date(c.date).toLocaleDateString()}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Estado
                </Label>
                <Select
                  onValueChange={value => handleCreateSelectChange('status', value)}
                  defaultValue={newAttendanceData.status}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Presente">Presente</SelectItem>
                    <SelectItem value="Ausente">Ausente</SelectItem>
                    <SelectItem value="Tardanza">Tardanza</SelectItem>
                    <SelectItem value="Justificado">Justificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {createError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear Asistencia'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo para Editar Asistencia */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Asistencia</DialogTitle>
            <DialogDescription>Actualiza el estado de la asistencia.</DialogDescription>
          </DialogHeader>
          {editingAttendance && (
            <form onSubmit={handleUpdateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Estudiante</Label>
                  <p className="col-span-3 font-normal">{editingAttendance.student.name}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Clase</Label>
                  <p className="col-span-3">{`${editingAttendance.class.subject.name} - ${new Date(editingAttendance.class.date).toLocaleString()}`}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status-edit" className="text-right">
                    Estado
                  </Label>
                  <Select
                    onValueChange={value => handleUpdateSelectChange('status', value)}
                    defaultValue={editingAttendance.status}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Presente">Presente</SelectItem>
                      <SelectItem value="Ausente">Ausente</SelectItem>
                      <SelectItem value="Tardanza">Tardanza</SelectItem>
                      <SelectItem value="Justificado">Justificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {updateError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Actualizando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogo para Confirmar Eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro de
              asistencia.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
