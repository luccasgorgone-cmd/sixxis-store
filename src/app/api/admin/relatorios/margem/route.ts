import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { resolverPeriodo } from '@/lib/periodo-admin'
import { STATUS_PAGO_TODOS } from '@/lib/pedido-status'
import {
  agregarTotais, agregarSerieTemporal, agregarPorForma,
  DIAS_P_AGRUPAR_POR_SEMANA,
} from '@/lib/margem-agregacoes'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Resultado por venda, em dois níveis. SÓ ADMIN — nada disso vai para o cliente.
//
//   GET /api/admin/relatorios/margem?periodo=30d
//   GET /api/admin/relatorios/margem?from=2026-07-01&to=2026-07-09
//
// Mesmo filtro de período do dashboard (resolverPeriodo) e mesma base de
// pedidos PAGOS (STATUS_PAGO_TODOS) que o card "Custo de Frete (empresa)".
//
// DOIS níveis de resultado, com dependências DIFERENTES — é o ponto do relatório:
//
//   1) MARGEM DE CONTRIBUIÇÃO = venda − taxa MP − frete
//      Não depende do custo do produto. Já calculável hoje.
//      Pendente só se taxa OU frete forem desconhecidos.
//
//   2) LUCRO REAL = margem de contribuição − COGS
//      COGS do pedido = Σ (item.quantidade × item.custoUnitario).
//      Pendente se a margem de contribuição for pendente OU faltar algum custo.
//
// Separá-los evita o pior erro possível aqui: exibir a margem de contribuição
// como se fosse lucro. Ela ignora o custo da mercadoria — é sempre maior que o
// lucro real, e um pedido com margem de contribuição positiva pode dar prejuízo.
//
// `custoUnitario` é o SNAPSHOT do custo do produto no instante da venda, gravado
// na criação do pedido. Antes líamos `produto.custoProduto` (custo ATUAL), o que
// fazia o lucro de vendas passadas mudar sozinho quando o custo era reajustado.
//
// Custos ZERO vs. custos DESCONHECIDOS — a regra que sustenta o relatório:
//   • mpTaxaReal null      → taxa pendente de sincronização.
//   • custoFreteReal null  → frete ainda não lançado pelo admin.
//   • QUALQUER item do pedido com custoUnitario null → COGS incompleto.
// Em nenhum caso a linha soma 0: ela sai do total correspondente. Tratar custo
// ausente como R$ 0 inflaria o resultado — o erro que um relatório financeiro
// não pode cometer. Um COGS parcial (2 de 3 itens com custo) é igualmente
// mentiroso, por isso basta UM item sem custo para o COGS ficar pendente.
//
// Por isso cada total tem sua própria base de linhas:
//   • margem de contribuição → linhas com taxa + frete conhecidos
//   • lucro real             → essas MESMAS linhas e também com COGS conhecido
// Os percentuais médios usam a soma de vendas da base correspondente, senão o
// número sairia otimista.
//
// Pedidos anteriores à coluna `custoUnitario` têm snapshot null → ficam "custo
// pendente" até rodar POST /api/admin/pedidos/snapshot-custos (que preenche com
// o custo atual, a melhor aproximação disponível para o passado).

/** Rótulos estáveis de forma de pagamento (também usados como valor de filtro). */
export type FormaPagto = 'PIX' | 'Cartão à vista' | 'Parcelado' | 'Outros'

/**
 * Deriva a forma a partir do pagamento APROVADO do pedido (fallback: o mais
 * recente). `Pedido.formaPagamento` não serve: é sempre 'mercado_pago'.
 * Cartão com 1 parcela (ou sem parcelas informadas) = à vista; 2x+ = Parcelado.
 */
