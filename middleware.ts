import { Role } from '@prisma/client';
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;
    const userRole = token?.role as Role;

    // Crear response con headers de seguridad
    const response = NextResponse.next();

    // Headers de seguridad
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // --- Redirection from root dashboard ---
    if (pathname === '/dashboard') {
      let targetPath: string;
      switch (userRole) {
        case Role.ADMIN:
          targetPath = '/dashboard/admin';
          break;
        case Role.DOCENTE:
          targetPath = '/dashboard/docente';
          break;
        case Role.ESTUDIANTE:
          targetPath = '/dashboard/estudiante';
          break;
        default:
          targetPath = '/';
          break;
      }
      return NextResponse.redirect(new URL(targetPath, req.url));
    }

    // --- API Route Protection ---
    if (pathname.startsWith('/api/')) {
      // Headers adicionales para APIs
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

      const unauthorizedResponse = NextResponse.json(
        { message: 'Acceso denegado.' }, // Mensaje genérico
        { status: 403 }
      );

      // Validaciones más específicas
      if (pathname.startsWith('/api/admin') && userRole !== Role.ADMIN) {
        return unauthorizedResponse;
      }

      if (
        pathname.startsWith('/api/docente') &&
        userRole !== Role.DOCENTE &&
        userRole !== Role.ADMIN
      ) {
        return unauthorizedResponse;
      }

      if (pathname.startsWith('/api/users')) {
        const allowedRoles = [Role.ADMIN, Role.DOCENTE, Role.ESTUDIANTE, Role.COORDINADOR];
        if (!allowedRoles.includes(userRole)) {
          return unauthorizedResponse;
        }
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

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    // Proteger rutas específicas
    '/dashboard/:path*',
    '/api/admin/:path*',
    '/api/users/:path*',
    '/api/docente/:path*',
    // Excluir rutas públicas explícitamente
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
