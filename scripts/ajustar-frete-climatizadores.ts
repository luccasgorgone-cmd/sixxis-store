// Ajuste de frete — SOMENTE climatizadores (SX*, M45).
//
// Para cada FreteRegra dos climatizadores, em cada UF com preço cobrado
// (precoNormal e/ou precoExpresso > 0 e que NÃO seja freteGratis/aCombinar/
// bloqueado), reduz 15% e arredonda PARA BAIXO ao múltiplo de R$5:
//
//   novoPreco = Math.floor((precoAtual * 0.85) / 5) * 5
//   (termina 1–4 → 0; 6–9 → 5). Nunca cai a 0: se der 0, mantém R$5.
//
// Aplica a precoNormal E precoExpresso (cada um só se já for > 0). NÃO mexe em
// prazos (min/max), nem em regras freteGratis / aCombinar / bloqueado.
//
// ESCOPO: produtos da categoria 'climatizadores'. NUNCA toca em bike
// (spinning-sixxis-life) nem aspirador (asp-bravo) — frete grátis, fora do escopo.
//
// POLÍTICA:
//   - DRY-RUN por padrão: imprime a tabela (produto, UF, normal antes→depois,
//     expresso antes→depois) para conferência. Nada é alterado.
//   - --execute aplica as mudanças numa transação (tudo-ou-nada).
//
// Uso (PROD — via Railway):
//   railway run npx tsx scripts/ajustar-frete-climatizadores.ts            # DRY-RUN
//   railway run npx tsx scripts/ajustar-frete-climatizadores.ts --execute  # aplica

import { prisma } from './_db'

const EXECUTAR = process.argv.includes('--execute')

// Guarda dura: slugs que NUNCA podem ser tocados (frete grátis).
const SLUGS_PROIBIDOS = ['spinning-sixxis-life', 'asp-bravo']

// novoPreco = floor((preco * 0.85) / 5) * 5 — nunca abaixo de R$5.
function novoFrete(preco: number): number {
  const calc = Math.floor((preco * 0.85) / 5) * 5
  return calc < 5 ? 5 : calc
}

const reais = (v: number | null) => (v == null || v <= 0 ? '—' : `R$${v}`)

interface Mudanca {
  id: string
  produto: string
  uf: string
  normalAntes: number | null
  normalDepois: number | null
  expressoAntes: number | null
  expressoDepois: number | null
  data: { precoNormal?: number; precoExpresso?: number }
}

