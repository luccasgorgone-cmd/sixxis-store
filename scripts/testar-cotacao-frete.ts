// scripts/testar-cotacao-frete.ts
//
// Mostra qual carrier VENCE e qual custo seria gravado em Pedido.custoFreteReal,
// para um produto + CEP, sem precisar de uma venda real. Útil sobretudo no caso
// de FRETE GRÁTIS, em que o cliente vê "Frete Grátis" e o custo real fica só no
// campo interno.
//
// Chama o resolverFrete de produção — não reimplementa nada. O que aparecer aqui
// é exatamente o que o checkout gravaria.
//
// Uso:
//   npx tsx scripts/testar-cotacao-frete.ts <slug-ou-id-do-produto> <cep> [qtd]
//
// Exemplo:
//   npx tsx scripts/testar-cotacao-frete.ts aspirador-sx100 16015000

import { prisma } from '../src/lib/prisma'
import { resolverFrete, cepParaUF } from '../src/lib/frete-resolver'
import { braspressEnabled, melhorenvioEnabled } from '../src/lib/carriers'

const fmt = (v: number | null | undefined) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

async function main() {
  const [alvo, cepRaw, qtdRaw] = process.argv.slice(2)
  if (!alvo || !cepRaw) {
    console.error('Uso: npx tsx scripts/testar-cotacao-frete.ts <slug-ou-id> <cep> [qtd]')
    process.exit(1)
  }

  const cep = cepRaw.replace(/\D/g, '')
  if (cep.length !== 8) {
    console.error(`CEP inválido: "${cepRaw}" (esperado 8 dígitos)`)
    process.exit(1)
  }
  const quantidade = Math.max(1, Number(qtdRaw ?? '1') || 1)

  const produto = await prisma.produto.findFirst({
    where:  { OR: [{ slug: alvo }, { id: alvo }] },
    select: { id: true, nome: true, slug: true },
  })
  if (!produto) {
    console.error(`Produto não encontrado: "${alvo}"`)
    process.exit(1)
  }

  const uf = await cepParaUF(cep)
  if (!uf) {
    console.error(`Não consegui resolver a UF do CEP ${cep}`)
    process.exit(1)
  }

  console.log('\n── Carriers habilitados ─────────────────────────────')
  console.log(`  Braspress    : ${braspressEnabled() ? 'ON' : 'OFF'}`)
  console.log(`  Melhor Envio : ${melhorenvioEnabled() ? 'ON' : 'OFF'}`)
  if (!braspressEnabled() && !melhorenvioEnabled()) {
    console.log('  (nenhum ativo — a cadeia usa só a tabela manual FreteRegra)')
  }

  console.log('\n── Entrada ──────────────────────────────────────────')
  console.log(`  Produto : ${produto.nome} (${produto.slug})`)
  console.log(`  Destino : ${cep} → ${uf}`)
  console.log(`  Qtd     : ${quantidade}`)

  const r = await resolverFrete(
    [{ produtoId: produto.id, quantidade }],
    uf,
    { cepDestino: cep },
  )

  console.log('\n── Resultado do resolverFrete ───────────────────────')
  console.log(`  status        : ${r.status}`)
  console.log(`  freteGratis   : ${r.freteGratis}`)
  if (r.mensagem) console.log(`  mensagem      : ${r.mensagem}`)

  console.log('\n  O que o CLIENTE vê:')
  if (r.opcoes.length === 0) {
    console.log('    (nenhuma opção)')
  } else {
    for (const o of r.opcoes) {
      console.log(`    ${o.nome} — ${o.preco === 0 ? 'Frete Grátis' : fmt(o.preco)} · ${o.prazo}`)
    }
  }

  console.log('\n  O que fica INTERNO (gravado no Pedido):')
  console.log(`    transportadora : ${r.transportadora ?? '— (sem cotação de carrier)'}`)
  console.log(`    custoFreteReal : ${fmt(r.custoFreteReal)}`)

  if (r.freteGratis) {
    console.log(
      r.custoFreteReal != null
        ? '\n  ✔ Frete grátis com custo real capturado da transportadora mais barata.'
        : '\n  ⚠ Frete grátis SEM custo real: nenhum carrier respondeu. A margem deste\n    pedido ficaria com "frete não lançado" no relatório.',
    )
  }
  console.log('')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
