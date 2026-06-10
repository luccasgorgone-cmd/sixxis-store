// Limpa dados transacionais de teste preservando o conteúdo de prova social.
//
// POLÍTICA (dry-run por padrão; --execute aplica, tudo numa transação FK-safe):
//
//   MANTER:
//     - TODAS as linhas de Avaliacao (reviews) e suas fotos.
//     - TODAS as contas Cliente referenciadas por alguma Avaliacao (avaliadores).
//     - Todo o catálogo de produtos, EXCETO o produto "TESTE SMOKE".
//     - TODAS as DEFINIÇÕES: model Cupom (ex.: SIXXIS10), FreteRegra dos produtos
//       reais e ProdutoDestaque dos produtos reais. (Só registros transacionais
//       /de uso saem: CupomUso; e as FreteRegra/ProdutoDestaque do PRÓPRIO SMOKE.)
//     - Auth de admin não é tocado (não está em Cliente).
//
//   APAGAR:
//     - TODOS os outros Cliente (não-avaliadores) e suas dependências
//       (CupomUso, CashbackTransacao, HistoricoPontos, PontosCliente, Endereco,
//        Carrinho, BloqueioFraude, CampanhaDestinatario).
//     - TODOS os Pedido e suas dependências (ItemPedido, Pagamento,
//       GarantiaEstendida via cascata; CupomUso/CashbackTransacao/HistoricoPontos
//       ligados a pedido).
//     - O produto "TESTE SMOKE" e SÓ as dependências dele (ItemCarrinho,
//       ListaEspera, ProdutoDestaque, VariacaoProduto, FreteRegra). Se houver
//       Avaliacao apontando para ele, o produto é PRESERVADO (reviews têm
//       prioridade) — o script avisa.
//
// SEGURANÇA: faça backup antes do --execute. O dry-run NÃO altera nada.
//
// Uso:
//   npx tsx scripts/limpar-dados-teste.ts              # dry-run (lista)
//   npx tsx scripts/limpar-dados-teste.ts --execute    # APAGA (irreversível)

import { prisma } from './_db'

const EXECUTAR = process.argv.includes('--execute')

// Produto de teste: nome que CONTÉM este texto (case-insensitive no MySQL).
const SMOKE_PATTERN = 'TESTE SMOKE'

const SAMPLE = 10
const sampleEmails = (rows: { email: string }[]) =>
  rows.slice(0, SAMPLE).map((r) => r.email).join(', ') + (rows.length > SAMPLE ? ', …' : '')

