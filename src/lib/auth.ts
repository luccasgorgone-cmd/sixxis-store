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

      const existente = await prisma.cliente.findUnique({ where: { email } })

      if (!existente) {
        const novo = await prisma.cliente.create({
          data: {
            email,
            nome: user.name ?? email.split('@')[0],
            senha: '',
            avatar: user.image ?? null,
          },
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
