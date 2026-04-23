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

// Defaults inline — garantem que o front não fique travado em loading
// mesmo quando a tabela Configuracao ainda não tiver nenhum registro das chaves.
const DEFAULTS: Record<string, string> = {
  minha_conta_banner_desktop:             '',
  minha_conta_banner_mobile:              '',
  minha_conta_hero_titulo:                'Minha Conta',
  minha_conta_hero_subtitulo:             'Gerencie pedidos, cashback, endereços e preferências',
  minha_conta_mensagem_boasvindas:        '',
  minha_conta_mostra_pedidos:             'true',
  minha_conta_mostra_cashback:            'true',
  minha_conta_mostra_enderecos:           'true',
  minha_conta_mostra_avaliacoes_pendentes:'true',
  minha_conta_mostra_cupons:              'true',
  minha_conta_cor_destaque:               '#3cbfb3',
}

export async function GET(request: NextRequest) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  const configs = await prisma.configuracao.findMany({ where: { chave: { in: [...CHAVES] } } })
  const db = Object.fromEntries(configs.map(c => [c.chave, c.valor]))
  // Merge: valores do DB sobrescrevem os defaults, mas toda chave vem preenchida.
  const config = { ...DEFAULTS, ...db }
  return Response.json({ config })
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
