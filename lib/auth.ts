import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './db';
import { checkRateLimit, resetRateLimit } from './rate-limit';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'quantum-ai-secret-encryption-key-production-32-chars',
  pages: { signIn: '/admin/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const cleanEmail = credentials.email.trim().toLowerCase();
        const rateLimit = checkRateLimit(`auth:login:${cleanEmail}`, 8, 5 * 60 * 1000);

        if (!rateLimit.allowed) {
          throw new Error('Too many login attempts. Account temporarily locked for 5 minutes.');
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: cleanEmail },
          });

          if (!user) return null;

          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) return null;

          resetRateLimit(`auth:login:${cleanEmail}`);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tokenVersion: user.tokenVersion,
          };
        } catch (dbErr) {
          console.error('[Auth Error] Database lookup failed:', dbErr);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tokenVersion = (user as any).tokenVersion;
      }

      if (trigger === 'update' && session) {
        if (session.user?.name) token.name = session.user.name;
        if (session.user?.email) token.email = session.user.email;
        if (session.user?.tokenVersion !== undefined) token.tokenVersion = session.user.tokenVersion;
      }

      return token;
    },
    session({ session, token }: any) {
      if (token && token.id) {
        session.user = {
          ...session.user,
          id: token.id as string,
          name: (token.name as string) || session.user?.name || 'Admin',
          email: (token.email as string) || session.user?.email || 'admin@quantumai.dev',
          role: (token.role as string) || 'SUPER_ADMIN',
        } as any;
      }
      return session;
    },
  },
};
