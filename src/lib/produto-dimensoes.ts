// ─── Dados e lógica de peso/dimensões dos produtos (para frete) ───────────────
// FONTE ÚNICA da tabela de medidas. Consumido por:
//   - scripts/seed-produto-dimensoes.ts (CLI)
//   - POST /api/admin/produtos/importar-dimensoes (botão do admin)
// Não duplicar os dados em outro lugar.
//
// Casamento POR PRODUTO (variações 110/220/cor herdam): tenta SKU do produto,
// slug do produto, e por fim SKU de uma variação → produto pai.

import type { PrismaClient } from '@prisma/client'

export interface MedidaProduto {
  label: string
  // Identificadores candidatos: SKU do produto, slug, ou SKU de variação.
  ids: string[]
  pesoKg: number
  alturaCm: number
  larguraCm: number
  comprimentoCm: number
  volumes: number
}

// de-para (valores já em cm; peso em kg). POR PRODUTO — variações herdam.
export const MEDIDAS_PRODUTO: MedidaProduto[] = [
  { label: 'Aspirador',   ids: ['ASPIRA-BRAVO', 'asp-bravo'],                           pesoKg: 2.0,  alturaCm: 11,  larguraCm: 27, comprimentoCm: 44,  volumes: 1 },
  { label: 'Bike Life',   ids: ['SPN-LIFE-SX', 'spinning-sixxis-life'],                 pesoKg: 28.0, alturaCm: 86,  larguraCm: 24, comprimentoCm: 97,  volumes: 1 },
  { label: 'M45',         ids: ['CLIM-M45-TREND'],                                      pesoKg: 15.0, alturaCm: 105, larguraCm: 42, comprimentoCm: 52,  volumes: 1 },
  { label: 'SX040',       ids: ['CLI-SX040A-R-110', 'sx040-trend', 'CLIM-SX040-TREND'], pesoKg: 15.0, alturaCm: 105, larguraCm: 42, comprimentoCm: 52,  volumes: 1 },
  { label: 'SX060',       ids: ['CLIM-SX060-PRIME'],                                    pesoKg: 22.0, alturaCm: 100, larguraCm: 39, comprimentoCm: 59,  volumes: 1 },
  { label: 'SX070',       ids: ['CLIM-SX070-TREND'],                                    pesoKg: 20.0, alturaCm: 114, larguraCm: 46, comprimentoCm: 65,  volumes: 1 },
  { label: 'SX100',       ids: ['CLIM-SX100-TREND'],                                    pesoKg: 27.5, alturaCm: 130, larguraCm: 50, comprimentoCm: 80,  volumes: 1 },
  { label: 'SX120',       ids: ['CLIM-SX120-PRIME'],                                    pesoKg: 42.0, alturaCm: 128, larguraCm: 49, comprimentoCm: 92,  volumes: 1 },
  { label: 'SX180',       ids: ['CLIM-SX180-TREND'],                                    pesoKg: 34.0, alturaCm: 140, larguraCm: 75, comprimentoCm: 92,  volumes: 1 },
  { label: 'SX200 Prime', ids: ['CLIM-SX200-PRIME'],                                    pesoKg: 69.0, alturaCm: 158, larguraCm: 67, comprimentoCm: 108, volumes: 1 },
  { label: 'SX200 Trend', ids: ['CLIM-SX200-TREND'],                                    pesoKg: 46.0, alturaCm: 137, larguraCm: 53, comprimentoCm: 92,  volumes: 1 },
]

export interface LinhaDePara {
  label: string
  ids: string[]
  medida: {
    pesoKg: number
    alturaCm: number
    larguraCm: number
    comprimentoCm: number
    volumes: number
  }
  casou: boolean
  produtoId?: string
  produtoNome?: string
  produtoSku?: string | null
  produtoSlug?: string | null
  via?: string // 'sku:...' | 'slug:...' | 'variacao:...'
  jaAtualizado?: boolean // dimensões atuais já batem com a medida (idempotência)
}

export interface ResultadoDePara {
  linhas: LinhaDePara[]
  casados: LinhaDePara[]
  naoCasados: LinhaDePara[]
}

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

// Cliente mínimo aceito — tanto @/lib/prisma quanto scripts/_db são PrismaClient.
type PrismaLike = Pick<PrismaClient, 'produto' | 'variacaoProduto'>

