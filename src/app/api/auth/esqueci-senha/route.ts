import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { gerarResetToken } from '@/lib/reset-token'
import { enviarEmailResetSenha } from '@/lib/email'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sixxis-store-production.up.railway.app'

// Resposta SEMPRE genérica (não revela se o e-mail existe nem se é OAuth-only).
function respostaGenerica() {
  return NextResponse.json({
    ok: true,
    message: 'Se houver uma conta com esse e-mail, enviamos as instruções de redefinição.',
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { email?: string } | null
  const email = body?.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'Informe um e-mail.' }, { status: 400 })
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where:  { email },
      select: { id: true, nome: true, senha: true },
    })

    // Só emite token p/ contas com senha local (OAuth-first tem senha == '').
    if (cliente && cliente.senha) {
      const token = gerarResetToken(cliente.id, cliente.senha)
      const link = `${SITE_URL}/redefinir-senha?token=${encodeURIComponent(token)}`
      // Envio depende do Resend configurado; nunca bloqueia a resposta genérica.
      await enviarEmailResetSenha(email, { nomeCliente: cliente.nome, link }).catch((e) => {
        console.error('[auth/esqueci-senha] email falhou:', (e as Error).message)
      })
    }
  } catch (e) {
    console.error('[auth/esqueci-senha]', (e as Error).message)
  }

  return respostaGenerica()
}
