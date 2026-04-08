import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const { email } = parsed.data

  // Save as a newsletter config entry (simple key-value store) or just send notification
  // We use the Configuracao table as a simple key-value store for now
  // In production, integrate with Mailchimp / Klaviyo / etc.
  try {
    // Notify admin via email if configured
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const from = process.env.EMAIL_FROM ?? 'noreply@sixxis.com.br'

      await resend.emails.send({
        from,
        to:      process.env.EMAIL_CONTATO ?? from,
        subject: `[Newsletter] Nova inscrição: ${email}`,
        html:    `<p>Novo inscrito na newsletter: <strong>${email}</strong></p>`,
      })
    }

    // Also save in prisma as a simple list (using Configuracao with a prefix)
    await prisma.configuracao.upsert({
      where:  { chave: `newsletter_${email}` },
      update: { valor: new Date().toISOString() },
      create: { chave: `newsletter_${email}`, valor: new Date().toISOString() },
    })
  } catch {
    // Silently continue — don't fail the UX for a newsletter subscription
  }

  return NextResponse.json({ ok: true })
}
