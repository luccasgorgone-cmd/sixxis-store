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
  const periodoParam  = searchParams.get('periodo')
  const fromParam     = searchParams.get('from') || searchParams.get('dataInicio')
  const toParam       = searchParams.get('to') || searchParams.get('dataFim')

  let from: Date
  let to: Date

  if (fromParam && toParam) {
    from = startOfDay(new Date(fromParam))
    to   = endOfDay(new Date(toParam))
  } else {
    to = endOfDay(new Date())
    if (periodoParam === 'hoje') {
      from = startOfDay(new Date())
    } else if (periodoParam === '7d') {
      from = startOfDay(new Date(Date.now() - 6 * 86400000))
    } else if (periodoParam === 'mes') {
      const now = new Date()
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
    } else {
      // default: 30d
      from = startOfDay(new Date(Date.now() - 29 * 86400000))
    }
  }

  const diffMs  = to.getTime() - from.getTime()
  const prevTo  = new Date(from.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - diffMs)

  const pedidoWhere   = { createdAt: { gte: from, lte: to } }
  const prevWhere     = { createdAt: { gte: prevFrom, lte: prevTo } }
  const paidWhere     = { ...pedidoWhere, status: { notIn: ['cancelado', 'CANCELADO'] } }
  const prevPaidWhere = { ...prevWhere,   status: { notIn: ['cancelado', 'CANCELADO'] } }

  const [
    pedidos,
    prevPedidos,
    prevClientes,
    produtosAtivos,
    totalClientes,
    pedidosPendentes,
    itensPedidos,
    pedidosPorStatus,
    estoqueCritico,
    pedidosRecentes,
    catalogo,
    pedidosBrutos,
    pedidosClientesPeriodo,
  ] = await Promise.all([
    prisma.pedido.findMany({
      where: paidWhere,
      select: { total: true, createdAt: true, endereco: { select: { estado: true } } },
    }),
    prisma.pedido.aggregate({ where: prevPaidWhere, _sum: { total: true }, _count: true }),
    prisma.cliente.count({ where: { createdAt: { gte: prevFrom, lte: prevTo } } }),
    prisma.produto.count({ where: { ativo: true } }),
    prisma.cliente.count(),
    prisma.pedido.count({ where: { status: { in: ['pendente', 'PENDENTE'] } } }),
    prisma.itemPedido.findMany({
      where: { pedido: { createdAt: { gte: from, lte: to }, status: { notIn: ['cancelado', 'CANCELADO'] } } },
      select: {
        quantidade: true,
        precoUnitario: true,
        produto: { select: { id: true, nome: true, sku: true, imagens: true } },
      },
    }),
    prisma.pedido.groupBy({ by: ['status'], where: pedidoWhere, _count: { _all: true } }),
    prisma.produto.findMany({
      where: { estoque: { lte: 5 }, ativo: true },
      orderBy: { estoque: 'asc' },
      take: 8,
      select: { id: true, nome: true, sku: true, estoque: true, categoria: true, imagens: true },
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
    prisma.produto.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, preco: true, estoque: true, imagens: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // For vendasPorHora and vendasPorDiaSemana
    prisma.pedido.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { notIn: ['cancelado', 'CANCELADO'] } },
      select: { createdAt: true, total: true },
    }),
    // For clientesPerfil
    prisma.pedido.findMany({
      where: paidWhere,
      select: { clienteId: true },
    }),
  ])

  // ── Aggregate metrics ───────────────────────────────────────────────────────
  const receita       = pedidos.reduce((s, p) => s + Number(p.total), 0)
  const totalPedidos  = pedidos.length
  const ticketMedio   = totalPedidos > 0 ? receita / totalPedidos : 0
  const prevReceita   = Number(prevPedidos._sum.total ?? 0)
  const prevTotalPedidos = prevPedidos._count

  // Clientes no período atual (new clients)
  const clientesNoPeriodo = await prisma.cliente.count({ where: { createdAt: { gte: from, lte: to } } })

  // ── Variacao % vs período anterior ─────────────────────────────────────────
  const variacao = {
    receita:    prevReceita > 0     ? ((receita - prevReceita) / prevReceita) * 100           : 0,
    pedidos:    prevTotalPedidos > 0 ? ((totalPedidos - prevTotalPedidos) / prevTotalPedidos) * 100 : 0,
    clientes:   prevClientes > 0    ? ((clientesNoPeriodo - prevClientes) / prevClientes) * 100      : 0,
    ticketMedio: prevReceita > 0 && prevTotalPedidos > 0
      ? ((ticketMedio - prevReceita / prevTotalPedidos) / (prevReceita / prevTotalPedidos)) * 100
      : 0,
  }

  // ── Vendas por dia ──────────────────────────────────────────────────────────
  const vendaDayMap: Record<string, { valor: number; pedidos: number }> = {}
  pedidosBrutos.forEach((p) => {
    const d = formatDate(p.createdAt)
    if (!vendaDayMap[d]) vendaDayMap[d] = { valor: 0, pedidos: 0 }
    vendaDayMap[d].valor   += Number(p.total)
    vendaDayMap[d].pedidos += 1
  })
  const vendasPorDia: { date: string; valor: number; pedidos: number }[] = []
  const cur = new Date(from)
  while (cur <= to) {
    const d = formatDate(cur)
    vendasPorDia.push({ date: d, valor: vendaDayMap[d]?.valor ?? 0, pedidos: vendaDayMap[d]?.pedidos ?? 0 })
    cur.setDate(cur.getDate() + 1)
  }

  // ── Vendas por hora ─────────────────────────────────────────────────────────
  const horasMap = Array.from({ length: 24 }, (_, hora) => ({ hora, pedidos: 0, valor: 0 }))
  pedidosBrutos.forEach((p) => {
    const h = new Date(p.createdAt).getHours()
    horasMap[h].pedidos++
    horasMap[h].valor += Number(p.total)
  })
  const vendasPorHora = horasMap

  // ── Vendas por dia da semana ────────────────────────────────────────────────
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const semanaMap = DIAS.map((dia) => ({ dia, valor: 0, pedidos: 0 }))
  pedidosBrutos.forEach((p) => {
    const d = new Date(p.createdAt).getDay()
    semanaMap[d].valor   += Number(p.total)
    semanaMap[d].pedidos += 1
  })
  const vendasPorDiaSemana = semanaMap

  // ── Forma de pagamento ──────────────────────────────────────────────────────
  const pgtoMap: Record<string, number> = {}
  pedidosRecentes.forEach((p) => {
    const f = p.formaPagamento || 'outros'
    pgtoMap[f] = (pgtoMap[f] || 0) + 1
  })
  // Also fetch all paid orders for payment breakdown
  const allPaidOrders = await prisma.pedido.findMany({
    where: paidWhere,
    select: { formaPagamento: true },
  })
  const pgtoFull: Record<string, number> = {}
  allPaidOrders.forEach((p) => {
    const f = p.formaPagamento || 'outros'
    pgtoFull[f] = (pgtoFull[f] || 0) + 1
  })
  const totalPgto = Object.values(pgtoFull).reduce((s, v) => s + v, 0)
  const NOMES_PGTO: Record<string, string> = {
    pix: 'Pix',
    credit_card: 'Cartão Crédito',
    debit_card: 'Cartão Débito',
    boleto: 'Boleto',
    outros: 'Outros',
  }
  const formaPagamento = Object.entries(pgtoFull)
    .map(([forma, count]) => ({
      forma: NOMES_PGTO[forma] || forma,
      count,
      percentual: totalPgto > 0 ? Math.round((count / totalPgto) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // ── Clientes: novos vs recorrentes ─────────────────────────────────────────
  const clienteIdsPeriodo = pedidosClientesPeriodo.map((p) => p.clienteId)
  const clienteIdSet = [...new Set(clienteIdsPeriodo)]
  let novos = 0
  let recorrentes = 0
  if (clienteIdSet.length > 0) {
    const historicos = await prisma.pedido.groupBy({
      by: ['clienteId'],
      where: { clienteId: { in: clienteIdSet }, status: { notIn: ['cancelado', 'CANCELADO'] } },
      _count: { _all: true },
    })
    historicos.forEach((c) => {
      if (c._count._all <= 1) novos++
      else recorrentes++
    })
  }
  const totalCl = novos + recorrentes
  const clientesPerfil = {
    novos,
    recorrentes,
    taxaRetencao: totalCl > 0 ? Math.round((recorrentes / totalCl) * 100) : 0,
  }

  // ── Top produtos ─────────────────────────────────────────────────────────────
  const prodMap: Record<string, {
    id: string; nome: string; sku: string | null; imagens: unknown
    totalVendido: number; receita: number
  }> = {}
  itensPedidos.forEach((item) => {
    const key = item.produto.id
    if (!prodMap[key]) {
      prodMap[key] = {
        id: item.produto.id,
        nome: item.produto.nome,
        sku: item.produto.sku,
        imagens: item.produto.imagens,
        totalVendido: 0,
        receita: 0,
      }
    }
    prodMap[key].totalVendido += item.quantidade
    prodMap[key].receita      += item.quantidade * Number(item.precoUnitario)
  })
  const topProdutos = Object.values(prodMap)
    .sort((a, b) => b.totalVendido - a.totalVendido)
    .slice(0, 10)

  // ── Por estado ────────────────────────────────────────────────────────────────
  const estadoMap: Record<string, { pedidos: number; receita: number }> = {}
  pedidos.forEach((p) => {
    const uf = p.endereco?.estado ?? 'N/A'
    if (!estadoMap[uf]) estadoMap[uf] = { pedidos: 0, receita: 0 }
    estadoMap[uf].pedidos++
    estadoMap[uf].receita += Number(p.total)
  })
  const porEstado = Object.entries(estadoMap)
    .map(([estado, v]) => ({ estado, valor: v.receita, ...v }))
    .sort((a, b) => b.receita - a.receita)

  // ── Pedidos entregues/enviados ─────────────────────────────────────────────
  const pedidosEntregues = pedidosPorStatus
    .filter((s) => s.status === 'entregue' || s.status === 'ENTREGUE')
    .reduce((sum, s) => sum + s._count._all, 0)
  const pedidosEnviados = pedidosPorStatus
    .filter((s) => s.status === 'enviado' || s.status === 'ENVIADO')
    .reduce((sum, s) => sum + s._count._all, 0)

  // ── Sessions carrinho ──────────────────────────────────────────────────────
  const totalSessoesCarrinho = 0 // analytics data, not tracked here

  return NextResponse.json({
    metrics: {
      receita,
      totalPedidos,
      ticketMedio,
      produtosAtivos,
      pedidosPendentes,
      totalClientes,
      pedidosEntregues,
      pedidosEnviados,
      prevReceita,
      prevTotalPedidos,
      totalSessoesCarrinho,
    },
    variacao,
    vendasPorDia,
    vendasPorHora,
    vendasPorDiaSemana,
    formaPagamento,
    clientesPerfil,
    topProdutos,
    porEstado,
    porStatus: pedidosPorStatus.map((s) => ({ status: s.status, count: s._count._all })),
    pedidosRecentes: pedidosRecentes.map((p) => ({
      ...p,
      cliente: { name: p.cliente.nome },
    })),
    estoqueCritico,
    catalogo,
  })
}
