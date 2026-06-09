// Lista (e, com --execute, apaga) dados de TESTE acumulados no banco:
//   - produto(s) de smoke-test (ex.: "TESTE SMOKE")
//   - clientes de teste (por padrão de e-mail)
//   - pedidos de teste (de clientes de teste OU que contêm produto de teste)
//   - registros ligados: CupomUso, CashbackTransacao, HistoricoPontos, PontosCliente,
//     Avaliacao, e — via cascata do Pedido — ItemPedido, Pagamento, GarantiaEstendida
//
// SEGURANÇA:
//   - DRY-RUN é o PADRÃO: sem flag, o script só LISTA. Nada é apagado.
//   - Só apaga com a flag explícita --execute.
//   - REVISE a saída do dry-run antes de rodar --execute: os clientes são
//     identificados por PADRÃO DE E-MAIL (editável abaixo) e podem ter falso
//     positivo. Faça backup do banco antes do --execute.
//
// Uso:
//   npx tsx scripts/limpar-dados-teste.ts              # dry-run (lista)
//   npx tsx scripts/limpar-dados-teste.ts --execute    # APAGA (irreversível)
//
// O .env.local é lido automaticamente por ./_db.

import { prisma } from './_db'

const EXECUTAR = process.argv.includes('--execute')

// ── Padrões de identificação — EDITE conforme seus dados de teste ────────────
// Produto: nome que CONTÉM qualquer um destes (case-insensitive no MySQL).
const PRODUTO_PATTERNS = ['TESTE SMOKE', 'SMOKE']
// Cliente: e-mail que CONTÉM qualquer um destes. Mantenha conservador.
const EMAIL_PATTERNS = [
  'smoke',
  'teste@',
  '+teste',
  '+test',
  '@example.com',
  '@mailinator.com',
  'qa@sixxis',
]

// ── Helpers ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function orContains(campo: string, patterns: string[]): any {
  return { OR: patterns.map((p) => ({ [campo]: { contains: p } })) }
}

// Filtro OR por pedidoId/clienteId, ignorando listas vazias. Se ambas vazias,
// retorna um filtro que NUNCA casa (evita deletar tudo por engano).
function orPedidoCliente(pedidoIds: string[], clienteIds: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ors: any[] = []
  if (pedidoIds.length) ors.push({ pedidoId: { in: pedidoIds } })
  if (clienteIds.length) ors.push({ clienteId: { in: clienteIds } })
  return ors.length ? { OR: ors } : { id: { in: [] as string[] } }
}

const brl = (v: number | string) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

