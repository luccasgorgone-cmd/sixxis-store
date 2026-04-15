import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
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

        const senhaValida = await bcrypt.compare(parsed.data.password, cliente.senha)
        if (!senhaValida) return null

        if (cliente.bloqueado) throw new Error('Conta bloqueada. Entre em contato com o suporte.')

        return { id: cliente.id, name: cliente.nome, email: cliente.email }
      },
    }),
  ],
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
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
