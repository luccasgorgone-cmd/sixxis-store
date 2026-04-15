import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

const diasNome = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { searchParams } = req.nextUrl
  const periodo = searchParams.get('periodo') || '30d'
  const diasMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }
  const dias = diasMap[periodo] ?? 30

  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - dias)
  dataInicio.setHours(0, 0, 0, 0)

  const pedidos = await prisma.pedido.findMany({
    where: {
      createdAt: { gte: dataInicio },
      status: { in: ['pago', 'enviado', 'entregue', 'PAGO', 'ENVIADO', 'ENTREGUE'] },
    },
    select: {
      createdAt: true,
      total: true,
      itens: { select: { quantidade: true } },
    },
  })

  // Por hora
  const porHora: Record<number, { pedidos: number; receita: number; itens: number }> = {}
  for (let h = 0; h < 24; h++) porHora[h] = { pedidos: 0, receita: 0, itens: 0 }

  // Por dia da semana
  const porDiaSemana: Record<number, { pedidos: number; receita: number }> = {}
  for (let d = 0; d < 7; d++) porDiaSemana[d] = { pedidos: 0, receita: 0 }

  // Por data
  const porData: Record<string, { pedidos: number; receita: number }> = {}

  // Heatmap
  const heatmap: Record<string, number> = {}

  let totalReceita = 0
  for (const p of pedidos) {
    const d = new Date(p.createdAt)
    const hora = d.getHours()
    const diaSemana = d.getDay()
    const total = Number(p.total || 0)
    const qtdItens = p.itens.reduce((s, i) => s + i.quantidade, 0)

    porHora[hora].pedidos++
    porHora[hora].receita += total
    porHora[hora].itens += qtdItens

    porDiaSemana[diaSemana].pedidos++
    porDiaSemana[diaSemana].receita += total

    const dataKey = d.toISOString().split('T')[0]
    if (!porData[dataKey]) porData[dataKey] = { pedidos: 0, receita: 0 }
    porData[dataKey].pedidos++
    porData[dataKey].receita += total

    const hmKey = `${diaSemana}_${hora}`
    heatmap[hmKey] = (heatmap[hmKey] || 0) + 1

    totalReceita += total
  }

  const melhoresHoras = Object.entries(porHora)
    .map(([hora, d]) => ({ hora: parseInt(hora), ...d }))
    .filter(h => h.pedidos > 0)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 5)

  const melhoresDias = Object.entries(porDiaSemana)
    .map(([dia, d]) => ({ dia: parseInt(dia), nome: diasNome[parseInt(dia)], ...d }))
    .sort((a, b) => b.receita - a.receita)

  // Previsão próximos 7 dias
  const agora = new Date()
  const totalPedidos = pedidos.length
  const mediaDia = totalPedidos / dias
  const receitaDia = totalReceita / dias
  const previsao = []

  for (let d = 1; d <= 7; d++) {
    const futuro = new Date(agora)
    futuro.setDate(futuro.getDate() + d)
    const diaSemana = futuro.getDay()
    // fator de ajuste: peso do dia da semana dividido por (total/7)
    const mediaSemanal = totalPedidos / 7 || 1
    const fator = porDiaSemana[diaSemana].pedidos / mediaSemanal || 1

    previsao.push({
      data: futuro.toISOString().split('T')[0],
      diaSemana,
      nomeDia: diasNome[diaSemana],
      previsaoPedidos: Math.max(0, Math.round(mediaDia * fator)),
      previsaoReceita: Math.max(0, Math.round(receitaDia * fator)),
      melhorHorario: melhoresHoras[0]?.hora ?? 20,
      confianca: totalPedidos >= 30 ? 'alta' : totalPedidos >= 10 ? 'média' : 'baixa',
    })
  }

  return NextResponse.json({
    resumo: {
      totalPedidos,
      totalReceita,
      mediaPorDia: Math.round(mediaDia * 10) / 10,
      ticketMedio: totalPedidos > 0 ? Math.round(totalReceita / totalPedidos) : 0,
    },
    porHora: Object.entries(porHora).map(([hora, d]) => ({
      hora: parseInt(hora),
      label: `${hora.padStart(2, '0')}h`,
      ...d,
    })),
    porDiaSemana: melhoresDias,
    melhoresHoras,
    porData: Object.entries(porData)
      .map(([data, d]) => ({ data, ...d }))
      .sort((a, b) => a.data.localeCompare(b.data)),
    previsao,
    heatmap,
    periodo,
  })
}