// Monta o de-para (SEM gravar). Faz 2 queries e casa em memória.
export async function resolverDeParaDimensoes(prisma: PrismaLike): Promise<ResultadoDePara> {
  const produtos = await prisma.produto.findMany({
    select: {
      id: true, nome: true, sku: true, slug: true,
      pesoKg: true, alturaCm: true, larguraCm: true, comprimentoCm: true, volumes: true,
    },
  })
  const variacoes = await prisma.variacaoProduto.findMany({
    select: { sku: true, produtoId: true },
  })

  // Índices para casamento O(1).
  const porSku = new Map<string, (typeof produtos)[number]>()
  const porSlug = new Map<string, (typeof produtos)[number]>()
  const produtoPorId = new Map(produtos.map((p) => [p.id, p]))
  for (const p of produtos) {
    if (p.sku) porSku.set(norm(p.sku), p)
    if (p.slug) porSlug.set(norm(p.slug), p)
  }
  const varSkuParaProdutoId = new Map<string, string>()
  for (const v of variacoes) {
    if (v.sku) varSkuParaProdutoId.set(norm(v.sku), v.produtoId)
  }

  const linhas: LinhaDePara[] = MEDIDAS_PRODUTO.map((m) => {
    const medida = {
      pesoKg: m.pesoKg, alturaCm: m.alturaCm, larguraCm: m.larguraCm,
      comprimentoCm: m.comprimentoCm, volumes: m.volumes,
    }

    for (const id of m.ids) {
      const key = norm(id)
      const bySku = porSku.get(key)
      if (bySku) return linhaCasada(m, medida, bySku, `sku:${bySku.sku}`)

      const bySlug = porSlug.get(key)
      if (bySlug) return linhaCasada(m, medida, bySlug, `slug:${bySlug.slug}`)

      const prodId = varSkuParaProdutoId.get(key)
      if (prodId) {
        const p = produtoPorId.get(prodId)
        if (p) return linhaCasada(m, medida, p, `variacao:${id}`)
      }
    }

    return { label: m.label, ids: m.ids, medida, casou: false }
  })

  return {
    linhas,
    casados: linhas.filter((l) => l.casou),
    naoCasados: linhas.filter((l) => !l.casou),
  }
}

function linhaCasada(
  m: MedidaProduto,
  medida: LinhaDePara['medida'],
  p: { id: string; nome: string; sku: string | null; slug: string; pesoKg: unknown; alturaCm: unknown; larguraCm: unknown; comprimentoCm: unknown; volumes: number | null },
  via: string,
): LinhaDePara {
  const jaAtualizado =
    Number(p.pesoKg) === m.pesoKg &&
    Number(p.alturaCm) === m.alturaCm &&
    Number(p.larguraCm) === m.larguraCm &&
    Number(p.comprimentoCm) === m.comprimentoCm &&
    Number(p.volumes ?? 0) === m.volumes
  return {
    label: m.label, ids: m.ids, medida, casou: true,
    produtoId: p.id, produtoNome: p.nome, produtoSku: p.sku, produtoSlug: p.slug,
    via, jaAtualizado,
  }
}

export interface ResultadoAplicacao {
  atualizados: number
  jaEstavam: number
  naoCasaram: number
  linhas: LinhaDePara[]
}

// Aplica as dimensões nos produtos casados. Idempotente: rodar de novo só
// regrava os mesmos valores (não duplica nada).
export async function aplicarDimensoes(prisma: PrismaLike): Promise<ResultadoAplicacao> {
  const dePara = await resolverDeParaDimensoes(prisma)

  let atualizados = 0
  let jaEstavam = 0
  for (const l of dePara.casados) {
    if (!l.produtoId) continue
    if (l.jaAtualizado) jaEstavam++
    await prisma.produto.update({
      where: { id: l.produtoId },
      data: {
        pesoKg: l.medida.pesoKg,
        alturaCm: l.medida.alturaCm,
        larguraCm: l.medida.larguraCm,
        comprimentoCm: l.medida.comprimentoCm,
        volumes: l.medida.volumes,
      },
    })
    atualizados++
  }

  return {
    atualizados,
    jaEstavam,
    naoCasaram: dePara.naoCasados.length,
    linhas: dePara.linhas,
  }
}
