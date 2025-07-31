import HomePageClient from '@/components/landing/HomePageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'eduTrack: Gestión de Asistencia con QR para la FUP',
  description:
    'Bienvenido a eduTrack, la solución moderna para la gestión de asistencia en la FUP. Simplifica el seguimiento de estudiantes con códigos QR, ahorra tiempo y mejora la eficiencia académica.',
};

export default function HomePage() {
  return <HomePageClient />;
}
