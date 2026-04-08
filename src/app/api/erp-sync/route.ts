import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
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

  const resultados = await Promise.allSettled(
    parsed.data.produtos.map((p) =>
      prisma.produto.upsert({
        where: { erpProdutoId: p.erpProdutoId },
        update: {
          nome: p.nome,
          slug: p.slug,
          descricao: p.descricao,
          preco: p.preco,
          precoPromocional: p.precoPromocional,
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
          preco: p.preco,
          precoPromocional: p.precoPromocional,
          imagens: p.imagens,
          estoque: p.estoque,
          categoria: p.categoria,
          modelo: p.modelo,
          ativo: p.ativo,
        },
      }),
    ),
  )

  const sucessos = resultados.filter((r) => r.status === 'fulfilled').length
  const falhas = resultados.filter((r) => r.status === 'rejected').length

  return Response.json({ sincronizados: sucessos, falhas })
}
