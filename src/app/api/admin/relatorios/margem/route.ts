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
// LUCRO = total − taxa MP − custo de frete real − COGS.
// (Antes da Fase 2 isto era só "margem de contribuição", sem o COGS.)
//
// COGS do pedido = Σ (item.quantidade × produto.custoProduto).
//
// Custos ZERO vs. custos DESCONHECIDOS — a regra que sustenta o relatório:
//   • mpTaxaReal null      → taxa pendente de sincronização.
//   • custoFreteReal null  → frete ainda não lançado pelo admin.
//   • QUALQUER item do pedido com produto.custoProduto null → COGS incompleto.
// Nos três casos a linha NÃO soma 0: ela sai do cálculo (lucro `null`). Tratar
// custo ausente como R$ 0 inflaria o lucro — o erro que um relatório financeiro
// não pode cometer. Um COGS parcial (2 de 3 itens com custo) é igualmente
// mentiroso, por isso basta UM item sem custo para a linha ficar pendente.
//
// Por isso os totais trazem `completas` (linhas com TODOS os custos conhecidos):
// a margem % média é calculada SÓ sobre elas, senão o número seria otimista.
//
// TODO (snapshot histórico): usamos o custo ATUAL do produto, não o custo na
// data da venda. Se o custo de aquisição mudar, o lucro de pedidos antigos muda
// junto. O correto é congelar `custoUnitario` em ItemPedido no momento do
// pedido; fica para uma fase futura (exige coluna nova + backfill).
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
      itens: {
        select: {
          quantidade: true,
          produto: { select: { custoProduto: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const linhas = pedidos.map((p) => {
    const venda = Number(p.total)
    const taxaMp = p.mpTaxaReal != null ? Number(p.mpTaxaReal) : null
    const custoFrete = p.custoFreteReal != null ? Number(p.custoFreteReal) : null

    // COGS: só é conhecido se TODOS os itens tiverem custo. Um pedido sem itens
    // (não deveria existir) também conta como pendente, não como COGS zero.
    const semCusto = p.itens.some((i) => i.produto.custoProduto == null)
    const custoProdutos =
      p.itens.length > 0 && !semCusto
        ? p.itens.reduce((s, i) => s + Number(i.produto.custoProduto) * i.quantidade, 0)
        : null

    const completa = taxaMp != null && custoFrete != null && custoProdutos != null
    const lucro = completa ? venda - taxaMp! - custoFrete! - custoProdutos! : null

    return {
      pedidoId: p.id,
      data: p.createdAt.toISOString(),
      cliente: p.cliente.nome,
      formaPagamento: p.formaPagamento,
      venda,
      taxaMp,
      custoFrete,
      custoProdutos,
      margem: lucro,
      margemPct: lucro != null && venda > 0 ? (lucro / venda) * 100 : null,
      taxaPendente: taxaMp == null,
      fretePendente: custoFrete == null,
      custoPendente: custoProdutos == null,
    }
  })

  const soma = (ns: (number | null)[]) => ns.reduce<number>((s, n) => s + (n ?? 0), 0)
  const completas = linhas.filter((l) => !l.taxaPendente && !l.fretePendente && !l.custoPendente)

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
      // Σ COGS apenas das linhas completas — somar COGS de linhas sem taxa/frete
      // daria um total que não casa com o lucro exibido.
      custoProdutos: soma(completas.map((l) => l.custoProdutos)),
      // Σ lucro apenas das linhas completas — comparável com `vendasCompletas`.
      margem: margemCompletas,
      margemPctMedia: vendasCompletas > 0 ? (margemCompletas / vendasCompletas) * 100 : null,
      // Transparência: quantas linhas ficaram de fora do lucro e por quê.
      linhasCompletas: completas.length,
      taxasPendentes: linhas.filter((l) => l.taxaPendente).length,
      fretesPendentes: linhas.filter((l) => l.fretePendente).length,
      custosPendentes: linhas.filter((l) => l.custoPendente).length,
      vendasCompletas,
    },
  })
}
