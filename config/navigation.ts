import type { NavLinkGroup } from '@/types/navigation';
import {
  BookMarked,
  BookOpen,
  GraduationCap,
  Home,
  QrCode,
  Settings,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';

export const navLinkGroups: NavLinkGroup[] = [
  {
    title: 'Panel Principal',
    icon: Home,
    links: [
      {
        href: '/dashboard',
        icon: Home,
        label: 'Inicio',
        roles: ['ADMIN', 'DOCENTE', 'ESTUDIANTE'],
        description: 'Vista general del sistema',
      },
      {
        href: '/dashboard/profile',
        icon: User,
        label: 'Perfil',
        roles: ['ADMIN', 'DOCENTE', 'ESTUDIANTE'],
        description: 'Gestiona tu información personal',
      },
    ],
  },
  {
    title: 'Área Estudiantil',
    roles: ['ESTUDIANTE'],
    icon: GraduationCap,
    links: [
      {
        href: '/dashboard/estudiante/asistencia',
        icon: QrCode,
        label: 'Registrar Asistencia',
        roles: ['ESTUDIANTE'],
        description: 'Escanear código QR para asistencia',
      },
      {
        href: '/dashboard/estudiante/historial',
        icon: TrendingUp,
        label: 'Historial de Asistencias',
        roles: ['ESTUDIANTE'],
        description: 'Consulta tus asistencias',
      },
    ],
  },
  {
    title: 'Área Docente',
    roles: ['DOCENTE'],
    icon: BookOpen,
    links: [
      {
        href: '/dashboard/docente/asignaturas',
        icon: BookMarked,
        label: 'Mis Asignaturas',
        roles: ['DOCENTE'],
        description: 'Gestiona tus asignaturas y estudiantes',
      },
      {
        href: '/dashboard/docente/cargar-asignaturas',
        icon: BookMarked,
        label: 'Cargar Asignaturas',
        roles: ['DOCENTE'],
        description: 'Cargar asignaturas y clases desde un archivo Excel',
      },
    ],
  },
  {
    title: 'Administración',
    roles: ['ADMIN'],
    icon: Settings,
    links: [
      {
        href: '/dashboard/admin/usuarios',
        icon: Users,
        label: 'Gestión de Usuarios',
        roles: ['ADMIN'],
        description: 'Administrar cuentas de usuario',
      },
      {
        href: '/dashboard/admin/reportes',
        icon: TrendingUp,
        label: 'Reportes Docentes',
        roles: ['ADMIN'],
        description: 'Reportes generales de docentes',
      },
      {
        href: '/dashboard/admin/solicitudes',
        icon: TrendingUp,
        label: 'Solicitudes',
        roles: ['ADMIN'],
        description: 'Solicitudes de desmatriculación',
      },
    ],
  },
];
