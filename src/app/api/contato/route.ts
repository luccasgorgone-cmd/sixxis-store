import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  nome:     z.string().min(2),
  email:    z.string().email(),
  telefone: z.string().optional(),
  assunto:  z.string().min(1),
  mensagem: z.string().min(10),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { nome, email, telefone, assunto, mensagem } = parsed.data

  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.EMAIL_FROM_NAME
      ? `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM ?? 'noreply@sixxis.com.br'}>`
      : (process.env.EMAIL_FROM ?? 'noreply@sixxis.com.br')

    await resend.emails.send({
      from,
      to:      process.env.EMAIL_CONTATO ?? process.env.EMAIL_FROM ?? 'contato@sixxis.com.br',
      subject: `[Contato] ${assunto} — ${nome}`,
      html: `
        <h2>Nova mensagem de contato</h2>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefone:</strong> ${telefone ?? '—'}</p>
        <p><strong>Assunto:</strong> ${assunto}</p>
        <hr/>
        <p><strong>Mensagem:</strong></p>
        <p style="white-space:pre-wrap">${mensagem}</p>
      `,
      replyTo: email,
    })
  }

  return NextResponse.json({ ok: true })
}
