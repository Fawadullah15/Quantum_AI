import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './db'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
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
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tokenVersion: user.tokenVersion,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tokenVersion = (user as any).tokenVersion
      }

      if (trigger === 'update' && session) {
        if (session.user?.name) token.name = session.user.name
        if (session.user?.email) token.email = session.user.email
        if (session.user?.tokenVersion !== undefined) token.tokenVersion = session.user.tokenVersion
      }

      // Check if user session has been revoked
      if (token.id && token.tokenVersion !== undefined) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { tokenVersion: true },
          })
          if (!dbUser || dbUser.tokenVersion !== token.tokenVersion) {
            // Revoked session
            return {} as any
          }
        } catch {
          // If DB is temporarily unreachable, fallback to token
        }
      }

      return token
    },
    session({ session, token }) {
      if (token && token.id && session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).tokenVersion = token.tokenVersion
      }
      return session
    },
  },
}
