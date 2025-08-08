import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// 🔧 Configuración según entorno
const isProduction = process.env.NODE_ENV === 'production';
let baseUrl = process.env.NEXTAUTH_URL || 'https://edutrack-fup.vercel.app';

if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
  baseUrl = `https://${baseUrl}`;
}

const useSecureCookies = baseUrl.startsWith('https://') || isProduction;
const cookiePrefix = useSecureCookies ? '__Secure-' : '';

console.log('⚙️ Configurando NextAuth con URL base:', baseUrl);

export const authOptions: NextAuthOptions = {
  debug: !isProduction,

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Correo Electrónico', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findFirst({
          where: {
            OR: [{ correoPersonal: credentials.email }, { correoInstitucional: credentials.email }],
          },
        });

        if (!user || !user.password) return null;

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordCorrect) return null;

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
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        Object.assign(token, user);
      }

      if (trigger === 'update') {
        const dbUser = await db.user.findUnique({ where: { id: token.id as string } });
        if (dbUser) {
          Object.assign(token, dbUser);
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
      // Redirección segura dentro del dominio
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },

  pages: {
    signIn: '/login',
    error: '/auth/error', // ⚠️ Página separada para evitar bucles
    signOut: '/login',
    verifyRequest: '/login',
    newUser: '/login',
  },

  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        domain: isProduction ? '.edutrack-fup.vercel.app' : undefined,
      },
    },
  },

  theme: {
    colorScheme: 'light',
    logo: '/logo.png',
  },
};
