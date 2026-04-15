import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { calcularNivel } from '@/lib/avatares'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const clientes = await prisma.cliente.findMany({
    select: {
      id:           true,
      nome:         true,
      email:        true,
      cashbackSaldo: true,
      totalGasto:    true,
      ultimaCompra:  true,
      cashback: {
        select: { tipo: true, valor: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { totalGasto: 'desc' },
  })

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const clientesComNivel = clientes.map(c => {
    const cashbackAcumulado = c.cashback
      .filter(t => t.tipo === 'credito')
      .reduce((s, t) => s + Number(t.valor), 0)

    const emitidoMes = c.cashback
      .filter(t => t.tipo === 'credito' && new Date(t.createdAt) >= inicioMes)
      .reduce((s, t) => s + Number(t.valor), 0)

    const resgatadoMes = c.cashback
      .filter(t => t.tipo === 'debito' && new Date(t.createdAt) >= inicioMes)
      .reduce((s, t) => s + Number(t.valor), 0)

    return {
      id:               c.id,
      nome:             c.nome,
      email:            c.email,
      totalGasto:       Number(c.totalGasto ?? 0),
      cashbackSaldo:    Number(c.cashbackSaldo ?? 0),
      nivel:            calcularNivel(Number(c.totalGasto ?? 0)),
      cashbackAcumulado,
      emitidoMes,
      resgatadoMes,
      ultimaCompra:     c.ultimaCompra,
    }
  })

  const totalClientes     = clientesComNivel.length
  const saldoEmCirculacao = clientesComNivel.reduce((s, c) => s + c.cashbackSaldo, 0)
  const emitidoMesTotal   = clientesComNivel.reduce((s, c) => s + c.emitidoMes, 0)
  const resgatadoMesTotal = clientesComNivel.reduce((s, c) => s + c.resgatadoMes, 0)

  // Compatibilidade com código legado (ranking)
  const ranking = await prisma.cliente.findMany({
    select: {
      id:     true,
      nome:   true,
      email:  true,
      pontos: { select: { pontos: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    clientes: clientesComNivel,
    stats: {
      totalClientes,
      saldoEmCirculacao,
      emitidoMes: emitidoMesTotal,
      resgatadoMes: resgatadoMesTotal,
    },
    ranking,
  })
}
