import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const itemSchema = z.object({
  produtoId:    z.string(),
  quantidade:   z.number().int().positive(),
  variacaoId:   z.string().optional(),
  variacaoNome: z.string().optional(),
})

const criarPedidoSchema = z.object({
  enderecoId:     z.string(),
  formaPagamento: z.string(),
  frete:          z.number().nonnegative(),
  itens:          z.array(itemSchema).min(1),
  cupomCodigo:    z.string().optional(),
  desconto:       z.number().nonnegative().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const pedidos = await prisma.pedido.findMany({
    where: { clienteId: session.user.id },
    include: {
      itens: {
        include: { produto: { select: { nome: true, imagens: true } } },
      },
    },
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
    return Response.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { enderecoId, formaPagamento, frete, itens, cupomCodigo, desconto: descontoReq } = parsed.data
  const desconto = descontoReq ?? 0

  // Buscar produtos e variações para calcular preços
  const produtoIds = [...new Set(itens.map((i) => i.produtoId))]
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds } },
    include: { variacoes: true },
  })

  const produtoMap = new Map(produtos.map((p) => [p.id, p]))

  let subtotal = 0
  const itensPedido: {
    produtoId:    string
    quantidade:   number
    precoUnitario: number
    variacaoId?:  string
    variacaoNome?: string
  }[] = []

  for (const item of itens) {
    const produto = produtoMap.get(item.produtoId)
    if (!produto || !produto.ativo) {
      return Response.json({ error: `Produto ${item.produtoId} não encontrado` }, { status: 400 })
    }

    let precoUnitario = Number(produto.precoPromocional ?? produto.preco)

    if (item.variacaoId) {
      const variacao = produto.variacoes.find((v) => v.id === item.variacaoId)
      if (!variacao || !variacao.ativo) {
        return Response.json({ error: `Variação ${item.variacaoId} não encontrada` }, { status: 400 })
      }
      if (variacao.preco != null) {
        precoUnitario = Number(variacao.preco)
      }
    }

    subtotal += precoUnitario * item.quantidade
    itensPedido.push({
      produtoId:    item.produtoId,
      quantidade:   item.quantidade,
      precoUnitario,
      variacaoId:   item.variacaoId,
      variacaoNome: item.variacaoNome,
    })
  }

  const pedido = await prisma.pedido.create({
    data: {
      clienteId:      session.user.id,
      enderecoId,
      formaPagamento,
      frete,
      desconto,
      cupomCodigo:    cupomCodigo ?? null,
      total:          Math.max(0, subtotal + frete - desconto),
      status:         'pendente',
      itens: {
        create: itensPedido.map((item) => ({
          produtoId:    item.produtoId,
          quantidade:   item.quantidade,
          precoUnitario: item.precoUnitario,
          variacaoId:   item.variacaoId ?? null,
          variacaoNome: item.variacaoNome ?? null,
        })),
      },
    },
  })

  // Abater estoque das variações ou do produto pai
  for (const item of itensPedido) {
    if (item.variacaoId) {
      await prisma.variacaoProduto.update({
        where: { id: item.variacaoId },
        data: { estoque: { decrement: item.quantidade } },
      })
      // Recomputar estoque do produto pai como soma das variações
      const variacoes = await prisma.variacaoProduto.findMany({
        where: { produtoId: item.produtoId },
        select: { estoque: true },
      })
      const totalEstoque = variacoes.reduce((s, v) => s + Math.max(0, v.estoque), 0)
      await prisma.produto.update({
        where: { id: item.produtoId },
        data: { estoque: totalEstoque },
      })
    } else {
      await prisma.produto.update({
        where: { id: item.produtoId },
        data: { estoque: { decrement: item.quantidade } },
      })
    }
  }

  return Response.json({ pedido }, { status: 201 })
}
