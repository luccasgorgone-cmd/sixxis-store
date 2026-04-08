import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFromR2 } from '@/lib/r2'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const produto = await prisma.produto.findUnique({ where: { id } })

  if (!produto) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ produto })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()

  const {
    sku,
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

  const produto = await prisma.produto.update({
    where: { id },
    data: {
      sku: sku || null,
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

  return NextResponse.json({ produto })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const produto = await prisma.produto.findUnique({ where: { id } })

  if (!produto) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  // Delete images from R2
  const imagens = (produto.imagens as string[]) ?? []
  const publicUrl = process.env.R2_PUBLIC_URL ?? ''

  await Promise.allSettled(
    imagens.map((url) => {
      const key = url.replace(`${publicUrl}/`, '')
      return deleteFromR2(key)
    }),
  )

  await prisma.produto.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
