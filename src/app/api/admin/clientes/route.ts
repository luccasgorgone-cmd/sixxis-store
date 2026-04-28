import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { contarClientes } from '@/lib/clientes-count'
import { STATUS_PAGO_TODOS, STATUS_PENDENTE_TODOS } from '@/lib/pedido-status'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const page      = Math.max(1, Number(sp.get('page') || '1'))
    const limit     = Math.min(50, Math.max(1, Number(sp.get('limit') || '20')))
    const busca     = sp.get('busca')?.trim() || ''
    const status    = sp.get('status') || ''
    const gastoMin  = sp.get('gastoMin')
    const gastoMax  = sp.get('gastoMax')
    const pedidosMin = sp.get('pedidosMin')
    const pedidosMax = sp.get('pedidosMax')
    const estado    = sp.get('estado')
    const ordenar   = sp.get('ordenar') || 'createdAt'
    const skip      = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (busca) {
      where.OR = [
        { nome:  { contains: busca } },
        { email: { contains: busca } },
        { cpf:   { contains: busca } },
      ]
    }
    if (status === 'bloqueado') where.bloqueado = true
    if (status === 'ativo')     where.bloqueado = false

    if (gastoMin || gastoMax) {
      where.totalGasto = {
        ...(gastoMin ? { gte: Number(gastoMin) } : {}),
        ...(gastoMax ? { lte: Number(gastoMax) } : {}),
      }
    }
    if (pedidosMin || pedidosMax) {
      where.totalPedidos = {
        ...(pedidosMin ? { gte: Number(pedidosMin) } : {}),
        ...(pedidosMax ? { lte: Number(pedidosMax) } : {}),
      }
    }
    if (estado) {
      where.enderecos = { some: { estado } }
    }

    const validOrdenar = ['totalGasto', 'totalPedidos', 'ultimaCompra', 'createdAt']
    const orderField = validOrdenar.includes(ordenar) ? ordenar : 'createdAt'

    const [total, totalGeral, clientes, estadosRaw] = await Promise.all([
      prisma.cliente.count({ where }),
      contarClientes(),
      prisma.cliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ [orderField]: 'desc' }],
        select: {
          id:             true,
          nome:           true,
          email:          true,
          cpf:            true,
          telefone:       true,
          createdAt:      true,
          bloqueado:      true,
          motivoBloqueio: true,
          cashbackSaldo:  true,
          totalGasto:     true,
          totalPedidos:   true,
          ultimaCompra:   true,
          _count: { select: { pedidos: true } },
        },
      }),
      prisma.endereco.findMany({
        distinct: ['estado'],
        select:   { estado: true },
        where:    { NOT: { estado: '' } },
        orderBy:  { estado: 'asc' },
      }),
    ])

    // Recalcula "totalGasto" e contagem de pedidos com base em pedidos PAGOS.
    // Os campos cacheados no Cliente podem estar desalinhados quando o pedido
    // ainda está pendente — pra evitar mostrar "R$ X gasto" antes da confirmação
    // do pagamento, agregamos por cliente do batch atual.
    const clienteIds = clientes.map((c) => c.id)
    const [agregadosPagos, agregadosPendentes] = await Promise.all([
      clienteIds.length === 0
        ? Promise.resolve([])
        : prisma.pedido.groupBy({
            by: ['clienteId'],
            where: { clienteId: { in: clienteIds }, status: { in: STATUS_PAGO_TODOS } },
            _sum: { total: true },
            _count: { _all: true },
          }),
      clienteIds.length === 0
        ? Promise.resolve([])
        : prisma.pedido.groupBy({
            by: ['clienteId'],
            where: { clienteId: { in: clienteIds }, status: { in: STATUS_PENDENTE_TODOS } },
            _count: { _all: true },
          }),
    ])
    const pagoMap = new Map(agregadosPagos.map((a) => [a.clienteId, a]))
    const pendenteMap = new Map(agregadosPendentes.map((a) => [a.clienteId, a]))
    const clientesAjustados = clientes.map((c) => {
      const pago = pagoMap.get(c.id)
      const pendente = pendenteMap.get(c.id)
      return {
        ...c,
        totalGasto:        Number(pago?._sum.total ?? 0),
        totalPedidosPagos: pago?._count._all ?? 0,
        totalPedidosPendentes: pendente?._count._all ?? 0,
      }
    })

    return NextResponse.json({
      clientes: clientesAjustados,
      total,
      totalGeral,
      page,
      limit,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      estados: estadosRaw.map(e => e.estado).filter(Boolean),
    })
  } catch (err) {
    console.error('Erro /api/admin/clientes:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
