// Purga PONTUAL e ESCOPADA dos pedidos de TESTE do cliente "Marcello de Santi".
//
// Contexto: o cliente "Marcello de Santi" tem 3 pedidos de teste (todos
// PENDENTES: ~R$450, ~R$2.564,10, ~R$2.849) que sujam as métricas. Este script
// lista APENAS os pedidos desse cliente para conferência e, com --execute, os
// apaga numa transação FK-safe, revertendo eventual cashback.
//
// O pedido da "Tatiana Lima" (final rwfimutg, R$2.805) e TODO o resto do banco
// são PRESERVADOS — o filtro por nome do cliente garante isso, e há guard-rails
// que ABORTAM se algo fora do escopo aparecer na lista.
//
// POLÍTICA:
//   - Dry-run por padrão (lista tudo, não altera nada). --execute aplica.
//   - NÃO deleta o Cliente. NÃO toca em Produto, Avaliacao, FreteRegra, Configs,
//     BloqueioFraude, nem em pedidos de outros clientes.
//   - Para cada Pedido do alvo: reverte Cashback ligado (saldo + pendente), apaga
//     CashbackTransacao ligada, ItemPedido, Pagamento, GarantiaEstendida e o Pedido.
//
// GUARD-RAILS (abortam ANTES de qualquer escrita):
//   - Aborta se aparecer mais que MAX_PEDIDOS_ESPERADO (3) — use --force só se
//     conferiu a lista e confia nela.
//   - Aborta se QUALQUER pedido do conjunto não for do cliente-alvo, ou se um
//     id/cliente da blocklist (Tatiana / final rwfimutg) aparecer.
//   - Reversão de cashback nunca deixa saldo/pendente negativos (clamp em 0).
//
// Uso:
//   npx tsx scripts/purgar-pedidos-teste.ts             # dry-run (conferência)
//   npx tsx scripts/purgar-pedidos-teste.ts --execute   # APAGA (irreversível)

import { prisma } from './_db'

const EXECUTAR = process.argv.includes('--execute')
const FORCE = process.argv.includes('--force')

// Cliente-alvo da purga. Filtro por nome (case-insensitive no MySQL por padrão).
const CLIENTE_ALVO = 'Marcello de Santi'

// Sanity: o alvo tem 3 pedidos de teste. Se aparecer mais, aborta (a menos que --force).
const MAX_PEDIDOS_ESPERADO = 3

// Blocklist EXPLÍCITA — registros que NUNCA podem ser tocados. Se aparecerem na
// lista, o script aborta imediatamente (proteção redundante ao filtro por nome).
const NOMES_PROIBIDOS = ['tatiana', 'lucélia', 'lucelia'] // Tatiana Lima e Lucélia Frota preservadas
const ID_SUFIXOS_PROIBIDOS = ['rwfimutg', 'iqileajl']     // ids finais da Tatiana e da Lucélia

const BRL = (v: number | string) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

