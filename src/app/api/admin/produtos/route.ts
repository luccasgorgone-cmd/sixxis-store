import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q = searchParams.get('q') ?? ''
  const categoria = searchParams.get('categoria') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = 20

  const where = {
    ...(q && {
      OR: [
        { nome: { contains: q } },
        { modelo: { contains: q } },
      ],
    }),
    ...(categoria && { categoria }),
  }

  const [produtos, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.produto.count({ where }),
  ])

  return NextResponse.json({ produtos, total, page, limit })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const {
    nome,
    slug,
    descricao,
    categoria,
    modelo,
    preco,
    precoPromocional,
    estoque,
    ativo,
    imagens,
  } = body

  if (!nome || !slug || !categoria || preco == null) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const erpProdutoId = `ADMIN-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const produto = await prisma.produto.create({
    data: {
      erpProdutoId,
      nome,
      slug,
      descricao: descricao || null,
      categoria,
      modelo: modelo || null,
      preco: Number(preco),
      precoPromocional: precoPromocional ? Number(precoPromocional) : null,
      estoque: Number(estoque) || 0,
      ativo: ativo !== false,
      imagens: imagens ?? [],
    },
  })

  return NextResponse.json({ produto }, { status: 201 })
}
