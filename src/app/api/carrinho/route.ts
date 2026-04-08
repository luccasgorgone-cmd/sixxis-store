import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const itemSchema = z.object({
  produtoId: z.string(),
  quantidade: z.number().int().positive(),
})

async function resolveCarrinho(clienteId: string | null, sessionId: string | null) {
  if (clienteId) {
    return prisma.carrinho.upsert({
      where: { clienteId },
      update: {},
      create: { clienteId },
      include: { itens: { include: { produto: true } } },
    })
  }
  if (sessionId) {
    return prisma.carrinho.upsert({
      where: { sessionId },
      update: {},
      create: { sessionId },
      include: { itens: { include: { produto: true } } },
    })
  }
  return null
}

export async function GET(request: NextRequest) {
  const session = await auth()
  const sessionId = request.cookies.get('sessionId')?.value ?? null
  const clienteId = session?.user?.id ?? null

  const carrinho = await resolveCarrinho(clienteId, sessionId)
  if (!carrinho) return Response.json({ itens: [] })

  return Response.json({ itens: carrinho.itens })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  const sessionId = request.cookies.get('sessionId')?.value ?? null
  const clienteId = session?.user?.id ?? null

  const body = await request.json()
  const parsed = itemSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { produtoId, quantidade } = parsed.data

  const produto = await prisma.produto.findUnique({ where: { id: produtoId } })
  if (!produto || !produto.ativo) {
    return Response.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  const carrinho = await resolveCarrinho(clienteId, sessionId)
  if (!carrinho) {
    return Response.json({ error: 'Sessão inválida' }, { status: 400 })
  }

  const itemExistente = carrinho.itens.find((i) => i.produtoId === produtoId)

  if (itemExistente) {
    await prisma.itemCarrinho.update({
      where: { id: itemExistente.id },
      data: { quantidade: itemExistente.quantidade + quantidade },
    })
  } else {
    await prisma.itemCarrinho.create({
      data: { carrinhoId: carrinho.id, produtoId, quantidade },
    })
  }

  return Response.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  const sessionId = request.cookies.get('sessionId')?.value ?? null
  const clienteId = session?.user?.id ?? null

  const { searchParams } = request.nextUrl
  const produtoId = searchParams.get('produtoId')

  const carrinho = await resolveCarrinho(clienteId, sessionId)
  if (!carrinho || !produtoId) {
    return Response.json({ error: 'Inválido' }, { status: 400 })
  }

  await prisma.itemCarrinho.deleteMany({
    where: { carrinhoId: carrinho.id, produtoId },
  })

  return Response.json({ ok: true })
}
