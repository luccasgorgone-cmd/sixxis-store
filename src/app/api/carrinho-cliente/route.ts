import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { isClienteBloqueado } from '@/lib/cliente-bloqueio'

export const dynamic = 'force-dynamic'

// Persistência server-side do carrinho do cliente LOGADO (Fase 4A). Espelha o
// carrinho Zustand a cada add/remove/mudança de qtd e ao avançar etapas do
// checkout. O carrinho ANÔNIMO não passa por aqui (segue só em localStorage).
//
// Visitante sem sessão → no-op silencioso (200 { skipped: true }). Nunca cria
// CarrinhoCliente sem clienteId.

const itemSchema = z.object({
  produtoId: z.string(),
  slug:      z.string().optional(),
  nome:      z.string(),
  variacao:  z.string().optional().nullable(),
  qtd:       z.number().int().positive(),
  preco:     z.number().nonnegative(),
})

const bodySchema = z.object({
  itens: z.array(itemSchema),
  // Etapa ATUAL informada pelo client (1..5). Gravamos sempre a MAIS avançada.
  etapa: z.number().int().min(1).max(5).optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  const clienteId = session?.user?.id ?? null
  // Sem cliente logado: não persistimos (carrinho anônimo intocado).
  if (!clienteId) return Response.json({ skipped: true })

  // Cliente bloqueado: não espelha carrinho (ação sensível de conta).
  if (await isClienteBloqueado(clienteId)) {
    return Response.json({ skipped: true, bloqueado: true })
  }

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { itens, etapa } = parsed.data
  const etapaInformada = etapa ?? 1

  // Enriquecer slug a partir do banco (o item Zustand nem sempre traz slug).
  // Garante link do produto no painel admin sem confiar no client.
  const ids = [...new Set(itens.map((i) => i.produtoId))]
  const slugMap = new Map<string, string>()
  if (ids.length > 0) {
    const produtos = await prisma.produto.findMany({
      where: { id: { in: ids } },
      select: { id: true, slug: true },
    })
    for (const p of produtos) slugMap.set(p.id, p.slug)
  }

  const itensJson = itens.map((i) => ({
    produtoId: i.produtoId,
    slug:      i.slug || slugMap.get(i.produtoId) || '',
    nome:      i.nome,
    variacao:  i.variacao ?? null,
    qtd:       i.qtd,
    preco:     i.preco,
  }))
  const valorTotal = itensJson.reduce((acc, i) => acc + i.preco * i.qtd, 0)

  const existente = await prisma.carrinhoCliente.findUnique({
    where:  { clienteId },
    select: { etapaAtual: true, status: true },
  })

  // Carrinho esvaziado: zera itens/valor, NÃO recria se não existir e preserva
  // status (ex.: 'convertido' após compra). Sem itens nunca conta como abandonado.
  if (itensJson.length === 0) {
    if (existente) {
      await prisma.carrinhoCliente.update({
        where: { clienteId },
        data:  { itens: [], valorTotal: 0 },
      })
    }
    return Response.json({ ok: true, vazio: true })
  }

  // etapaAtual = a mais avançada já alcançada (nunca regride).
  const etapaAtual = Math.max(etapaInformada, existente?.etapaAtual ?? 1)

  await prisma.carrinhoCliente.upsert({
    where: { clienteId },
    create: {
      clienteId,
      itens:      itensJson,
      valorTotal,
      etapaAtual: etapaInformada,
      status:     'ativo',
    },
    update: {
      itens:      itensJson,
      valorTotal,
      etapaAtual,
      // Novo carrinho ativo (reabre mesmo após conversão anterior).
      status:     'ativo',
    },
  })

  return Response.json({ ok: true })
}
