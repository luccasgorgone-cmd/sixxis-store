import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { resolverPeriodo } from '@/lib/periodo-admin'
import { STATUS_PAGO_TODOS } from '@/lib/pedido-status'

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

  const soma = (ns: (number | null)[]) => ns.reduce<number>((s, n) => s + (n ?? 0), 0)

  // Duas bases distintas — cada resultado só soma as linhas em que ele existe.
  const comContrib = linhas.filter((l) => l.margemContrib != null)
  const comLucro   = linhas.filter((l) => l.lucroReal != null)

  const vendasComContrib = soma(comContrib.map((l) => l.venda))
  const vendasComLucro   = soma(comLucro.map((l) => l.venda))
  const somaMargemContrib = soma(comContrib.map((l) => l.margemContrib))
  const somaLucroReal     = soma(comLucro.map((l) => l.lucroReal))

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

      // Nível 1 — disponível agora.
      margemContrib: somaMargemContrib,
      margemContribPctMedia: vendasComContrib > 0 ? (somaMargemContrib / vendasComContrib) * 100 : null,
      linhasComContrib: comContrib.length,

      // Nível 2 — COGS e lucro só sobre as linhas em que o lucro existe, senão
      // o total não casaria com as linhas exibidas.
      custoProdutos: soma(comLucro.map((l) => l.custoProdutos)),
      lucroReal: somaLucroReal,
      lucroRealPctMedia: vendasComLucro > 0 ? (somaLucroReal / vendasComLucro) * 100 : null,
      linhasComLucro: comLucro.length,
      /** false → a UI mostra "aguardando custos" em vez de R$ 0,00. */
      lucroDisponivel: comLucro.length > 0,

      // Transparência: o que ficou de fora e por quê.
      taxasPendentes: linhas.filter((l) => l.taxaPendente).length,
      fretesPendentes: linhas.filter((l) => l.fretePendente).length,
      custosPendentes: linhas.filter((l) => l.custoPendente).length,
      vendasComContrib,
      vendasComLucro,
    },
    // Checklist acionável: quais produtos ainda precisam de custo cadastrado.
    produtosSemCusto: {
      total: produtosSemCusto.length,
      totalProdutos,
      lista: produtosSemCusto,
    },
  })
}