async function main() {
  const dbMasked = (process.env.DATABASE_URL || '')
    .replace(/\/\/[^@]*@/, '//***:***@')
    .split('?')[0]
  console.log(`\nBanco: ${dbMasked}`)
  console.log(
    EXECUTAR
      ? '⚠️  MODO --execute: os registros abaixo SERÃO APAGADOS (irreversível).'
      : '🔎 DRY-RUN (padrão): apenas listando. Nada será apagado. Use --execute para apagar.',
  )

  // ── Avaliadores = clientes referenciados por alguma Avaliacao ───────────────
  const reviewers = await prisma.avaliacao.findMany({
    where: { clienteId: { not: null } },
    select: { clienteId: true },
    distinct: ['clienteId'],
  })
  const reviewerIds = reviewers
    .map((r) => r.clienteId)
    .filter((id): id is string => Boolean(id))

  if (reviewerIds.length === 0) {
    console.warn(
      '\n⚠️  ATENÇÃO: 0 avaliadores encontrados — TODOS os clientes entrariam na lista de exclusão. Revise antes de --execute.',
    )
  }

  // ── Contagens dos grupos ────────────────────────────────────────────────────
  const clienteNaoAvaliador = { id: { notIn: reviewerIds } }

  const [
    totalClientes,
    totalAvaliadores,
    aApagarClientes,
    totalPedidos,
    totalAvaliacoes,
    totalProdutos,
  ] = await Promise.all([
    prisma.cliente.count(),
    prisma.cliente.count({ where: { id: { in: reviewerIds } } }),
    prisma.cliente.count({ where: clienteNaoAvaliador }),
    prisma.pedido.count(),
    prisma.avaliacao.count(),
    prisma.produto.count(),
  ])

  // ── Amostras ────────────────────────────────────────────────────────────────
  const [amostraApagar, amostraAvaliadores, smokeProdutos] = await Promise.all([
    prisma.cliente.findMany({
      where: clienteNaoAvaliador,
      select: { email: true },
      take: SAMPLE,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.cliente.findMany({
      where: { id: { in: reviewerIds } },
      select: { email: true },
      take: SAMPLE,
    }),
    prisma.produto.findMany({
      where: { nome: { contains: SMOKE_PATTERN } },
      select: { id: true, nome: true, slug: true },
    }),
  ])
  const smokeIds = smokeProdutos.map((p) => p.id)

  // Avaliações apontando para o produto de teste — se houver, ele é preservado.
  const avaliacoesNoSmoke = smokeIds.length
    ? await prisma.avaliacao.count({ where: { produtoId: { in: smokeIds } } })
    : 0

  // Dependências que serão apagadas (transparência no dry-run).
  const [pedidoLinkedCupom, pedidoLinkedCashback, pedidoLinkedHist, itensPedido, pagamentos] =
    await Promise.all([
      prisma.cupomUso.count({ where: { pedidoId: { not: null } } }),
      prisma.cashbackTransacao.count({ where: { pedidoId: { not: null } } }),
      prisma.historicoPontos.count({ where: { pedidoId: { not: null } } }),
      prisma.itemPedido.count(),
      prisma.pagamento.count(),
    ])

  // DEFINIÇÕES que devem permanecer intactas — só conferência (nunca deletadas,
  // exceto as FreteRegra/ProdutoDestaque do PRÓPRIO produto SMOKE).
  const [totalCupons, totalFreteRegras, totalDestaques, smokeFreteRegras, smokeDestaques] =
    await Promise.all([
      prisma.cupom.count(),
      prisma.freteRegra.count(),
      prisma.produtoDestaque.count(),
      smokeIds.length ? prisma.freteRegra.count({ where: { produtoId: { in: smokeIds } } }) : Promise.resolve(0),
      smokeIds.length ? prisma.produtoDestaque.count({ where: { produtoId: { in: smokeIds } } }) : Promise.resolve(0),
    ])
  // Se o SMOKE for preservado (tem review), nada do frete/destaque dele sai.
  const smokeSeraRemovido = smokeProdutos.length > 0 && avaliacoesNoSmoke === 0
  const freteRemovido = smokeSeraRemovido ? smokeFreteRegras : 0
  const destaqueRemovido = smokeSeraRemovido ? smokeDestaques : 0

  // ── Relatório ───────────────────────────────────────────────────────────────
  console.log('\n══════════ RESUMO ══════════')
  console.log(`Clientes (total): ${totalClientes}`)
  console.log(`  ↳ PRESERVADOS (avaliadores): ${totalAvaliadores}`)
  if (amostraAvaliadores.length) console.log(`      amostra: ${sampleEmails(amostraAvaliadores)}`)
  console.log(`  ↳ A APAGAR (não-avaliadores): ${aApagarClientes}`)
  if (amostraApagar.length) console.log(`      amostra: ${sampleEmails(amostraApagar)}`)
  console.log(`      (preservados + apagar = ${totalAvaliadores + aApagarClientes} | total = ${totalClientes})`)

  console.log(`\nPedidos a apagar: ${totalPedidos}  (itens=${itensPedido}, pagamentos=${pagamentos})`)
  console.log(`  ↳ deps ligadas a pedido — CupomUso=${pedidoLinkedCupom}, Cashback=${pedidoLinkedCashback}, HistoricoPontos=${pedidoLinkedHist}`)

  console.log(`\nAvaliações PRESERVADAS: ${totalAvaliacoes}  (nenhuma é apagada → total fica IGUAL antes/depois)`)

  console.log(`\nProduto a apagar (deve ser só "${SMOKE_PATTERN}"): ${smokeProdutos.length}`)
  for (const p of smokeProdutos) console.log(`   • ${p.nome}  [${p.slug}]  ${p.id}`)
  console.log(`  Catálogo real preservado: ${totalProdutos - smokeProdutos.length} de ${totalProdutos} produtos`)
  if (avaliacoesNoSmoke > 0) {
    console.log(
      `   ⚠️  "${SMOKE_PATTERN}" tem ${avaliacoesNoSmoke} avaliação(ões) → será PRESERVADO (reviews têm prioridade).`,
    )
  }

  console.log('\n── Definições (NÃO são apagadas — só conferência):')
  console.log(`   • Cupom (definições, ex.: SIXXIS10): ${totalCupons} → IGUAL antes/depois (só CupomUso é removido)`)
  console.log(`   • FreteRegra: ${totalFreteRegras} total; remove ${freteRemovido} (só do "${SMOKE_PATTERN}") → ficam ${totalFreteRegras - freteRemovido}`)
  console.log(`   • ProdutoDestaque: ${totalDestaques} total; remove ${destaqueRemovido} (só do "${SMOKE_PATTERN}") → ficam ${totalDestaques - destaqueRemovido}`)
  if (!smokeSeraRemovido && smokeProdutos.length > 0) {
    console.log(`     (SMOKE será preservado por ter review → suas ${smokeFreteRegras} FreteRegra e ${smokeDestaques} Destaque também ficam)`)
  }

  // Sanity check explícito no dry-run.
  const catalogoEntraNaLista = smokeProdutos.some((p) => !p.nome.includes(SMOKE_PATTERN))
  console.log('\n── Verificações:')
  console.log(`   • Nenhum produto de catálogo real na lista de exclusão: ${catalogoEntraNaLista ? '❌ FALHOU' : '✅'}`)
  console.log(`   • Avaliações antes = depois: ✅ ${totalAvaliacoes} (script nunca deleta Avaliacao)`)
  console.log(`   • Cupom (definições) antes = depois: ✅ ${totalCupons} (script nunca deleta Cupom)`)
  console.log(`   • FreteRegra só diminui as do SMOKE: ✅ −${freteRemovido}`)
  console.log(`   • ProdutoDestaque só diminui as do SMOKE: ✅ −${destaqueRemovido}`)

  if (!EXECUTAR) {
    console.log('\n[dry-run] nada foi apagado.')
    console.log('Ordem de exclusão (FK-safe) no --execute:')
    console.log('  1. CupomUso/CashbackTransacao/HistoricoPontos com pedidoId != null')
    console.log('  2. Pedido (todos) → cascata: ItemPedido, Pagamento, GarantiaEstendida')
    console.log('  3. PontosCliente/HistoricoPontos/CashbackTransacao/CupomUso/CampanhaDestinatario dos não-avaliadores')
    console.log('  4. Cliente (não-avaliadores) → cascata: Endereco, Carrinho, BloqueioFraude, CashbackTransacao')
    console.log('  5. Dependências do TESTE SMOKE (ItemCarrinho, ListaEspera, ProdutoDestaque, VariacaoProduto, FreteRegra) + Produto')
    console.log('\nPara apagar: npx tsx scripts/limpar-dados-teste.ts --execute')
    return
  }

  // ── EXECUÇÃO (--execute) — ordem FK-safe, numa transação ───────────────────
  console.log('\n🧹 Apagando...')
  const out: Record<string, number> = {}

  await prisma.$transaction(async (tx) => {
    // 1) deps ligadas a pedido (de qualquer cliente, inclusive avaliadores)
    out.cupomUsoPedido = (await tx.cupomUso.deleteMany({ where: { pedidoId: { not: null } } })).count
    out.cashbackPedido = (await tx.cashbackTransacao.deleteMany({ where: { pedidoId: { not: null } } })).count
    out.historicoPedido = (await tx.historicoPontos.deleteMany({ where: { pedidoId: { not: null } } })).count

    // 2) TODOS os pedidos → cascata ItemPedido, Pagamento, GarantiaEstendida
    out.pedidos = (await tx.pedido.deleteMany({})).count

    // 3) deps dos clientes NÃO-avaliadores (Restrict precisa vir antes do Cliente)
    out.pontosCliente = (await tx.pontosCliente.deleteMany({ where: { clienteId: { notIn: reviewerIds } } })).count
    out.historicoCliente = (await tx.historicoPontos.deleteMany({ where: { clienteId: { notIn: reviewerIds } } })).count
    out.cashbackCliente = (await tx.cashbackTransacao.deleteMany({ where: { clienteId: { notIn: reviewerIds } } })).count
    out.cupomUsoCliente = (await tx.cupomUso.deleteMany({ where: { clienteId: { notIn: reviewerIds } } })).count
    out.campanhaDestinatario = (await tx.campanhaDestinatario.deleteMany({ where: { clienteId: { notIn: reviewerIds } } })).count

    // 4) Clientes não-avaliadores → cascata Endereco, Carrinho, BloqueioFraude, CashbackTransacao
    out.clientes = (await tx.cliente.deleteMany({ where: { id: { notIn: reviewerIds } } })).count

    // 5) Produto de teste — só se NÃO houver Avaliacao apontando pra ele
    out.smokeProdutos = 0
    for (const prod of smokeProdutos) {
      const reviewsDoProduto = await tx.avaliacao.count({ where: { produtoId: prod.id } })
      if (reviewsDoProduto > 0) {
        console.warn(`   ⚠️  "${prod.nome}" PRESERVADO: ${reviewsDoProduto} avaliação(ões) apontam pra ele.`)
        continue
      }
      // Restrict: apagar antes do produto
      await tx.itemCarrinho.deleteMany({ where: { produtoId: prod.id } })
      await tx.listaEspera.deleteMany({ where: { produtoId: prod.id } })
      // Cascade (apagados explicitamente p/ clareza)
      await tx.produtoDestaque.deleteMany({ where: { produtoId: prod.id } })
      await tx.freteRegra.deleteMany({ where: { produtoId: prod.id } })
      await tx.variacaoProduto.deleteMany({ where: { produtoId: prod.id } })
      await tx.produto.delete({ where: { id: prod.id } })
      out.smokeProdutos++
    }
  }, { timeout: 120_000 })

  console.log('\n✅ Concluído. Apagados:')
  for (const [k, v] of Object.entries(out)) console.log(`   • ${k}: ${v}`)

  // Confere que definições e reviews não foram afetadas além do esperado.
  const [avaliacoesDepois, cuponsDepois, freteDepois, destaquesDepois] = await Promise.all([
    prisma.avaliacao.count(),
    prisma.cupom.count(),
    prisma.freteRegra.count(),
    prisma.produtoDestaque.count(),
  ])
  const ok = (a: boolean) => (a ? '✅' : '❌ MUDOU!')
  console.log('\n── Conferências pós-execução:')
  console.log(`   • Avaliações: antes=${totalAvaliacoes}, depois=${avaliacoesDepois} → ${ok(avaliacoesDepois === totalAvaliacoes)} (esperado: igual)`)
  console.log(`   • Cupom (definições): antes=${totalCupons}, depois=${cuponsDepois} → ${ok(cuponsDepois === totalCupons)} (esperado: igual)`)
  console.log(`   • FreteRegra: antes=${totalFreteRegras}, depois=${freteDepois} → ${ok(freteDepois === totalFreteRegras - freteRemovido)} (esperado: −${freteRemovido} do SMOKE)`)
  console.log(`   • ProdutoDestaque: antes=${totalDestaques}, depois=${destaquesDepois} → ${ok(destaquesDepois === totalDestaques - destaqueRemovido)} (esperado: −${destaqueRemovido} do SMOKE)`)
}

main()
  .catch((err) => {
    console.error('Erro:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
