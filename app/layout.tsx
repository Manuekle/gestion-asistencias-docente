import { Toaster } from '@/components/ui/sonner';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

const siteUrl = 'https://fup-asistencias-docente.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Sistema de Asistencias FUP',
    template: `%s | Asistencias FUP`,
  },
  description:
    'Optimiza la gestión de asistencias en la FUP con códigos QR. Eficiencia para docentes y estudiantes.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Sistema de Asistencias FUP',
    description: 'Gestión de asistencias con códigos QR.',
    url: siteUrl,
    siteName: 'Asistencias FUP',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Banner del Sistema de Asistencias FUP',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sistema de Asistencias FUP',
    description: 'Gestión de asistencias con códigos QR.',
    images: ['/og-image.webp'],
    site: '@fup_asistencias_docente',
  },
  verification: {
    google: '0RPzGmepK5heQ-2axeEVsJ9o2FVPXcNp67TZSjmjF0E',
  },
  icons: {
    icon: '/vercel.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-screen bg-background font-sans text-foreground">
        <Providers>
          {children}
          <Toaster position="top-center" duration={5000} />
        </Providers>
      </body>
    </html>
  );
}