async function main() {
  // Mostra em qual banco estamos mexendo (com credenciais mascaradas).
  const dbMasked = (process.env.DATABASE_URL || '')
    .replace(/\/\/[^@]*@/, '//***:***@')
    .split('?')[0]
  console.log(`\nBanco: ${dbMasked}`)
  console.log(
    EXECUTAR
      ? '⚠️  MODO --execute: registros abaixo SERÃO APAGADOS (irreversível).'
      : '🔎 DRY-RUN (padrão): apenas listando. Nada será apagado. Use --execute para apagar.',
  )

  // ── 1) Produtos de teste ───────────────────────────────────────────────────
  const produtos = await prisma.produto.findMany({
    where: orContains('nome', PRODUTO_PATTERNS),
    select: { id: true, nome: true, slug: true },
  })
  const produtoIds = produtos.map((p) => p.id)

  console.log(`\n── Produtos de teste: ${produtos.length}`)
  for (const p of produtos) console.log(`   • ${p.nome}  [${p.slug}]  ${p.id}`)

  // ── 2) Clientes de teste (por e-mail) ──────────────────────────────────────
  const clientes = await prisma.cliente.findMany({
    where: orContains('email', EMAIL_PATTERNS),
    select: {
      id: true, nome: true, email: true, totalPedidos: true,
      cashbackSaldo: true, cashbackPendente: true, createdAt: true,
    },
  })
  const clienteIds = clientes.map((c) => c.id)

  console.log(`\n── Clientes de teste (por padrão de e-mail): ${clientes.length}`)
  for (const c of clientes)
    console.log(
      `   • ${c.email}  (${c.nome})  pedidos=${c.totalPedidos}  ` +
      `cashback=${brl(c.cashbackSaldo)}/${brl(c.cashbackPendente)}pend  ${c.id}`,
    )

  // ── 3) Pedidos de teste = de clientes de teste ∪ que contêm produto de teste ─
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pedidoOr: any[] = []
  if (clienteIds.length) pedidoOr.push({ clienteId: { in: clienteIds } })
  if (produtoIds.length) pedidoOr.push({ itens: { some: { produtoId: { in: produtoIds } } } })

  const pedidos = pedidoOr.length
    ? await prisma.pedido.findMany({
        where: { OR: pedidoOr },
        select: {
          id: true, status: true, total: true, createdAt: true, clienteId: true,
          cliente: { select: { email: true } },
          _count: { select: { itens: true, pagamentos: true, garantias: true } },
        },
      })
    : []
  const pedidoIds = pedidos.map((p) => p.id)

  // Quais pedidos vêm de cliente NÃO-teste (só por conter o produto de teste)?
  // Útil pra revisão: pode ser um smoke-test feito numa conta real.
  const pedidosClienteNaoTeste = pedidos.filter((p) => !clienteIds.includes(p.clienteId))

  console.log(`\n── Pedidos de teste: ${pedidos.length}`)
  for (const p of pedidos)
    console.log(
      `   • #${p.id.slice(-8).toUpperCase()}  ${p.status}  ${brl(Number(p.total))}  ` +
      `(${p.cliente?.email ?? '—'})  itens=${p._count.itens} pag=${p._count.pagamentos} gar=${p._count.garantias}`,
    )
  if (pedidosClienteNaoTeste.length)
    console.log(
      `   ⚠️  ${pedidosClienteNaoTeste.length} pedido(s) pertencem a clientes NÃO classificados como teste ` +
      `(entraram por conter produto de teste). Revise antes de --execute.`,
    )

  // ── 4) Registros ligados (sem FK em cascata) ───────────────────────────────
  const ligadoFiltro = orPedidoCliente(pedidoIds, clienteIds)
  const temLigados = pedidoIds.length > 0 || clienteIds.length > 0

  const [cupomUsos, cashbacks, historicos, pontos, avaliacoes] = temLigados
    ? await Promise.all([
        prisma.cupomUso.count({ where: ligadoFiltro }),
        prisma.cashbackTransacao.count({ where: ligadoFiltro }),
        prisma.historicoPontos.count({ where: ligadoFiltro }),
        clienteIds.length
          ? prisma.pontosCliente.count({ where: { clienteId: { in: clienteIds } } })
          : Promise.resolve(0),
        clienteIds.length
          ? prisma.avaliacao.count({ where: { clienteId: { in: clienteIds } } })
          : Promise.resolve(0),
      ])
    : [0, 0, 0, 0, 0]

  console.log('\n── Registros ligados:')
  console.log(`   • CupomUso ............ ${cupomUsos}`)
  console.log(`   • CashbackTransacao ... ${cashbacks}`)
  console.log(`   • HistoricoPontos ..... ${historicos}`)
  console.log(`   • PontosCliente ....... ${pontos}`)
  console.log(`   • Avaliacao ........... ${avaliacoes}`)
  console.log('   • ItemPedido / Pagamento / GarantiaEstendida → via cascata do Pedido')

  const totalAlvos =
    produtos.length + clientes.length + pedidos.length +
    cupomUsos + cashbacks + historicos + pontos + avaliacoes

  if (!EXECUTAR) {
    console.log(`\n[dry-run] ${totalAlvos} registro(s) candidatos. Nada foi apagado.`)
    console.log('Plano de exclusão (ordem FK-safe) ao rodar com --execute:')
    console.log('  1. CupomUso, CashbackTransacao, HistoricoPontos (por pedido/cliente)')
    console.log('  2. Pedido  → cascata: ItemPedido, Pagamento, GarantiaEstendida')
    console.log('  3. Produto de teste  (só se não sobrar referência de pedido real)')
    console.log('  4. PontosCliente + Avaliacao dos clientes  (bloqueiam o delete)')
    console.log('  5. Cliente  → cascata: Endereco, Carrinho, CashbackTransacao, BloqueioFraude')
    console.log('\nPara apagar: npx tsx scripts/limpar-dados-teste.ts --execute')
    return
  }

  if (totalAlvos === 0) {
    console.log('\n✅ Nada a apagar.')
    return
  }

  // ── EXECUÇÃO (--execute) — ordem FK-safe, dentro de uma transação ──────────
  console.log('\n🧹 Apagando...')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: Record<string, number> = {}

  await prisma.$transaction(async (tx) => {
    // 1) ligados ao pedido/cliente que não têm cascata automática
    if (temLigados) {
      out.cupomUso = (await tx.cupomUso.deleteMany({ where: ligadoFiltro })).count
      out.cashback = (await tx.cashbackTransacao.deleteMany({ where: ligadoFiltro })).count
      out.historicoPontos = (await tx.historicoPontos.deleteMany({ where: ligadoFiltro })).count
    }

    // 2) pedidos → cascata em ItemPedido, Pagamento, GarantiaEstendida
    if (pedidoIds.length) {
      out.pedido = (await tx.pedido.deleteMany({ where: { id: { in: pedidoIds } } })).count
    }

    // 3) produtos de teste — só se não houver mais referências (de pedidos reais)
    out.produto = 0
    for (const prod of produtos) {
      const [refItens, refGarantias] = await Promise.all([
        tx.itemPedido.count({ where: { produtoId: prod.id } }),
        tx.garantiaEstendida.count({ where: { produtoId: prod.id } }),
      ])
      if (refItens === 0 && refGarantias === 0) {
        await tx.produto.delete({ where: { id: prod.id } })
        out.produto++
      } else {
        console.warn(
          `   ⚠️  Produto "${prod.nome}" MANTIDO: ainda referenciado ` +
          `(itens=${refItens}, garantias=${refGarantias}) por pedido não-teste.`,
        )
      }
    }

    // 4+5) clientes — remove bloqueadores Restrict, depois o cliente (cascata)
    if (clienteIds.length) {
      out.pontosCliente = (await tx.pontosCliente.deleteMany({ where: { clienteId: { in: clienteIds } } })).count
      out.avaliacao = (await tx.avaliacao.deleteMany({ where: { clienteId: { in: clienteIds } } })).count
      out.cliente = (await tx.cliente.deleteMany({ where: { id: { in: clienteIds } } })).count
    }
  })

  console.log('\n✅ Concluído. Apagados:')
  for (const [k, v] of Object.entries(out)) console.log(`   • ${k}: ${v}`)
}

main()
  .catch((err) => {
    console.error('Erro:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
