import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  ativado:        z.boolean().optional(),
  bannerDesktop:  z.string().nullable().optional(),
  bannerTablet:   z.string().nullable().optional(),
  bannerMobile:   z.string().nullable().optional(),
  altText:        z.string().nullable().optional(),
  linkDestino:    z.string().nullable().optional(),
  abrirNovaAba:   z.boolean().optional(),
  titulo:         z.string().nullable().optional(),
  texto:          z.string().nullable().optional(),
  corBotao:       z.string().nullable().optional(),
  textoBotao:     z.string().nullable().optional(),
  delaySegundos:  z.number().int().min(0).max(60).optional(),
  frequencia:     z.enum(['sessao', 'dia', 'semana']).optional(),
  paginas:        z.array(z.string()).optional(),
})

async function obter() {
  // Garante que sempre exista 1 row.
  return prisma.popupInicial.upsert({
    where:  { id: 'singleton' },
    update: {},
    create: { id: 'singleton', ativado: false, paginas: ['home'] },
  })
}

export async function GET(req: NextRequest) {
  const unauth = await requireAdmin(req)
  if (unauth) return unauth
  const config = await obter()
  return NextResponse.json({ config })
}

export async function PATCH(req: NextRequest) {
  const unauth = await requireAdmin(req)
  if (unauth) return unauth

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  await obter()
  const updated = await prisma.popupInicial.update({
    where: { id: 'singleton' },
    data:  parsed.data,
  })

  await auditLog({
    req,
    action: 'popup.update',
    target: 'singleton',
    metadata: parsed.data,
  })

  return NextResponse.json({ config: updated })
}
