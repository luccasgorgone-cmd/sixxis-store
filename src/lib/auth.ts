import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const cliente = await prisma.cliente.findUnique({
          where: { email: parsed.data.email },
        })
        if (!cliente) return null

        // OAuth-first sem senha local: senha == '' não loga via credentials.
        if (!cliente.senha) return null

        const senhaValida = await bcrypt.compare(parsed.data.password, cliente.senha)
        if (!senhaValida) return null

        if (cliente.bloqueado) throw new Error('Conta bloqueada. Entre em contato com o suporte.')

        return { id: cliente.id, name: cliente.nome, email: cliente.email }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  // Explícito p/ robustez: NextAuth v5 lê AUTH_SECRET e cai p/ NEXTAUTH_SECRET.
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  // Atrás do proxy do Railway (www.sixxis.com.br) — confia no x-forwarded-host.
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true

      const email = user.email
      if (!email) return false

      try {
        // select estreito — robusto contra drift de schema e evita payload extra.
        const existente = await prisma.cliente.findUnique({
          where: { email },
          select: { id: true, bloqueado: true, avatar: true },
        })

        if (!existente) {
          const novo = await prisma.cliente.create({
            data: {
              email,
              nome: user.name ?? email.split('@')[0],
              senha: '', // OAuth-first: sem senha local
              avatar: user.image ?? null,
            },
            select: { id: true },
          })
          user.id = novo.id
          return true
        }

        if (existente.bloqueado) return false

        if (user.image && user.image !== existente.avatar) {
          await prisma.cliente.update({
            where: { id: existente.id },
            data: { avatar: user.image },
          })
        }
        user.id = existente.id
        return true
      } catch (e) {
        // Loga a exceção REAL (Prisma/DB) — antes ela era engolida num redirect
        // de erro genérico do NextAuth, escondendo a causa nos logs do Railway.
        console.error('[auth:google] falha ao criar/buscar cliente:', (e as Error).message)
        return false
      }
    },
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})
