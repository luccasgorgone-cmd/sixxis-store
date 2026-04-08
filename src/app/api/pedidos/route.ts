import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const criarPedidoSchema = z.object({
  enderecoId: z.string(),
  formaPagamento: z.string(),
  frete: z.number().nonnegative(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const pedidos = await prisma.pedido.findMany({
    where: { clienteId: session.user.id },
    include: { itens: { include: { produto: { select: { nome: true, imagens: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ pedidos })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = criarPedidoSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { enderecoId, formaPagamento, frete } = parsed.data

  const carrinho = await prisma.carrinho.findFirst({
    where: { clienteId: session.user.id },
    include: { itens: { include: { produto: true } } },
  })

  if (!carrinho || carrinho.itens.length === 0) {
    return Response.json({ error: 'Carrinho vazio' }, { status: 400 })
  }

  const subtotal = carrinho.itens.reduce(
    (acc, item) => acc + Number(item.produto.precoPromocional ?? item.produto.preco) * item.quantidade,
    0,
  )

  const pedido = await prisma.pedido.create({
    data: {
      clienteId: session.user.id,
      enderecoId,
      formaPagamento,
      frete,
      total: subtotal + frete,
      status: 'pendente',
      itens: {
        create: carrinho.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.produto.precoPromocional ?? item.produto.preco,
        })),
      },
    },
  })

  // Limpar carrinho
  await prisma.itemCarrinho.deleteMany({ where: { carrinhoId: carrinho.id } })

  return Response.json({ pedido }, { status: 201 })
}
