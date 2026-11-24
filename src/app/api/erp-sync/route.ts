import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aplicarMarkupSite } from '@/lib/preco-markup'
import { precoCongeladoNoSync } from '@/lib/preco-freeze'
import { z } from 'zod'

const produtoSyncSchema = z.object({
  erpProdutoId: z.string(),
  nome: z.string(),
  slug: z.string(),
  descricao: z.string().optional(),
  preco: z.number().positive(),
  precoPromocional: z.number().positive().optional(),
  imagens: z.array(z.string()),
  estoque: z.number().int().nonnegative(),
  categoria: z.string(),
  modelo: z.string().optional(),
  ativo: z.boolean(),
})

const syncPayloadSchema = z.object({
  produtos: z.array(produtoSyncSchema),
})

function autorizarRequisicao(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${process.env.ERP_API_SECRET}`
}

export async function POST(request: NextRequest) {
  if (!autorizarRequisicao(request)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = syncPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Payload inválido', details: parsed.error.flatten() }, { status: 400 })
  }

  // Freeze de preço na janela de BF: o preço da loja é autoritativo (base
  // revertido, −15% aspirador gravado por migration, promos manuais). Com o
  // freeze ligado o import atualiza tudo em produtos JÁ EXISTENTES menos o preço;
  // produtos novos (create) ainda recebem preço. Ver lib/preco-freeze.
  const congelarPreco = precoCongeladoNoSync()

  const resultados = await Promise.allSettled(
    parsed.data.produtos.map((p) => {
      // O ERP envia o preço BASE; o site vende com +20% (markup). Reaplicamos o
      // markup no ingest para o sync NÃO reverter o aumento (lib/preco-markup).
      const preco = aplicarMarkupSite(p.preco)
      const precoPromocional =
        p.precoPromocional != null ? aplicarMarkupSite(p.precoPromocional) : undefined
      return prisma.produto.upsert({
        where: { erpProdutoId: p.erpProdutoId },
        update: {
          nome: p.nome,
          slug: p.slug,
          descricao: p.descricao,
          // preço só é sobrescrito fora do freeze de BF (ver congelarPreco).
          ...(congelarPreco ? {} : { preco, precoPromocional }),
          imagens: p.imagens,
          estoque: p.estoque,
          categoria: p.categoria,
          modelo: p.modelo,
          ativo: p.ativo,
        },
        create: {
          erpProdutoId: p.erpProdutoId,
          nome: p.nome,
          slug: p.slug,
          descricao: p.descricao,
          preco,
          precoPromocional,
          imagens: p.imagens,
          estoque: p.estoque,
          categoria: p.categoria,
          modelo: p.modelo,
          ativo: p.ativo,
        },
      })
    }),
  )

  const sucessos = resultados.filter((r) => r.status === 'fulfilled').length
  const falhas = resultados.filter((r) => r.status === 'rejected').length

  return Response.json({ sincronizados: sucessos, falhas, precoCongelado: congelarPreco })
}
