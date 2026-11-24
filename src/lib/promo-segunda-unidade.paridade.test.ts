import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  PROMO_BF,
  calcularPromoCliente,
  calcularPromoServidor,
  idExcluidoDaPromo,
  promoVigentePorFeedId,
} from './promo-segunda-unidade'
import { feedId } from './feed-id'

// Paridade cliente (carrinho/drawer/checkout) × servidor (/api/pedidos) da promo
// "2ª unidade", com o catálogo REAL de produção (SKUs conferidos no banco em
// 24/11/2026). O cliente só tem o `feedId` gravado no item do carrinho — para
// variação precificada é o SKU DA VARIAÇÃO (ex.: CLIM-SX200-PRIME-Branco); o
// servidor tem sku/slug do produto e o SKU da variação escolhida.

const DENTRO = new Date('2026-11-28T12:00:00-03:00')

const ORIG = { ativa: PROMO_BF.ativa, excluir: [...PROMO_BF.excluir] }
beforeEach(() => {
  PROMO_BF.ativa = true
  PROMO_BF.excluir = [...ORIG.excluir] // config real de produção (SX200 Prime fora)
})
afterEach(() => {
  PROMO_BF.ativa = ORIG.ativa
  PROMO_BF.excluir = [...ORIG.excluir]
})

type Var = { id: string; sku: string; preco: number | null }
type Prod = { id: string; erp: string; sku: string; slug: string; preco: number; variacoes: Var[] }

const SX200_PRIME: Prod = {
  id: 'p-sx200-prime', erp: 'ERP-200P', sku: 'CLIM-SX200-PRIME', slug: 'sx200-prime', preco: 8600,
  variacoes: [
    { id: 'v-branco', sku: 'CLIM-SX200-PRIME-Branco', preco: 8600 },
    { id: 'v-preto', sku: 'CLIM-SX200-PRIME-Preto', preco: 9050 },
  ],
}
const SX200_TREND: Prod = {
  id: 'p-sx200-trend', erp: 'ERP-200T', sku: 'CLIM-SX200-TREND', slug: 'sx200-trend', preco: 5175,
  variacoes: [{ id: 'v-t220', sku: 'CLIM-SX200-TREND-220V', preco: null }],
}
const SX100: Prod = {
  id: 'p-sx100', erp: 'ERP-100T', sku: 'CLIM-SX100-TREND', slug: 'sx100-trend', preco: 3990,
  variacoes: [
    { id: 'v-110', sku: 'CLIM-SX100-TREND-110V', preco: null },
    { id: 'v-220', sku: 'CLIM-SX100-TREND-220V', preco: null },
  ],
}
const ASPIRADOR: Prod = {
  id: 'p-asp', erp: 'ERP-ASP', sku: 'ASPIRA-BRAVO', slug: 'asp-bravo', preco: 450, variacoes: [],
}

type Linha = { p: Prod; variacaoId?: string; quantidade: number }

const precoDe = (l: Linha) => {
  const v = l.p.variacoes.find((x) => x.id === l.variacaoId)
  return v?.preco ?? l.p.preco
}

// Como o carrinho grava o item (InfoProdutoCB.gIdCarrinho → feedId()).
function cliente(linhas: Linha[]) {
  return calcularPromoCliente(
    linhas.map((l) => ({
      feedId: feedId({ sku: l.p.sku, slug: l.p.slug }, l.p.variacoes.find((x) => x.id === l.variacaoId), l.p.variacoes),
      preco: precoDe(l),
      quantidade: l.quantidade,
    })),
    DENTRO,
  )
}

// Como /api/pedidos monta a entrada da promo (produto do banco + variação).
function servidor(linhas: Linha[]) {
  return calcularPromoServidor(
    linhas.map((l) => ({
      erpProdutoId: l.p.erp,
      precoUnitario: precoDe(l),
      quantidade: l.quantidade,
      sku: l.p.sku,
      slug: l.p.slug,
      skuVariacao: l.p.variacoes.find((x) => x.id === l.variacaoId)?.sku ?? null,
    })),
    DENTRO,
  )
}

