import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcularNivelCompleto } from '@/lib/avatares'

export const dynamic = 'force-dynamic'

function getEstatisticasVazias() {
  return { totalCompras: 0, cashbackAcumulado: 0, cashbackUsado: 0, economiaTotal: 0, ultimaCompra: null }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({
        saldo: 0, percentual: 0.03, extrato: [], totalGasto: 0,
        nivel: calcularNivelCompleto(0), estatisticas: getEstatisticasVazias(),
      })
    }
    const clienteId = session.user.id

    // Buscar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { cashbackSaldo: true, totalGasto: true },
    }).catch(() => null)

    // Extrato
    const extratoRaw = await prisma.cashbackTransacao.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }).catch(() => [])

    // Stats de pedidos
    const pedidosStats = await prisma.pedido.aggregate({
      where: { clienteId, status: { in: ['entregue', 'pago', 'ENTREGUE', 'PAGO'] } },
      _count: { id: true },
      _sum: { total: true },
    }).catch(() => ({ _count: { id: 0 }, _sum: { total: null } }))

    const totalGasto = Number(pedidosStats._sum?.total ?? cliente?.totalGasto ?? 0)
    const saldo = Number(cliente?.cashbackSaldo ?? 0)

    const cashbackAcumulado = extratoRaw
      .filter((t) => t.tipo === 'credito')
      .reduce((s, t) => s + Number(t.valor), 0)
    const cashbackUsado = extratoRaw
      .filter((t) => t.tipo === 'debito')
      .reduce((s, t) => s + Number(t.valor), 0)

    const extrato = extratoRaw.map((t) => ({
      id: t.id,
      tipo: t.tipo,
      valor: Number(t.valor),
      descricao: t.descricao,
      pedidoId: t.pedidoId,
      createdAt: t.createdAt,
    }))

    return NextResponse.json({
      saldo,
      percentual: calcularNivelCompleto(totalGasto).cashbackPct,
      extrato,
      totalGasto,
      nivel: calcularNivelCompleto(totalGasto),
      estatisticas: {
        totalCompras: pedidosStats._count?.id ?? 0,
        cashbackAcumulado,
        cashbackUsado,
        economiaTotal: cashbackUsado,
        ultimaCompra: extratoRaw[0]?.createdAt ?? null,
      },
    })
  } catch (err) {
    console.error('[cashback GET]', err)
    return NextResponse.json({
      saldo: 0, percentual: 0.03, extrato: [], totalGasto: 0,
      nivel: calcularNivelCompleto(0), estatisticas: getEstatisticasVazias(),
    })
  }
}

// POST — aplicar cashback no checkout (valida e reserva)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { valor } = await req.json() as { valor: number }
  if (!valor || valor <= 0) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })

  const cliente = await prisma.cliente.findUnique({
    where:  { id: session.user.id },
    select: { cashbackSaldo: true },
  })

  if (!cliente || cliente.cashbackSaldo < valor) {
    return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, saldo: cliente.cashbackSaldo, valorDisponivel: Math.min(valor, cliente.cashbackSaldo) })
}
