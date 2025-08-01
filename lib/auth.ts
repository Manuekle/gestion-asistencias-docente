import { db } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Configuración de cookies para desarrollo y producción
const isProduction = process.env.NODE_ENV === 'production';
let baseUrl = process.env.NEXTAUTH_URL || 'https://gestion-asistencias-docente.vercel.app';
// Ensure the URL has a protocol
if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
  baseUrl = `https://${baseUrl}`;
}
const useSecureCookies = baseUrl.startsWith('https://') || isProduction;
const cookiePrefix = useSecureCookies ? '__Secure-' : '';
const hostName = new URL(baseUrl).hostname;

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
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name;
        session.user.correoPersonal = token.correoPersonal;
        session.user.correoInstitucional = token.correoInstitucional;
        session.user.signatureUrl = token.signatureUrl;
        // Incluir el token de acceso en la sesión
        session.accessToken = token.accessToken;
      }
      return session;
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
        // Only set domain for production, not for localhost or IP addresses
        domain:
          hostName === 'localhost' ||
          hostName.startsWith('192.168.') ||
          hostName.startsWith('127.0.') ||
          hostName === '[::1]'
            ? undefined
            : hostName.includes('vercel.app')
              ? hostName // For Vercel preview and production URLs
              : `.${hostName}`, // For custom domains
      },
    },
  },
};
