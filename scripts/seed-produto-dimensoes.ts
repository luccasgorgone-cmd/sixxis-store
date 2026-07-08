// Seed de peso e dimensões dos produtos (pré-requisito da cotação de frete).
//
// A tabela de medidas e a lógica de casamento vivem em src/lib/produto-dimensoes.ts
// (fonte única — o botão do admin usa exatamente o mesmo código). Este script é
// só o wrapper de CLI.
//
// POLÍTICA:
//   - DRY-RUN por padrão: imprime o de-para e a lista de quem NÃO casou.
//   - --execute aplica (idempotente).
//
// Uso (PROD — via Railway):
//   railway run npx tsx scripts/seed-produto-dimensoes.ts            # DRY-RUN
//   railway run npx tsx scripts/seed-produto-dimensoes.ts --execute  # aplica

import { prisma } from './_db'
import {
  MEDIDAS_PRODUTO,
  resolverDeParaDimensoes,
  aplicarDimensoes,
} from '../src/lib/produto-dimensoes'

const EXECUTAR = process.argv.includes('--execute')

async function main() {
  console.log(`\n══════════ SEED DIMENSÕES/PESO (${EXECUTAR ? 'EXECUTAR' : 'DRY-RUN'}) ══════════\n`)

  if (EXECUTAR) {
    const r = await aplicarDimensoes(prisma)
    for (const l of r.linhas.filter((x) => x.casou)) {
      console.log(
        `✓ ${l.label.padEnd(12)} → ${l.produtoNome} (${l.via}) · ` +
        `${l.medida.pesoKg}kg A${l.medida.alturaCm} L${l.medida.larguraCm} C${l.medida.comprimentoCm} vol${l.medida.volumes}`,
      )
    }
    for (const l of r.linhas.filter((x) => !x.casou)) {
      console.log(`✗ ${l.label} — nenhum produto casou com [${l.ids.join(', ')}]`)
    }
    console.log(`\nAPLICADO: ${r.atualizados}/${MEDIDAS_PRODUTO.length} atualizados (${r.jaEstavam} já estavam) · ${r.naoCasaram} não casaram.\n`)
    return
  }

  const dePara = await resolverDeParaDimensoes(prisma)
  console.log('── Casados ─────────────────────────────────────────')
  for (const l of dePara.casados) {
    console.log(
      `✓ ${l.label.padEnd(12)} → ${l.produtoNome} (${l.via}) · ` +
      `${l.medida.pesoKg}kg A${l.medida.alturaCm} L${l.medida.larguraCm} C${l.medida.comprimentoCm} vol${l.medida.volumes}`,
    )
  }
  console.log(`\n── Não casaram (${dePara.naoCasados.length}) ──────────────────────────`)
  for (const l of dePara.naoCasados) {
    console.log(`✗ ${l.label} — nenhum produto casou com [${l.ids.join(', ')}]`)
  }
  console.log(`\nDRY-RUN — nada alterado: ${dePara.casados.length}/${MEDIDAS_PRODUTO.length} produtos casados.\n`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
