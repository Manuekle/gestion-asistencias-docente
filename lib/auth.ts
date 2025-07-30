import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Configuración de cookies para desarrollo y producción
const isProduction = process.env.NODE_ENV === 'production';
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') || isProduction;
const cookiePrefix = useSecureCookies ? '__Secure-' : '';
const hostName = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000').hostname;

// Configuración de la URL base
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.correoPersonal = user.correoPersonal;
        token.correoInstitucional = user.correoInstitucional;
        token.signatureUrl = user.signatureUrl;
        // Incluir el token JWT en el token de sesión
        // Usamos el token firmado que se generará automáticamente
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
        domain: hostName === 'localhost' ? undefined : `.${hostName}`,
      },
    },
  },
};
