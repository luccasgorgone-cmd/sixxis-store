import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function calcularNivel(totalGasto: number) {
  const niveis = [
    { nome: 'Bronze',   min: 0,     max: 499,     cor: '#cd7f32', bg: '#fdf3e7', corTexto: '#92400e', cashbackPct: 0.02, proximoNome: 'Prata' as string | null },
    { nome: 'Prata',    min: 500,   max: 1999,    cor: '#94a3b8', bg: '#f1f5f9', corTexto: '#475569', cashbackPct: 0.03, proximoNome: 'Ouro' as string | null },
    { nome: 'Ouro',     min: 2000,  max: 4999,    cor: '#f59e0b', bg: '#fffbeb', corTexto: '#92400e', cashbackPct: 0.04, proximoNome: 'Diamante' as string | null },
    { nome: 'Diamante', min: 5000,  max: 9999,    cor: '#3b82f6', bg: '#eff6ff', corTexto: '#1e40af', cashbackPct: 0.05, proximoNome: 'Black' as string | null },
    { nome: 'Black',    min: 10000, max: Infinity, cor: '#1a1a1a', bg: '#f3f4f6', corTexto: '#ffffff', cashbackPct: 0.06, proximoNome: null },
  ]
  const idx = niveis.findIndex(n => totalGasto >= n.min && (n.max === Infinity || totalGasto <= n.max))
  const nivel = niveis[Math.max(0, idx)]
  const progressoPercent = nivel.max === Infinity
    ? 100
    : Math.round(((totalGasto - nivel.min) / (nivel.max - nivel.min + 1)) * 100)
  return {
    atual: nivel.nome,
    proximoNivel: nivel.proximoNome,
    faltam: nivel.max === Infinity ? 0 : Math.max(0, nivel.max + 1 - totalGasto),
    progressoPercent: Math.min(100, Math.max(0, progressoPercent)),
    cor: nivel.cor,
    bg: nivel.bg,
    corTexto: nivel.corTexto,
    cashbackPct: nivel.cashbackPct,
    minGasto: nivel.min,
    maxGasto: nivel.max,
  }
}

function getEstatisticasVazias() {
  return { totalCompras: 0, cashbackAcumulado: 0, cashbackUsado: 0, economiaTotal: 0, ultimaCompra: null }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({
        saldo: 0, percentual: 0.03, extrato: [], totalGasto: 0,
        nivel: calcularNivel(0), estatisticas: getEstatisticasVazias(),
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
      percentual: calcularNivel(totalGasto).cashbackPct,
      extrato,
      totalGasto,
      nivel: calcularNivel(totalGasto),
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
      nivel: calcularNivel(0), estatisticas: getEstatisticasVazias(),
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
