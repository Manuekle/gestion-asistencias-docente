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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Role, User } from '@/types';
import { ROLES } from '@/types';
import { useState } from 'react';
import { toast } from 'sonner';

interface EditUserRoleModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (updatedUser: User) => void;
}

export function EditUserRoleModal({ user, isOpen, onClose, onUserUpdate }: EditUserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !selectedRole) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el rol del usuario');
      }

      const updatedUser = await response.json();
      onUserUpdate(updatedUser);
      toast.success(`El rol de ${updatedUser.name} ha sido actualizado a ${updatedUser.role}.`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar el rol del usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-semibold tracking-tight">
            Editar Rol de {user.name}
          </DialogTitle>
          <DialogDescription>
            Selecciona el nuevo rol para el usuario. Este cambio afectará sus permisos en el
            sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select
            onValueChange={value => setSelectedRole(value as Role)}
            defaultValue={user.role as Role}
          >
            <SelectTrigger className="lowercase">
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(role => (
                <SelectItem className="lowercase" key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !selectedRole}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
