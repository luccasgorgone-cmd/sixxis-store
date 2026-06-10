import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/ratelimit'
import { verifyTurnstile } from '@/lib/turnstile'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Cookies compartilhados apex/www (domínio .sixxis.com.br) p/ o fluxo OAuth ser
// consistente entre hosts. Em dev/preview (localhost, *.railway.app) fica
// undefined — não force .sixxis.com.br lá ou o navegador rejeita o cookie.
// Override via AUTH_COOKIE_DOMAIN se o domínio mudar.
const IS_PROD = process.env.NODE_ENV === 'production'
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN ?? (IS_PROD ? '.sixxis.com.br' : undefined)
const COOKIE_PREFIX = IS_PROD ? '__Secure-' : ''
const cookieBase = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: IS_PROD,
  domain: COOKIE_DOMAIN,
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
        turnstileToken: { label: 'Turnstile', type: 'text' },
      },
      async authorize(credentials, request) {
        // Rate-limit por IP + verificação anti-robô. Ambos degradam graciosamente
        // (sem Upstash/Turnstile configurados, não bloqueiam). Lançar Error aqui
        // faz o NextAuth devolver erro p/ a tela de login.
        const ip = getClientIp(request)
        const rl = await rateLimit('login', ip)
        if (!rl.success) {
          throw new Error('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.')
        }
        const okBot = await verifyTurnstile(
          typeof credentials?.turnstileToken === 'string' ? credentials.turnstileToken : null,
          ip,
        )
        if (!okBot) {
          throw new Error('Verificação anti-robô falhou. Recarregue a página e tente novamente.')
        }

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
  // Domínio compartilhado .sixxis.com.br nos cookies do fluxo (state/pkce/csrf/
  // callback/sessão). csrf usa __Secure- (não __Host-, que proíbe domain).
  cookies: {
    sessionToken:     { name: `${COOKIE_PREFIX}authjs.session-token`,     options: cookieBase },
    callbackUrl:      { name: `${COOKIE_PREFIX}authjs.callback-url`,       options: cookieBase },
    csrfToken:        { name: `${COOKIE_PREFIX}authjs.csrf-token`,         options: cookieBase },
    pkceCodeVerifier: { name: `${COOKIE_PREFIX}authjs.pkce.code_verifier`, options: { ...cookieBase, maxAge: 900 } },
    state:            { name: `${COOKIE_PREFIX}authjs.state`,              options: { ...cookieBase, maxAge: 900 } },
    nonce:            { name: `${COOKIE_PREFIX}authjs.nonce`,              options: cookieBase },
  },
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
