import type { LucideIcon } from 'lucide-react';
import type { Role } from '.';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  badge?: string | number;
  description?: string;
}

export interface NavLinkGroup {
  title: string;
  roles?: Role[];
  links: NavLink[];
  icon?: LucideIcon;
}

// Exportar tipos que faltan
export type { User, Role as ValidRole } from '.';
