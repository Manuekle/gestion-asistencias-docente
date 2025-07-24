'use client';

'use client';

import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User } from '@/types';
import { Role } from '@prisma/client';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: User) => void;
}

const initialUserState = {
  name: '',
  correoPersonal: '',
  correoInstitucional: '',
  password: '',
  role: 'ESTUDIANTE' as Role,
  document: '',
  telefono: '',
  codigoEstudiantil: '',
  codigoDocente: '',
};

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [newUser, setNewUser] = useState(initialUserState);
  const [isCreating, setIsCreating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: Role) => {
    setNewUser(prev => ({
      ...prev,
      role: value,
      codigoDocente: '',
      codigoEstudiantil: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo crear el usuario.');
      }

      const createdUser: User = await response.json();
      toast.success('Usuario creado con éxito.');
      onUserCreated(createdUser);
      onClose();
      setNewUser(initialUserState);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Ocurrió un error inesperado.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg font-sans">
        <DialogHeader>
          <DialogTitle className="tracking-tight text-xl">Crear Nuevo Usuario</DialogTitle>
          <DialogDescription className="text-sm">
            Completa los datos para crear un nuevo usuario. Al menos un correo es requerido.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input id="name" name="name" value={newUser.name} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="correoPersonal">Correo Personal</Label>
              <Input
                id="correoPersonal"
                name="correoPersonal"
                type="email"
                value={newUser.correoPersonal}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correoInstitucional">Correo Institucional</Label>
              <Input
                id="correoInstitucional"
                name="correoInstitucional"
                type="email"
                value={newUser.correoInstitucional}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={newUser.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document">Documento</Label>
              <Input
                id="document"
                name="document"
                value={newUser.document}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={newUser.telefono}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select onValueChange={handleRoleChange} defaultValue={newUser.role}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent className="font-sans">
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="DOCENTE">Docente</SelectItem>
                <SelectItem value="ESTUDIANTE">Estudiante</SelectItem>
                <SelectItem value="COORDINADOR">Coordinador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newUser.role === 'ESTUDIANTE' && (
            <div className="space-y-2">
              <Label htmlFor="codigoEstudiantil">Código de Estudiante</Label>
              <Input
                id="codigoEstudiantil"
                name="codigoEstudiantil"
                value={newUser.codigoEstudiantil}
                onChange={handleChange}
              />
            </div>
          )}

          {newUser.role === 'DOCENTE' && (
            <div className="space-y-2">
              <Label htmlFor="codigoDocente">Código de Docente</Label>
              <Input
                id="codigoDocente"
                name="codigoDocente"
                value={newUser.codigoDocente}
                onChange={handleChange}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
