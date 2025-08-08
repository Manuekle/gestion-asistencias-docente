import { Role } from '@prisma/client';
import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Rutas públicas que no requieren autenticación
const publicPaths = ['/login', '/_next', '/favicon.ico', '/api/auth', '/icons'];

export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Verificar si es una ruta pública
    const isPublicPath = publicPaths.some(
      path => pathname === path || pathname.startsWith(`${path}/`)
    );

    // Redirigir usuarios autenticados que intentan acceder al login
    if (pathname === '/login') {
      const token = await getToken({ req });

      // Si hay un callbackUrl y el usuario no está autenticado, mantenerlo
      const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');

      if (token) {
        // Si el usuario está autenticado, redirigir según su rol
        const userRole = token.role as Role;
        let targetPath = '/';

        // Si hay un callbackUrl válido y no es el login, usarlo
        if (callbackUrl && !callbackUrl.includes('/login')) {
          targetPath = callbackUrl;
        } else {
          // Si no hay callbackUrl o es inválido, redirigir según el rol
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
          }
        }

        return NextResponse.redirect(new URL(targetPath, req.url));
      }

      // Si hay un callbackUrl y el usuario no está autenticado, mantenerlo
      if (callbackUrl) {
        return NextResponse.next();
      }

      // Limpiar cualquier callbackUrl existente para evitar bucles
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.delete('callbackUrl');
      return NextResponse.rewrite(loginUrl);
    }

    // Si es una ruta pública, permitir el acceso
    if (isPublicPath) {
      return NextResponse.next();
    }

    // Obtener el token solo si es necesario (para rutas protegidas)
    const token = await getToken({ req });
    const userRole = token?.role as Role;

    // Si no hay token, redirigir a login
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      // Eliminar cualquier callbackUrl existente para evitar bucles
      loginUrl.searchParams.delete('callbackUrl');
      return NextResponse.redirect(loginUrl);
    }

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
    // Solo proteger rutas bajo /dashboard y /api
    '/dashboard/:path*',
    '/api/:path*',
    // Excluir explícitamente rutas públicas
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth|icons).*)',
  ],
};