async function main() {
  console.log(`\n══════════ AJUSTE DE FRETE — CLIMATIZADORES (${EXECUTAR ? 'EXECUTAR' : 'DRY-RUN'}) ══════════`)

  const produtos = await prisma.produto.findMany({
    where: {
      categoria: 'climatizadores',
      slug: { notIn: SLUGS_PROIBIDOS },
    },
    select: {
      slug: true,
      modelo: true,
      freteRegras: {
        select: {
          id: true, uf: true, precoNormal: true, precoExpresso: true,
          freteGratis: true, aCombinar: true, bloqueado: true,
        },
        orderBy: { uf: 'asc' },
      },
    },
    orderBy: { slug: 'asc' },
  })

  // Sanidade: garante que só pegamos climatizadores SX* / M45.
  const suspeitos = produtos.filter(
    (p) => !/^(SX|M45)/i.test((p.modelo ?? '').replace(/\s/g, '')),
  )
  if (suspeitos.length > 0) {
    console.error('\n⚠ ABORTANDO: produto fora do padrão SX*/M45 selecionado:')
    suspeitos.forEach((p) => console.error(`   - ${p.slug} (modelo=${p.modelo})`))
    await prisma.$disconnect()
    process.exit(1)
  }

  const mudancas: Mudanca[] = []
  let regrasInspecionadas = 0
  let regrasPuladas = 0 // grátis/combinar/bloqueado ou sem preço cobrado

  for (const p of produtos) {
    for (const r of p.freteRegras) {
      regrasInspecionadas++

      if (r.freteGratis || r.aCombinar || r.bloqueado) {
        regrasPuladas++
        continue
      }

      const normalAntes = r.precoNormal != null ? Number(r.precoNormal) : null
      const expressoAntes = r.precoExpresso != null ? Number(r.precoExpresso) : null

      const temNormal = normalAntes != null && normalAntes > 0
      const temExpresso = expressoAntes != null && expressoAntes > 0
      if (!temNormal && !temExpresso) {
        regrasPuladas++ // UF sem preço cobrado
        continue
      }

      const normalDepois = temNormal ? novoFrete(normalAntes!) : normalAntes
      const expressoDepois = temExpresso ? novoFrete(expressoAntes!) : expressoAntes

      const data: { precoNormal?: number; precoExpresso?: number } = {}
      if (temNormal && normalDepois !== normalAntes) data.precoNormal = normalDepois!
      if (temExpresso && expressoDepois !== expressoAntes) data.precoExpresso = expressoDepois!

      if (Object.keys(data).length === 0) continue // já no piso, nada muda

      mudancas.push({
        id: r.id,
        produto: p.slug,
        uf: r.uf,
        normalAntes, normalDepois,
        expressoAntes, expressoDepois,
        data,
      })
    }
  }

  // ── Tabela de conferência ──────────────────────────────────────────────────
  console.log(
    `\nProdutos no escopo: ${produtos.length}  |  regras inspecionadas: ${regrasInspecionadas}` +
    `  |  puladas (grátis/combinar/bloqueado/sem preço): ${regrasPuladas}\n`,
  )
  console.log('PRODUTO'.padEnd(22) + 'UF'.padEnd(5) + 'NORMAL'.padEnd(22) + 'EXPRESSO')
  console.log('─'.repeat(70))
  let produtoAtual = ''
  for (const m of mudancas) {
    if (m.produto !== produtoAtual) {
      if (produtoAtual) console.log('')
      produtoAtual = m.produto
    }
    const normalCol = `${reais(m.normalAntes)} → ${reais(m.normalDepois)}`
    const expressoCol = `${reais(m.expressoAntes)} → ${reais(m.expressoDepois)}`
    console.log(m.produto.padEnd(22) + m.uf.padEnd(5) + normalCol.padEnd(22) + expressoCol)
  }

  console.log('\n' + '─'.repeat(70))
  console.log(`Regras que SERÃO alteradas: ${mudancas.length}`)

  if (!EXECUTAR) {
    console.log('\nDRY-RUN: nada foi alterado. Revise a tabela e rode com --execute para aplicar.\n')
    await prisma.$disconnect()
    return
  }

  if (mudancas.length === 0) {
    console.log('\nNada a aplicar.\n')
    await prisma.$disconnect()
    return
  }

  // ── Aplicação atômica via UPDATE em lote ───────────────────────────────────
  // 243 updates individuais pelo proxy remoto estouram o timeout da transação
  // interativa. A MESMA fórmula roda em dois UPDATEs (normal/expresso) numa ida
  // só cada — GREATEST(5, ...) garante o piso de R$5 (nunca cai a 0). Escopo
  // idêntico ao do plano: só climatizadores, só preço cobrado, nunca grátis/
  // combinar/bloqueado, nunca bike/aspirador.
  const slugList = SLUGS_PROIBIDOS.map((s) => `'${s.replace(/'/g, "''")}'`).join(',')
  // Sintaxe multi-tabela do MySQL/MariaDB: UPDATE ... JOIN ... SET ... WHERE ...
  const join = 'UPDATE `FreteRegra` fr JOIN `Produto` p ON p.`id`=fr.`produtoId` '
  const where =
    "WHERE p.`categoria`='climatizadores' " +
    `AND p.\`slug\` NOT IN (${slugList}) ` +
    'AND fr.`freteGratis`=0 AND fr.`aCombinar`=0 AND fr.`bloqueado`=0'
  const sqlNormal =
    join +
    'SET fr.`precoNormal`=GREATEST(5, FLOOR(fr.`precoNormal`*0.85/5)*5) ' +
    where + ' AND fr.`precoNormal` IS NOT NULL AND fr.`precoNormal`>0'
  const sqlExpresso =
    join +
    'SET fr.`precoExpresso`=GREATEST(5, FLOOR(fr.`precoExpresso`*0.85/5)*5) ' +
    where + ' AND fr.`precoExpresso` IS NOT NULL AND fr.`precoExpresso`>0'

  const [nNormal, nExpresso] = await prisma.$transaction([
    prisma.$executeRawUnsafe(sqlNormal),
    prisma.$executeRawUnsafe(sqlExpresso),
  ])

  console.log(`\n✅ APLICADO (atômico). Linhas: precoNormal=${nNormal}, precoExpresso=${nExpresso}`)
  console.log(`   Regras alteradas (esperado pelo plano): ${mudancas.length}\n`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
