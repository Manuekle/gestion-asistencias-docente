import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Configuración de cookies para desarrollo y producción
const isProduction = process.env.NODE_ENV === 'production';
let baseUrl = process.env.NEXTAUTH_URL || 'https://edutrack-fup.vercel.app';
// Ensure the URL has a protocol
if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
  baseUrl = `https://${baseUrl}`;
}
const useSecureCookies = baseUrl.startsWith('https://') || isProduction;
const cookiePrefix = useSecureCookies ? '__Secure-' : '';

// URL base ya configurada arriba
console.log('Configurando NextAuth con URL base:', baseUrl);

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Correo Electrónico', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findFirst({
          where: {
            OR: [{ correoPersonal: credentials.email }, { correoInstitucional: credentials.email }],
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

        if (isPasswordCorrect) {
          return {
            id: user.id,
            role: user.role,
            name: user.name,
            correoPersonal: user.correoPersonal,
            correoInstitucional: user.correoInstitucional,
            signatureUrl: user.signatureUrl,
            codigoDocente: user.codigoDocente,
            codigoEstudiantil: user.codigoEstudiantil,
            telefono: user.telefono,
            document: user.document,
            isActive: user.isActive,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Al iniciar sesión, se agrega la información del usuario al token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.correoPersonal = user.correoPersonal;
        token.correoInstitucional = user.correoInstitucional;
        token.signatureUrl = user.signatureUrl;
        token.codigoDocente = user.codigoDocente;
        token.codigoEstudiantil = user.codigoEstudiantil;
        token.telefono = user.telefono;
        token.document = user.document;
        token.isActive = user.isActive;
      }

      // Cuando se actualiza la sesión (por ejemplo, al cambiar la firma)
      if (trigger === 'update') {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
        });

        if (dbUser) {
          // Actualizar el token con la nueva información de la base de datos
          token.name = dbUser.name;
          token.correoPersonal = dbUser.correoPersonal;
          token.correoInstitucional = dbUser.correoInstitucional;
          token.signatureUrl = dbUser.signatureUrl;
          token.codigoDocente = dbUser.codigoDocente;
          token.codigoEstudiantil = dbUser.codigoEstudiantil;
          token.telefono = dbUser.telefono;
          token.document = dbUser.document;
          token.isActive = dbUser.isActive;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as Role,
          name: token.name as string,
          correoPersonal: token.correoPersonal as string,
          correoInstitucional: token.correoInstitucional as string,
          signatureUrl: token.signatureUrl as string | null,
          codigoDocente: token.codigoDocente as string | null,
          codigoEstudiantil: token.codigoEstudiantil as string | null,
          telefono: token.telefono as string | null,
          document: token.document as string | null,
          isActive: token.isActive as boolean,
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Si la URL es un callback de autenticación, redirigir al dashboard
      if (url.includes('/api/auth/signin')) {
        return `${baseUrl}/dashboard`;
      }
      // Si es una ruta relativa, agregar la URL base
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Si la URL ya es absoluta, usarla directamente
      // Verificar si la URL es válida
      if (url.startsWith('http')) {
        try {
          const urlObj = new URL(url);
          if (urlObj.origin === baseUrl) return url;
        } catch {
          // En caso de error, continuar con la URL base
        }
      }
      return baseUrl;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
    verifyRequest: '/login',
    newUser: '/login',
  },

  theme: {
    colorScheme: 'light',
    logo: '/logo.png',
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        domain: process.env.NODE_ENV === 'production' ? '.edutrack-fup.vercel.app' : undefined,
      },
    },
  },
};
