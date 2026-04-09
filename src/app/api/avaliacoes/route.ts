import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const produtoId = searchParams.get('produtoId')

  if (!produtoId) return NextResponse.json({ error: 'produtoId obrigatório' }, { status: 400 })

  const avaliacoes = await prisma.avaliacao.findMany({
    where:   { produtoId, aprovada: true },
    include: { cliente: { select: { nome: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const total = avaliacoes.length
  const media = total > 0 ? avaliacoes.reduce((s, a) => s + a.nota, 0) / total : 0

  const distribuicao = [5, 4, 3, 2, 1].map((nota) => ({
    nota,
    count: avaliacoes.filter((a) => a.nota === nota).length,
  }))

  return NextResponse.json({ avaliacoes, total, media, distribuicao })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { produtoId, nota, titulo, comentario } = body

  if (!produtoId || !nota || nota < 1 || nota > 5) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const cliente = await prisma.cliente.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  })
  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  // Verificar se comprou o produto
  const comprou = await prisma.itemPedido.findFirst({
    where: {
      produtoId,
      pedido: { clienteId: cliente.id, status: { in: ['pago', 'enviado', 'entregue'] } },
    },
  })
  if (!comprou) {
    return NextResponse.json({ error: 'Você precisa comprar o produto para avaliar' }, { status: 403 })
  }

  // Verificar se já avaliou
  const jaAvaliou = await prisma.avaliacao.findFirst({
    where: { produtoId, clienteId: cliente.id },
  })
  if (jaAvaliou) {
    return NextResponse.json({ error: 'Você já avaliou este produto' }, { status: 409 })
  }

  const avaliacao = await prisma.avaliacao.create({
    data: {
      produtoId,
      clienteId:  cliente.id,
      nota:       Number(nota),
      titulo:     titulo || null,
      comentario: comentario || null,
      aprovada:   false,
    },
  })

  return NextResponse.json({ avaliacao }, { status: 201 })
}
