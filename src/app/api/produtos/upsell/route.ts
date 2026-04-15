import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const exclude = req.nextUrl.searchParams.get('exclude')?.split(',').filter(Boolean) ?? []
  const limit   = Math.min(Number(req.nextUrl.searchParams.get('limit') || '3'), 6)

  const destaques = await prisma.produtoDestaque.findMany({
    where:   { secao: 'mais-vendidos' },
    orderBy: { ordem: 'asc' },
    include: {
      produto: {
        select: {
          id:               true,
          nome:             true,
          slug:             true,
          preco:            true,
          precoPromocional: true,
          imagens:          true,
          ativo:            true,
        },
      },
    },
  })

  const produtos = destaques
    .map(d => d.produto)
    .filter(p => p && p.ativo && !exclude.includes(p.id))
    .slice(0, limit)

  const formatado = produtos.map(p => {
    const preco      = Number(p!.preco)
    const precoPromo = p!.precoPromocional ? Number(p!.precoPromocional) : null
    const desconto   = precoPromo ? Math.round((1 - precoPromo / preco) * 100) : 0
    const precoFinal = precoPromo ?? preco
    return {
      id:               p!.id,
      nome:             p!.nome,
      slug:             p!.slug,
      preco:            preco,
      precoFinal:       precoFinal,
      desconto:         desconto > 0 ? desconto : null,
      imagem:           (p!.imagens as string[])?.[0] ?? null,
      pixPreco:         (precoFinal * 0.97).toFixed(2),
    }
  })

  return NextResponse.json({ produtos: formatado })
}