describe('SX200 Prime fora da promo — item com SKU da variação', () => {
  it('cliente: 2× CLIM-SX200-PRIME-Branco NÃO tem desconto (bug 24/11: mostrava −R$ 4.300)', () => {
    const r = calcularPromoCliente([{ feedId: 'CLIM-SX200-PRIME-Branco', preco: 8600, quantidade: 2 }], DENTRO)
    expect(r.ativo).toBe(false)
    expect(r.desconto).toBe(0)
  })
  it('cliente: Branco + Preto NÃO tem desconto', () => {
    const r = calcularPromoCliente(
      [
        { feedId: 'CLIM-SX200-PRIME-Branco', preco: 8600, quantidade: 1 },
        { feedId: 'CLIM-SX200-PRIME-Preto', preco: 9050, quantidade: 1 },
      ],
      DENTRO,
    )
    expect(r.ativo).toBe(false)
  })
  it('selo de vitrine/PDP: variação do SX200 Prime também sem selo', () => {
    expect(promoVigentePorFeedId('CLIM-SX200-PRIME', DENTRO)).toBeNull()
    expect(promoVigentePorFeedId('CLIM-SX200-PRIME-Preto', DENTRO)).toBeNull()
    expect(promoVigentePorFeedId('CLIM-SX100-TREND-220V', DENTRO)).not.toBeNull()
  })
  it('prefixo sem hífen não casa (CLIM-SX200-PRIMEX seguiria na promo)', () => {
    expect(idExcluidoDaPromo('CLIM-SX200-PRIMEX')).toBe(false)
    expect(idExcluidoDaPromo('CLIM-SX200-PRIME-Branco')).toBe(true)
    expect(idExcluidoDaPromo(null)).toBe(false)
  })
  it('nome parecido não é variação: SX200 Trend continua na promo', () => {
    const r = calcularPromoCliente([{ feedId: 'CLIM-SX200-TREND-220V', preco: 5175, quantidade: 2 }], DENTRO)
    expect(r.desconto).toBeCloseTo(2587.5, 2)
  })
})

describe('paridade cliente == servidor (matriz de carrinhos)', () => {
  const matriz: Array<{ nome: string; linhas: Linha[]; desconto: number }> = [
    { nome: '2× SX200 Prime Branco', linhas: [{ p: SX200_PRIME, variacaoId: 'v-branco', quantidade: 2 }], desconto: 0 },
    { nome: '2× SX200 Prime Preto', linhas: [{ p: SX200_PRIME, variacaoId: 'v-preto', quantidade: 2 }], desconto: 0 },
    {
      nome: 'SX200 Prime Branco + Preto',
      linhas: [
        { p: SX200_PRIME, variacaoId: 'v-branco', quantidade: 1 },
        { p: SX200_PRIME, variacaoId: 'v-preto', quantidade: 1 },
      ],
      desconto: 0,
    },
    {
      // Prime não conta no pareamento: sobra 1 SX100 sozinho → sem desconto.
      nome: 'SX200 Prime + 1 SX100',
      linhas: [
        { p: SX200_PRIME, variacaoId: 'v-branco', quantidade: 1 },
        { p: SX100, variacaoId: 'v-220', quantidade: 1 },
      ],
      desconto: 0,
    },
    {
      nome: '2× SX200 Prime + 2× SX100 (desconto só no SX100)',
      linhas: [
        { p: SX200_PRIME, variacaoId: 'v-preto', quantidade: 2 },
        { p: SX100, variacaoId: 'v-110', quantidade: 2 },
      ],
      desconto: 1995,
    },
    { nome: '2× SX100 (COM desconto)', linhas: [{ p: SX100, variacaoId: 'v-220', quantidade: 2 }], desconto: 1995 },
    {
      nome: 'SX100 110V + 220V (COM desconto)',
      linhas: [
        { p: SX100, variacaoId: 'v-110', quantidade: 1 },
        { p: SX100, variacaoId: 'v-220', quantidade: 1 },
      ],
      desconto: 1995,
    },
    { nome: '2× SX200 Trend (COM desconto)', linhas: [{ p: SX200_TREND, variacaoId: 'v-t220', quantidade: 2 }], desconto: 2587.5 },
    {
      nome: 'SX100 + aspirador (desconto no mais barato)',
      linhas: [
        { p: SX100, variacaoId: 'v-110', quantidade: 1 },
        { p: ASPIRADOR, quantidade: 1 },
      ],
      desconto: 225,
    },
  ]

  for (const caso of matriz) {
    it(caso.nome, () => {
      const c = cliente(caso.linhas)
      const s = servidor(caso.linhas)
      expect(c).toEqual(s)
      expect(s.desconto).toBeCloseTo(caso.desconto, 2)
    })
  }
})

describe('ressalva visível da promo', () => {
  it('com produto excluído, a ressalva existe e cita o produto (promessa em destaque não pode omitir a exceção)', () => {
    expect(PROMO_BF.excluir.length).toBeGreaterThan(0)
    expect(PROMO_BF.ressalva).toMatch(/SX200 Prime/)
  })
  it('o selo de PDP/vitrine carrega a ressalva', () => {
    expect(promoVigentePorFeedId('CLIM-SX100-TREND', DENTRO)?.ressalva).toBe(PROMO_BF.ressalva)
  })
})