function normalizarForma(
  pagamentos: { metodo: string; parcelas: number | null; mpStatus: string }[],
): FormaPagto {
  const pg = pagamentos.find((p) => p.mpStatus === 'approved') ?? pagamentos[0]
  if (!pg) return 'Outros'
  const m = pg.metodo.toLowerCase()
  if (m.includes('pix')) return 'PIX'
  if (m.includes('credit') || m.includes('cart')) {
    return (pg.parcelas ?? 1) >= 2 ? 'Parcelado' : 'Cartão à vista'
  }
  return 'Outros'
}

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { from, to } = resolverPeriodo(request.nextUrl.searchParams)

  const [pedidos, produtosSemCusto, totalProdutos] = await Promise.all([
    prisma.pedido.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { in: STATUS_PAGO_TODOS } },
      select: {
        id: true,
        createdAt: true,
        total: true,
        mpTaxaReal: true,
        custoFreteReal: true,
        formaPagamento: true,
        cliente: { select: { nome: true } },
        itens: { select: { quantidade: true, custoUnitario: true } },
        // A forma REAL (pix / cartão / nº de parcelas) vive no Pagamento.
        // `Pedido.formaPagamento` é sempre 'mercado_pago' — o gateway, não o meio.
        pagamentos: {
          select: { metodo: true, parcelas: true, mpStatus: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Checklist do que falta preencher (independe do período).
    prisma.produto.findMany({
      where:   { custoProduto: null },
      select:  { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.produto.count(),
  ])

  const linhas = pedidos.map((p) => {
    const venda = Number(p.total)
    const taxaMp = p.mpTaxaReal != null ? Number(p.mpTaxaReal) : null
    const custoFrete = p.custoFreteReal != null ? Number(p.custoFreteReal) : null

    // COGS: só é conhecido se TODOS os itens tiverem o snapshot de custo. Um
    // pedido sem itens (não deveria existir) também conta como pendente, não
    // como COGS zero. Um COGS parcial mentiria tanto quanto um custo ausente.
    const semCusto = p.itens.some((i) => i.custoUnitario == null)
    const custoProdutos =
      p.itens.length > 0 && !semCusto
        ? p.itens.reduce((s, i) => s + Number(i.custoUnitario) * i.quantidade, 0)
        : null

    // Nível 1 — independe do custo do produto.
    const contribPendente = taxaMp == null || custoFrete == null
    const margemContrib = contribPendente ? null : venda - taxaMp! - custoFrete!

    // Nível 2 — exige o nível 1 E o COGS. NUNCA cai de volta na margem de
    // contribuição quando o custo falta: fica null ("a definir").
    const lucroReal =
      margemContrib != null && custoProdutos != null ? margemContrib - custoProdutos : null

    return {
      pedidoId: p.id,
      data: p.createdAt.toISOString(),
      cliente: p.cliente.nome,
      formaPagamento: p.formaPagamento,
      /** Forma normalizada (PIX / Cartão à vista / Parcelado / Outros). */
      forma: normalizarForma(p.pagamentos),
      venda,
      taxaMp,
      custoFrete,
      custoProdutos,
      margemContrib,
      margemContribPct: margemContrib != null && venda > 0 ? (margemContrib / venda) * 100 : null,
      lucroReal,
      lucroRealPct: lucroReal != null && venda > 0 ? (lucroReal / venda) * 100 : null,
      taxaPendente: taxaMp == null,
      fretePendente: custoFrete == null,
      custoPendente: custoProdutos == null,
    }
  })

  const dias = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000))
  const agruparPorSemana = dias > DIAS_P_AGRUPAR_POR_SEMANA

  // Agregações puras (fonte única, compartilhada com a página no filtro client).
  const totais = agregarTotais(linhas)
  const serieTemporal = agregarSerieTemporal(linhas, agruparPorSemana)
  const porFormaPagamento = agregarPorForma(linhas)

  return NextResponse.json({
    periodo: { from: from.toISOString(), to: to.toISOString() },
    linhas,
    totais,
    serieTemporal,
    /** 'dia' | 'semana' — a UI usa para rotular o eixo. */
    granularidade: agruparPorSemana ? 'semana' : 'dia',
    porFormaPagamento,
    // Checklist acionável: quais produtos ainda precisam de custo cadastrado.
    produtosSemCusto: {
      total: produtosSemCusto.length,
      totalProdutos,
      lista: produtosSemCusto,
    },
  })
}