async function main() {
  const dbMasked = (process.env.DATABASE_URL || '')
    .replace(/\/\/[^@]*@/, '//***:***@')
    .split('?')[0]
  console.log(`\nBanco: ${dbMasked}`)
  console.log(`Cliente-alvo: "${CLIENTE_ALVO}"`)
  console.log(
    EXECUTAR
      ? '⚠️  MODO --execute: os registros abaixo SERÃO APAGADOS (irreversível).'
      : '🔎 DRY-RUN (padrão): apenas conferência. Nada será apagado. Use --execute para apagar.',
  )

  // ── Contagens ANTES (globais) ──────────────────────────────────────────────
  const [pedidosAntes, pagamentosAntes, cashbackAntes, itensAntes, garantiasAntes] =
    await Promise.all([
      prisma.pedido.count(),
      prisma.pagamento.count(),
      prisma.cashbackTransacao.count(),
      prisma.itemPedido.count(),
      prisma.garantiaEstendida.count(),
    ])

  // ── 1) Listar SOMENTE os pedidos do cliente-alvo ───────────────────────────
  const pedidos = await prisma.pedido.findMany({
    where: { cliente: { is: { nome: { contains: CLIENTE_ALVO } } } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      status: true,
      total: true,
      formaPagamento: true,
      cashbackUsado: true,
      createdAt: true,
      cliente: { select: { id: true, nome: true, email: true } },
      _count: { select: { itens: true, pagamentos: true, garantias: true } },
    },
  })

  console.log(`\n══════════ PEDIDOS DE "${CLIENTE_ALVO}" (${pedidos.length}) — CONFERÊNCIA ══════════`)
  for (const p of pedidos) {
    console.log(
      `• ${p.id}\n    cliente: ${p.cliente.nome} <${p.cliente.email}>\n` +
        `    status=${p.status}  total=${BRL(Number(p.total))}  forma=${p.formaPagamento}  cashbackUsado=${BRL(Number(p.cashbackUsado))}\n` +
        `    itens=${p._count.itens}  pagamentos=${p._count.pagamentos}  garantias=${p._count.garantias}  criadoEm=${p.createdAt.toISOString()}`,
    )
  }

  if (pedidos.length === 0) {
    console.log(`\nNenhum pedido de "${CLIENTE_ALVO}" no banco. Nada a fazer.`)
    return
  }

  // ── GUARD-RAILS DE SEGURANÇA (abortam antes de qualquer escrita) ────────────
  // (a) Nenhum pedido fora do cliente-alvo pode estar na lista.
  const foraDoAlvo = pedidos.filter(
    (p) => !(p.cliente.nome || '').toLowerCase().includes(CLIENTE_ALVO.toLowerCase()),
  )
  if (foraDoAlvo.length > 0) {
    console.log(`\n⛔ ABORTADO: ${foraDoAlvo.length} pedido(s) NÃO são de "${CLIENTE_ALVO}":`)
    for (const p of foraDoAlvo) console.log(`   • ${p.id} — ${p.cliente.nome}`)
    process.exit(1)
  }
  // (b) Blocklist explícita — Tatiana/Lucélia (nomes ou ids rwfimutg/iqileajl) JAMAIS aparecem.
  const blocklist = pedidos.filter(
    (p) =>
      NOMES_PROIBIDOS.some((n) => (p.cliente.nome || '').toLowerCase().includes(n)) ||
      ID_SUFIXOS_PROIBIDOS.some((suf) => p.id.toLowerCase().endsWith(suf)),
  )
  if (blocklist.length > 0) {
    console.log('\n⛔ ABORTADO: registro PROTEGIDO apareceu na lista (Tatiana/Lucélia):')
    for (const p of blocklist) console.log(`   • ${p.id} — ${p.cliente.nome}`)
    process.exit(1)
  }

  const pedidoIds = pedidos.map((p) => p.id)
  const clienteIds = [...new Set(pedidos.map((p) => p.cliente.id))]

  // ── 2) Cashback ligado a esses pedidos + reversão de saldo ──────────────────
  const cashbacks = await prisma.cashbackTransacao.findMany({
    where: { pedidoId: { in: pedidoIds } },
    select: { id: true, clienteId: true, tipo: true, status: true, valor: true, pedidoId: true },
  })

  // Deltas de reversão por cliente (espelha src/lib/cashback.ts).
  const reversao: Record<string, { saldo: number; pendente: number }> = {}
  const add = (cid: string, k: 'saldo' | 'pendente', v: number) => {
    reversao[cid] ??= { saldo: 0, pendente: 0 }
    reversao[cid][k] += v
  }
  for (const t of cashbacks) {
    const v = Number(t.valor)
    if (t.tipo === 'credito') {
      if (t.status === 'disponivel') add(t.clienteId, 'saldo', -v)
      else if (t.status === 'pendente') add(t.clienteId, 'pendente', -v)
      // cancelado: já estornado, sem efeito
    } else if (t.tipo === 'debito') {
      if (t.status !== 'cancelado') add(t.clienteId, 'saldo', +v) // devolve o gasto
    }
  }

  console.log(`\n── Cashback ligado aos pedidos: ${cashbacks.length} transação(ões)`)
  for (const t of cashbacks) {
    console.log(`   • ${t.tipo}/${t.status}  ${BRL(t.valor)}  (pedido ${t.pedidoId})`)
  }

  // Estado atual dos clientes envolvidos (para mostrar reversão e checar clamp).
  const clientes = await prisma.cliente.findMany({
    where: { id: { in: clienteIds } },
    select: { id: true, nome: true, cashbackSaldo: true, cashbackPendente: true, totalGasto: true, totalPedidos: true },
  })

  console.log('\n── Reversão de saldo de cashback (por cliente):')
  let clampAviso = false
  const planoReversao: { id: string; saldo: number; pendente: number }[] = []
  for (const c of clientes) {
    const d = reversao[c.id] ?? { saldo: 0, pendente: 0 }
    const novoSaldoRaw = Number(c.cashbackSaldo) + d.saldo
    const novoPendRaw = Number(c.cashbackPendente) + d.pendente
    const novoSaldo = Math.max(0, novoSaldoRaw)
    const novoPend = Math.max(0, novoPendRaw)
    if (novoSaldoRaw < 0 || novoPendRaw < 0) clampAviso = true
    planoReversao.push({ id: c.id, saldo: novoSaldo, pendente: novoPend })
    console.log(
      `   • ${c.nome}\n` +
        `       saldo:    ${BRL(c.cashbackSaldo)}  ${d.saldo >= 0 ? '+' : ''}${BRL(d.saldo)} → ${BRL(novoSaldo)}${novoSaldoRaw < 0 ? '  ⚠️ clamp (era ' + BRL(novoSaldoRaw) + ')' : ''}\n` +
        `       pendente: ${BRL(c.cashbackPendente)}  ${d.pendente >= 0 ? '+' : ''}${BRL(d.pendente)} → ${BRL(novoPend)}${novoPendRaw < 0 ? '  ⚠️ clamp (era ' + BRL(novoPendRaw) + ')' : ''}\n` +
        `       (info, NÃO alterado: totalGasto=${BRL(c.totalGasto)}, totalPedidos=${c.totalPedidos})`,
    )
  }
  if (clampAviso) {
    console.log('   ⚠️  Algum saldo ficaria negativo e foi limitado a 0 (indica inconsistência prévia — confira).')
  }

  // ── Referências soltas (sem FK) que ficariam órfãs — só aviso, NÃO apaga ─────
  const [cupomUsoLigado, historicoLigado] = await Promise.all([
    prisma.cupomUso.count({ where: { pedidoId: { in: pedidoIds } } }),
    prisma.historicoPontos.count({ where: { pedidoId: { in: pedidoIds } } }),
  ])
  if (cupomUsoLigado || historicoLigado) {
    console.log('\n── Referências soltas a esses pedidos (NÃO serão tocadas — fora do escopo):')
    console.log(`   • CupomUso.pedidoId: ${cupomUsoLigado}`)
    console.log(`   • HistoricoPontos.pedidoId: ${historicoLigado}`)
  }

  // ── Guard-rail de sanidade ──────────────────────────────────────────────────
  if (pedidos.length > MAX_PEDIDOS_ESPERADO && !FORCE) {
    console.log(
      `\n⛔ ABORTADO: ${pedidos.length} pedidos > esperado (${MAX_PEDIDOS_ESPERADO}). ` +
        'Confira a lista acima. Se estiver tudo certo, rode com --force.',
    )
    process.exit(1)
  }
  const clientesNomes = [...new Set(pedidos.map((p) => p.cliente.nome))]
  console.log(`\n── Clientes dos pedidos (deve ser só "${CLIENTE_ALVO}"): ${clientesNomes.join(', ')}`)

  console.log('\n── Contagens ANTES (globais):')
  console.log(`   Pedido=${pedidosAntes}  Pagamento=${pagamentosAntes}  Cashback=${cashbackAntes}  ItemPedido=${itensAntes}  Garantia=${garantiasAntes}`)

  if (!EXECUTAR) {
    console.log('\n[dry-run] nada foi apagado.')
    console.log('Ordem de exclusão (FK-safe) no --execute:')
    console.log('  1. Reverter saldo de cashback do(s) cliente(s)')
    console.log('  2. CashbackTransacao ligada aos pedidos')
    console.log('  3. GarantiaEstendida, ItemPedido, Pagamento dos pedidos')
    console.log('  4. Pedido')
    console.log('\nPara apagar: npx tsx scripts/purgar-pedidos-teste.ts --execute')
    return
  }

  // ── EXECUÇÃO ────────────────────────────────────────────────────────────────
  console.log('\n🧹 Apagando (transação única, FK-safe)...')
  const out: Record<string, number> = {}

  await prisma.$transaction(async (tx) => {
    // 1) Reverter saldo de cashback do(s) cliente(s) — SET absoluto (já clampado)
    for (const r of planoReversao) {
      await tx.cliente.update({
        where: { id: r.id },
        data: { cashbackSaldo: r.saldo, cashbackPendente: r.pendente },
      })
    }

    // 2) CashbackTransacao ligada aos pedidos
    out.cashback = (await tx.cashbackTransacao.deleteMany({ where: { pedidoId: { in: pedidoIds } } })).count

    // 3) Dependências de FK dos pedidos (explícito p/ clareza; também cascateariam)
    out.garantias = (await tx.garantiaEstendida.deleteMany({ where: { pedidoId: { in: pedidoIds } } })).count
    out.itens = (await tx.itemPedido.deleteMany({ where: { pedidoId: { in: pedidoIds } } })).count
    out.pagamentos = (await tx.pagamento.deleteMany({ where: { pedidoId: { in: pedidoIds } } })).count

    // 4) Os pedidos do alvo
    out.pedidos = (await tx.pedido.deleteMany({ where: { id: { in: pedidoIds } } })).count
  }, { timeout: 120_000 })

  console.log('\n✅ Concluído. Apagados / alterados:')
  for (const [k, v] of Object.entries(out)) console.log(`   • ${k}: ${v}`)

  // ── Contagens DEPOIS + saldo final ──────────────────────────────────────────
  const [pedidosDepois, pagamentosDepois, cashbackDepois] = await Promise.all([
    prisma.pedido.count(),
    prisma.pagamento.count(),
    prisma.cashbackTransacao.count(),
  ])
  const clientesDepois = await prisma.cliente.findMany({
    where: { id: { in: clienteIds } },
    select: { nome: true, cashbackSaldo: true, cashbackPendente: true },
  })

  console.log('\n── Contagens ANTES → DEPOIS:')
  console.log(`   • Pedido:    ${pedidosAntes} → ${pedidosDepois}`)
  console.log(`   • Pagamento: ${pagamentosAntes} → ${pagamentosDepois}`)
  console.log(`   • Cashback:  ${cashbackAntes} → ${cashbackDepois}`)
  console.log('\n── Saldo de cashback final (clientes envolvidos):')
  for (const c of clientesDepois) {
    console.log(`   • ${c.nome}: saldo=${BRL(c.cashbackSaldo)}  pendente=${BRL(c.cashbackPendente)}`)
  }
}

main()
  .catch((err) => {
    console.error('Erro:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
