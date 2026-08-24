// Correção de dado (pedido do Luccas, 2026-08-24): a ficha técnica e a
// descrição de todos os climatizadores tinham a direção da oscilação
// invertida. Confirmação do Luccas:
//   - Oscilação HORIZONTAL (automática): aletas internas (verticais) jogam o
//     ar pra direita/esquerda.
//   - Oscilação VERTICAL (manual): aletas externas (horizontais) jogam o ar
//     pra cima/baixo.
// O dado publicado (specs e texto da descrição) tinha isso trocado —
// "Oscilação Vertical: Automática" / "Oscilação Horizontal: Manual" — em
// todos os climatizadores com esse campo, e o SX180 Trend nem tinha os
// campos. Corrige os 8 já publicados e adiciona os campos no SX180.
//
// Uso:
//   npx tsx scripts/fix-oscilacao-climatizadores.ts --dry
//   npx tsx scripts/fix-oscilacao-climatizadores.ts

import type { Prisma } from '@prisma/client'
import { prisma } from './_db'

const DRY = process.argv.includes('--dry')

const SLUGS_COM_CAMPO_TROCADO = [
  'sx040', 'm45-trend', 'sx060-prime', 'sx070-trend',
  'sx100-trend', 'sx120-prime', 'sx200-prime', 'sx200-trend',
]

interface EspecRow { label: string; valor: string }

async function main() {
  console.log('--- Corrigindo especificações + descrição (direção da oscilação) ---')
  for (const slug of SLUGS_COM_CAMPO_TROCADO) {
    const p = await prisma.produto.findUnique({ where: { slug }, select: { id: true, especificacoes: true, descricao: true } })
    if (!p) { console.log(`  [!] ${slug} não encontrado`); continue }

    const specs = (Array.isArray(p.especificacoes) ? p.especificacoes : []) as unknown as EspecRow[]
    const novasSpecs = specs.map((s) => {
      if (s.label === 'Oscilação Vertical') return { ...s, valor: 'Manual' }
      if (s.label === 'Oscilação Horizontal') return { ...s, valor: 'Automática' }
      return s
    })

    const descricaoAtual = p.descricao ?? ''
    const novaDescricao = descricaoAtual.replace(/oscilação vertical automática/gi, 'oscilação horizontal automática')

    const mudouSpecs = JSON.stringify(specs) !== JSON.stringify(novasSpecs)
    const mudouDescricao = descricaoAtual !== novaDescricao
    console.log(`  [${slug}] specs ${mudouSpecs ? 'corrigidas' : 'sem campo pra corrigir'}, descrição ${mudouDescricao ? 'corrigida' : 'sem menção pra corrigir'}`)

    if (!DRY && (mudouSpecs || mudouDescricao)) {
      await prisma.produto.update({
        where: { id: p.id },
        data: { especificacoes: novasSpecs as unknown as Prisma.InputJsonValue, descricao: novaDescricao },
      })
    }
  }

  console.log('\n--- Adicionando campos de oscilação no SX180 Trend ---')
  const sx180 = await prisma.produto.findUnique({ where: { slug: 'sx180-trend' }, select: { id: true, especificacoes: true } })
  if (!sx180) {
    console.log('  [!] sx180-trend não encontrado')
  } else {
    const specs = (Array.isArray(sx180.especificacoes) ? sx180.especificacoes : []) as unknown as EspecRow[]
    const jaTem = specs.some((s) => s.label.startsWith('Oscilação'))
    if (jaTem) {
      console.log('  [sx180-trend] já tem campo de oscilação — nada a fazer')
    } else {
      // insere logo depois de "Nível de Ruído", mesma posição usada nos irmãos da linha
      const idx = specs.findIndex((s) => s.label === 'Nível de Ruído')
      const novosCampos: EspecRow[] = [
        { label: 'Oscilação Horizontal', valor: 'Automática' },
        { label: 'Oscilação Vertical', valor: 'Manual' },
      ]
      const novasSpecs = idx >= 0
        ? [...specs.slice(0, idx + 1), ...novosCampos, ...specs.slice(idx + 1)]
        : [...specs, ...novosCampos]
      console.log(`  [sx180-trend] adicionando Oscilação Horizontal: Automática / Vertical: Manual ${DRY ? '(dry)' : ''}`)
      if (!DRY) {
        await prisma.produto.update({ where: { id: sx180.id }, data: { especificacoes: novasSpecs as unknown as Prisma.InputJsonValue } })
      }
    }
  }

  console.log(DRY ? '\n[dry-run] nenhuma alteração gravada.' : '\n✅ Concluído.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
