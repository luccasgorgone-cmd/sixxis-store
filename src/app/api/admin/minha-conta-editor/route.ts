import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

const CHAVES = [
  'minha_conta_banner_desktop',
  'minha_conta_banner_mobile',
  'minha_conta_hero_titulo',
  'minha_conta_hero_subtitulo',
  'minha_conta_mensagem_boasvindas',
  'minha_conta_mostra_pedidos',
  'minha_conta_mostra_cashback',
  'minha_conta_mostra_enderecos',
  'minha_conta_mostra_avaliacoes_pendentes',
  'minha_conta_mostra_cupons',
  'minha_conta_cor_destaque',
] as const

export async function GET(request: NextRequest) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  const configs = await prisma.configuracao.findMany({ where: { chave: { in: [...CHAVES] } } })
  const map = Object.fromEntries(configs.map(c => [c.chave, c.valor]))
  return Response.json({ config: map })
}

export async function PATCH(request: NextRequest) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  const body = await request.json()
  const updates: Array<{ chave: string; valor: string }> = []
  for (const key of CHAVES) {
    if (body[key] !== undefined) {
      updates.push({ chave: key, valor: String(body[key] ?? '') })
    }
  }

  await Promise.all(updates.map(({ chave, valor }) =>
    prisma.configuracao.upsert({
      where: { chave },
      update: { valor },
      create: { chave, valor },
    }),
  ))

  return Response.json({ ok: true, salvos: updates.length })
}
