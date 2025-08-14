import type { LucideIcon } from 'lucide-react';
import type { Role } from '.';

export interface NavLinkBase {
  href: string;
  label: string;
  roles: Role[];
  description?: string;
}

export interface NavLink extends NavLinkBase {
  icon: LucideIcon;
  badge?: string | number;
  subLinks?: NavSubLink[];
  isSubLink?: boolean;
  parentHref?: string;
}

export interface NavSubLink extends NavLinkBase {
  icon?: LucideIcon;
  isSubLink: true;
  parentHref: string;
}

export interface NavLinkGroup {
  title: string;
  roles?: Role[];
  links: NavLink[];
  icon?: LucideIcon;
}

// Exportar tipos que faltan
export type { User, Role as ValidRole } from '.';
