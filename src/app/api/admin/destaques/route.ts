import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const secao = searchParams.get('secao') ?? 'mais-vendidos'

  const destaques = await prisma.produtoDestaque.findMany({
    where:   { secao },
    orderBy: { ordem: 'asc' },
    include: { produto: { select: { id: true, nome: true, imagens: true, preco: true } } },
  })

  return NextResponse.json({ destaques })
}

export async function POST(request: NextRequest) {
  const { produtoId, secao, ordem } = await request.json()

  const existing = await prisma.produtoDestaque.findFirst({
    where: { produtoId, secao: secao ?? 'mais-vendidos' },
  })
  if (existing) return NextResponse.json({ error: 'Produto já está nesta seção' }, { status: 400 })

  const destaque = await prisma.produtoDestaque.create({
    data: { produtoId, secao: secao ?? 'mais-vendidos', ordem: Number(ordem) || 0 },
  })

  revalidatePath('/', 'layout')
  revalidatePath('/')

  return NextResponse.json({ destaque }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.produtoDestaque.delete({ where: { id } })
  revalidatePath('/', 'layout')
  revalidatePath('/')
  return NextResponse.json({ ok: true })
}
