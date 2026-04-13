import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { searchParams } = request.nextUrl
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  const to = toParam ? endOfDay(new Date(toParam)) : endOfDay(new Date())
  const from = fromParam ? startOfDay(new Date(fromParam)) : startOfDay(new Date(Date.now() - 29 * 86400000))

  const diffMs = to.getTime() - from.getTime()
  const prevTo = new Date(from.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - diffMs)

  const pedidoWhere = { createdAt: { gte: from, lte: to } }
  const prevWhere = { createdAt: { gte: prevFrom, lte: prevTo } }
  const paidWhere = { ...pedidoWhere, status: { notIn: ['cancelado'] } }
  const prevPaidWhere = { ...prevWhere, status: { notIn: ['cancelado'] } }

  const [
    pedidos,
    prevPedidos,
    produtosAtivos,
    totalClientes,
    pedidosPendentes,
    itensPedidos,
    pedidosPorStatus,
    estoqueCritico,
    pedidosRecentes,
  ] = await Promise.all([
    prisma.pedido.findMany({
      where: paidWhere,
      select: { total: true, createdAt: true, endereco: { select: { estado: true } } },
    }),
    prisma.pedido.aggregate({ where: prevPaidWhere, _sum: { total: true }, _count: true }),
    prisma.produto.count({ where: { ativo: true } }),
    prisma.cliente.count(),
    prisma.pedido.count({ where: { status: 'pendente' } }),
    prisma.itemPedido.findMany({
      where: { pedido: { createdAt: { gte: from, lte: to }, status: { notIn: ['cancelado'] } } },
      select: {
        quantidade: true,
        precoUnitario: true,
        produto: { select: { nome: true, sku: true } },
      },
    }),
    prisma.pedido.groupBy({ by: ['status'], where: pedidoWhere, _count: { _all: true } }),
    prisma.produto.findMany({
      where: { estoque: { lte: 5 }, ativo: true },
      orderBy: { estoque: 'asc' },
      take: 8,
      select: { id: true, nome: true, sku: true, estoque: true, categoria: true },
    }),
    prisma.pedido.findMany({
      where: pedidoWhere,
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, status: true, total: true, formaPagamento: true, createdAt: true,
        cliente: { select: { nome: true } },
      },
    }),
  ])

  // Aggregate metrics
  const receita = pedidos.reduce((s, p) => s + Number(p.total), 0)
  const totalPedidos = pedidos.length
  const ticketMedio = totalPedidos > 0 ? receita / totalPedidos : 0
  const prevReceita = Number(prevPedidos._sum.total ?? 0)
  const prevTotalPedidos = prevPedidos._count

  // Vendas por dia
  const vendaDayMap: Record<string, number> = {}
  pedidos.forEach((p) => {
    const d = formatDate(p.createdAt)
    vendaDayMap[d] = (vendaDayMap[d] ?? 0) + Number(p.total)
  })
  // Fill all days in range
  const vendasPorDia: { date: string; valor: number }[] = []
  const cur = new Date(from)
  while (cur <= to) {
    const d = formatDate(cur)
    vendasPorDia.push({ date: d, valor: vendaDayMap[d] ?? 0 })
    cur.setDate(cur.getDate() + 1)
  }

  // Top produtos
  const prodMap: Record<string, { nome: string; sku: string | null; quantidade: number; receita: number }> = {}
  itensPedidos.forEach((item) => {
    const key = item.produto.nome
    if (!prodMap[key]) prodMap[key] = { nome: item.produto.nome, sku: item.produto.sku, quantidade: 0, receita: 0 }
    prodMap[key].quantidade += item.quantidade
    prodMap[key].receita += item.quantidade * Number(item.precoUnitario)
  })
  const topProdutos = Object.values(prodMap)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10)

  // Por estado
  const estadoMap: Record<string, { pedidos: number; receita: number }> = {}
  pedidos.forEach((p) => {
    const uf = p.endereco?.estado ?? 'N/A'
    if (!estadoMap[uf]) estadoMap[uf] = { pedidos: 0, receita: 0 }
    estadoMap[uf].pedidos++
    estadoMap[uf].receita += Number(p.total)
  })
  const porEstado = Object.entries(estadoMap)
    .map(([estado, v]) => ({ estado, ...v }))
    .sort((a, b) => b.receita - a.receita)

  return NextResponse.json({
    metrics: {
      receita,
      totalPedidos,
      ticketMedio,
      produtosAtivos,
      pedidosPendentes,
      totalClientes,
      prevReceita,
      prevTotalPedidos,
    },
    vendasPorDia,
    topProdutos,
    porEstado,
    porStatus: pedidosPorStatus.map((s) => ({ status: s.status, count: s._count._all })),
    pedidosRecentes,
    estoqueCritico,
  })
}
