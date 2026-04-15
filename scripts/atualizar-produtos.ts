import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  const urlsPath = path.join(process.cwd(), 'scripts/urls-r2.json')
  if (!fs.existsSync(urlsPath)) {
    throw new Error('scripts/urls-r2.json não encontrado — execute node scripts/upload-imagens.cjs primeiro')
  }

  const urlsR2: Record<string, { arquivo: string; url: string; index: number }[]> =
    JSON.parse(fs.readFileSync(urlsPath, 'utf-8'))

  console.log('\n🚀 Atualizando produtos no banco...\n')

  // ── SX200 Prime: imagens por cor (Branco/Preto) ───────────────────────────
  const sx200 = await prisma.produto.findFirst({
    where: { slug: 'sx200-prime' },
    include: { variacoes: true },
  })

  if (sx200) {
    const imgsBranco = (urlsR2['sx200-prime']       || []).map(u => u.url)
    const imgsPreto  = (urlsR2['sx200-prime-preto'] || []).map(u => u.url)
    const todasImagens = [...imgsBranco, ...imgsPreto]

    const imagensPorVariacao: Record<string, string[]> = {}
    if (imgsBranco.length) imagensPorVariacao['Branco'] = imgsBranco
    if (imgsPreto.length)  imagensPorVariacao['Preto']  = imgsPreto

    await prisma.produto.update({
      where: { id: sx200.id },
      data: {
        ...(todasImagens.length > 0 ? { imagens: todasImagens } : {}),
        estoque: 100,
        ...(Object.keys(imagensPorVariacao).length > 0
          ? { imagensPorVariacao: imagensPorVariacao as object }
          : {}),
      },
    })

    for (const v of sx200.variacoes) {
      await prisma.variacaoProduto.update({ where: { id: v.id }, data: { estoque: 50 } })
    }

    console.log(
      `✅ SX200 Prime: ${imgsBranco.length} imgs branco + ${imgsPreto.length} imgs preto` +
      ` | vars: ${sx200.variacoes.map(v => v.nome).join(', ')}`
    )
  } else {
    console.log('⚠️  SX200 Prime não encontrado no banco')
  }

  // ── Demais produtos ───────────────────────────────────────────────────────
  const mapa: { slug: string; r2Key: string; estoque: number; variacaoEstoque: number }[] = [
    { slug: 'SX040',                r2Key: 'SX040',                estoque: 100, variacaoEstoque: 50 },
    { slug: 'm45-trend',            r2Key: 'm45-trend',            estoque: 100, variacaoEstoque: 50 },
    { slug: 'sx060-prime',          r2Key: 'sx060-prime',          estoque: 100, variacaoEstoque: 50 },
    { slug: 'sx070-trend',          r2Key: 'sx070-trend',          estoque: 100, variacaoEstoque: 50 },
    { slug: 'sx100-trend',          r2Key: 'sx100-trend',          estoque: 100, variacaoEstoque: 50 },
    { slug: 'sx120-prime',          r2Key: 'sx120-prime',          estoque: 100, variacaoEstoque: 50 },
    { slug: 'sx200-trend',          r2Key: 'sx200-trend',          estoque: 100, variacaoEstoque: 50 },
    { slug: 'asp-bravo',            r2Key: 'asp-bravo',            estoque: 100, variacaoEstoque: 0  },
    { slug: 'spinning-sixxis-life', r2Key: 'spinning-sixxis-life', estoque: 100, variacaoEstoque: 0  },
  ]

  for (const item of mapa) {
    const produto = await prisma.produto.findFirst({
      where: { slug: item.slug },
      include: { variacoes: true },
    })

    if (!produto) { console.log(`⚠️  "${item.slug}" não encontrado — pulando`); continue }

    const novasImagens = (urlsR2[item.r2Key] || []).map(u => u.url)
    const imagens = novasImagens.length > 0 ? novasImagens : (produto.imagens as string[])

    await prisma.produto.update({
      where: { id: produto.id },
      data: { imagens, estoque: item.estoque },
    })

    if (item.variacaoEstoque > 0) {
      for (const v of produto.variacoes) {
        await prisma.variacaoProduto.update({
          where: { id: v.id },
          data: { estoque: item.variacaoEstoque },
        })
      }
    }

    console.log(
      `✅ ${produto.nome}: ${imagens.length} imgs | est:${item.estoque}` +
      (item.variacaoEstoque > 0 && produto.variacoes.length > 0
        ? ` | ${produto.variacoes.length} vars x ${item.variacaoEstoque}`
        : '')
    )
  }

  // ── Verificação final ─────────────────────────────────────────────────────
  console.log('\n📊 VERIFICAÇÃO FINAL:')
  const todos = await prisma.produto.findMany({
    include: { variacoes: true },
    orderBy: { nome: 'asc' },
  })

  for (const p of todos) {
    const imgs = p.imagens as string[]
    const qtd = imgs?.length || 0
    const temR2 = qtd > 0 && imgs[0].includes('r2.dev')
    const vars = p.variacoes.map(v => `${v.nome}:${v.estoque}`).join(', ')
    console.log(
      `  ${temR2 ? '✅' : qtd > 0 ? '⚠️' : '❌'} ${p.nome}` +
      ` | est:${p.estoque} | imgs:${qtd}` +
      (vars ? ` | [${vars}]` : '')
    )
  }

  await prisma.$disconnect()
  console.log('\n✅ Concluído!')
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1) })
