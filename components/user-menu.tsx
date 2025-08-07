'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User as UserType, ValidRole } from '@/types/navigation';
import { LogOut, SettingsIcon, User } from 'lucide-react';

interface UserMenuProps {
  user: UserType | null;
  onSignOut: () => void;
  getRoleDisplayName: (role: ValidRole) => string;
}

export function UserMenu({ user, onSignOut, getRoleDisplayName }: UserMenuProps) {
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start h-auto p-2 hover:bg-sidebar-accent">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src="/placeholder.svg" alt={user.name || 'Usuario'} />
            <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {user.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3 text-left overflow-hidden flex-1">
            <p className="text-xs font-normal truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {getRoleDisplayName(user.role)}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" side="right" align="end">
        <div className="px-2 py-1.5">
          <p className="text-xs font-normal">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.correoInstitucional}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SettingsIcon className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
