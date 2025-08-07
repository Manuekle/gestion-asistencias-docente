import { Role } from '@prisma/client';
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;
    const userRole = token?.role as Role;

    // --- Redirection from root dashboard ---
    if (pathname === '/dashboard') {
      let targetPath: string;
      switch (userRole) {
        case Role.ADMIN:
          // El admin puede ver la página principal del dashboard,
          return NextResponse.redirect(new URL('/dashboard/admin', req.url));
        case Role.DOCENTE:
          targetPath = '/dashboard/docente';
          break;
        case Role.ESTUDIANTE:
          targetPath = '/dashboard/estudiante';
          break;
        default:
          // Si no tiene un rol definido, lo enviamos a la página de inicio.
          targetPath = '/';
          break;
      }
      return NextResponse.redirect(new URL(targetPath, req.url));
    }

    // --- API Route Protection ---
    if (pathname.startsWith('/api/')) {
      const unauthorizedResponse = NextResponse.json(
        { message: 'No autorizado para este recurso.' },
        { status: 403 }
      );

      if (pathname.startsWith('/api/admin') && userRole !== Role.ADMIN) {
        return unauthorizedResponse;
      }
      if (
        pathname.startsWith('/api/users') &&
        userRole !== Role.ADMIN &&
        userRole !== Role.DOCENTE &&
        userRole !== Role.ESTUDIANTE
      ) {
        return unauthorizedResponse;
      }
      if (pathname.startsWith('/api/docente') && userRole !== Role.DOCENTE) {
        return unauthorizedResponse;
      }
    }

    // --- Page Route Protection ---
    if (pathname.startsWith('/dashboard/')) {
      const homeUrl = new URL('/', req.url);

      if (pathname.startsWith('/dashboard/admin') && userRole !== Role.ADMIN) {
        return NextResponse.redirect(homeUrl);
      }
      if (pathname.startsWith('/dashboard/docente') && userRole !== Role.DOCENTE) {
        return NextResponse.redirect(homeUrl);
      }
      if (pathname.startsWith('/dashboard/estudiante') && userRole !== Role.ESTUDIANTE) {
        return NextResponse.redirect(homeUrl);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    // Proteger todas las rutas del dashboard
    '/dashboard',
    '/dashboard/:path*',
    // Proteger las APIs específicas de roles
    '/api/admin/:path*',
    '/api/users/:path*',
    '/api/docente/:path*',
  ],
};
