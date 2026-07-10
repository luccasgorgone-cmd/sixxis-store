import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { resolverPeriodo } from '@/lib/periodo-admin'
import { STATUS_PAGO_TODOS } from '@/lib/pedido-status'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Margem de contribuição por venda. SÓ ADMIN — nada disso vai para o cliente.
//
//   GET /api/admin/relatorios/margem?periodo=30d
//   GET /api/admin/relatorios/margem?from=2026-07-01&to=2026-07-09
//
// Mesmo filtro de período do dashboard (resolverPeriodo) e mesma base de
// pedidos PAGOS (STATUS_PAGO_TODOS) que o card "Custo de Frete (empresa)".
//
// Margem = total − taxa MP − custo de frete real.
//
// Custos ainda NÃO nulos vs. custos DESCONHECIDOS:
//   • mpTaxaReal null      → taxa pendente de sincronização. A linha entra com
//     taxaPendente=true e NÃO soma 0 na margem: a margem dela é `null` (não dá
//     para afirmar a margem sem saber a taxa). Somar 0 mentiria pra cima.
//   • custoFreteReal null  → frete ainda não lançado pelo admin. Mesmo raciocínio.
//
// Por isso os totais trazem `completas` (linhas com todos os custos conhecidos):
// a margem % média é calculada SÓ sobre elas, senão o número seria otimista.
//
// TODO (COGS): quando o custo de produto vier do ERP, subtrair aqui também —
// `custoProdutos` por pedido (soma de ItemPedido.quantidade × custoUnitario).
// O front já reserva a coluna; basta preencher o campo abaixo.
export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { from, to } = resolverPeriodo(request.nextUrl.searchParams)

  const pedidos = await prisma.pedido.findMany({
    where: { createdAt: { gte: from, lte: to }, status: { in: STATUS_PAGO_TODOS } },
    select: {
      id: true,
      createdAt: true,
      total: true,
      mpTaxaReal: true,
      custoFreteReal: true,
      formaPagamento: true,
      cliente: { select: { nome: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const linhas = pedidos.map((p) => {
    const venda = Number(p.total)
    const taxaMp = p.mpTaxaReal != null ? Number(p.mpTaxaReal) : null
    const custoFrete = p.custoFreteReal != null ? Number(p.custoFreteReal) : null
    const completa = taxaMp != null && custoFrete != null

    return {
      pedidoId: p.id,
      data: p.createdAt.toISOString(),
      cliente: p.cliente.nome,
      formaPagamento: p.formaPagamento,
      venda,
      taxaMp,
      custoFrete,
      // TODO (COGS): custoProdutos: null,
      custoProdutos: null as number | null,
      margem: completa ? venda - taxaMp! - custoFrete! : null,
      margemPct: completa && venda > 0 ? ((venda - taxaMp! - custoFrete!) / venda) * 100 : null,
      taxaPendente: taxaMp == null,
      fretePendente: custoFrete == null,
    }
  })

  const soma = (ns: (number | null)[]) => ns.reduce<number>((s, n) => s + (n ?? 0), 0)
  const completas = linhas.filter((l) => !l.taxaPendente && !l.fretePendente)

  const vendasCompletas = soma(completas.map((l) => l.venda))
  const margemCompletas = soma(completas.map((l) => l.margem))

  return NextResponse.json({
    periodo: { from: from.toISOString(), to: to.toISOString() },
    linhas,
    totais: {
      pedidos: linhas.length,
      // Σ vendas de TODAS as linhas do período.
      vendas: soma(linhas.map((l) => l.venda)),
      // Σ dos custos CONHECIDOS (linhas pendentes simplesmente não somam).
      taxaMp: soma(linhas.map((l) => l.taxaMp)),
      custoFrete: soma(linhas.map((l) => l.custoFrete)),
      // Σ margem apenas das linhas completas — comparável com `vendasCompletas`.
      margem: margemCompletas,
      margemPctMedia: vendasCompletas > 0 ? (margemCompletas / vendasCompletas) * 100 : null,
      // Transparência: quantas linhas ficaram de fora da margem e por quê.
      linhasCompletas: completas.length,
      taxasPendentes: linhas.filter((l) => l.taxaPendente).length,
      fretesPendentes: linhas.filter((l) => l.fretePendente).length,
      vendasCompletas,
    },
  })
}
