import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { searchParams } = request.nextUrl
  const q = searchParams.get('q') ?? ''
  const categoria = searchParams.get('categoria') ?? ''
  const ativoParam = searchParams.get('ativo') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = 20

  const where = {
    ...(q && {
      OR: [
        { nome: { contains: q } },
        { modelo: { contains: q } },
        { sku: { contains: q } },
      ],
    }),
    ...(categoria && { categoria }),
    ...(ativoParam !== '' && { ativo: ativoParam === 'true' }),
  }

  const [produtos, total, statsTotal, statsAtivos, statsCriticos] = await Promise.all([
    prisma.produto.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { variacoes: { orderBy: { createdAt: 'asc' } } },
    }),
    prisma.produto.count({ where }),
    prisma.produto.count(),
    prisma.produto.count({ where: { ativo: true } }),
    prisma.produto.count({ where: { estoque: { lte: 5 } } }),
  ])

  return NextResponse.json({
    produtos, total, page, limit,
    stats: { total: statsTotal, ativos: statsAtivos, criticos: statsCriticos },
  })
}

interface VariacaoInput {
  id?: string
  nome: string
  sku: string
  preco?: string | number | null
  estoque: string | number
  ativo: boolean
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json()

  const {
    sku,
    nome,
    slug: slugRaw,
    descricao,
    categoria,
    modelo,
    preco,
    precoPromocional,
    estoque,
    ativo,
    imagens,
    videoUrl,
    temVariacoes,
    variacoes,
    especificacoes,
    faqs,
  } = body

  if (!nome || !slugRaw || !categoria || preco == null) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const slug = String(slugRaw).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (!slug) {
    return NextResponse.json({ error: 'Slug inválido' }, { status: 400 })
  }

  const erpProdutoId = `ADMIN-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  // Validar SKUs únicos das variações
  const variacoesInput: VariacaoInput[] = temVariacoes ? (variacoes ?? []) : []
  const skusVariacoes = variacoesInput.map((v) => v.sku).filter(Boolean)
  if (new Set(skusVariacoes).size !== skusVariacoes.length) {
    return NextResponse.json({ error: 'SKUs das variações devem ser únicos' }, { status: 400 })
  }

  // Estoque pai = soma das variações quando temVariacoes
  const estoqueTotal = temVariacoes
    ? variacoesInput.reduce((s, v) => s + Number(v.estoque || 0), 0)
    : Number(estoque) || 0

  const produto = await prisma.produto.create({
    data: {
      erpProdutoId,
      sku: sku || null,
      nome,
      slug,
      descricao: descricao || null,
      categoria,
      modelo: modelo || null,
      preco: Number(preco),
      precoPromocional: precoPromocional ? Number(precoPromocional) : null,
      estoque: estoqueTotal,
      ativo: ativo !== false,
      imagens: imagens ?? [],
      videoUrl: videoUrl ?? null,
      temVariacoes: Boolean(temVariacoes),
      especificacoes: especificacoes ?? undefined,
      faqs: faqs ?? undefined,
      variacoes: temVariacoes && variacoesInput.length > 0
        ? {
            create: variacoesInput.map((v) => ({
              nome: v.nome,
              sku: v.sku,
              preco: v.preco ? Number(v.preco) : null,
              estoque: Number(v.estoque || 0),
              ativo: v.ativo !== false,
            })),
          }
        : undefined,
    },
    include: { variacoes: true },
  })

  return NextResponse.json({ produto }, { status: 201, headers: NO_CACHE })
}
