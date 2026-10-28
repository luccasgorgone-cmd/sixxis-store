// ─── Badge de cupom na vitrine (SÓ EXIBIÇÃO) ─────────────────────────────────
// Espelho de EXIBIÇÃO dos cupons escopados por produto (Cupom.produtoIds) para
// mostrar um selo "CUPOM −X%" na foto do card. A VALIDAÇÃO e o DESCONTO reais
// continuam 100% no servidor (lib/cupom.ts + /api/pedidos, autoridade) a partir
// do Cupom no banco — este arquivo nunca desconta nada, só decide o que o card
// pinta. Mesmo espírito do badge "2ª unidade" (promo-segunda-unidade.ts): config
// leve, resolvida no cliente por feedId, sem ler o banco na vitrine.
//
// DRIFT: este é um espelho manual do Cupom do banco. Ao criar/alterar/desativar
// um cupom escopado no admin, atualize (ou remova) a entrada aqui — senão o card
// anuncia um cupom que o servidor recusa (ou esconde um que vale). O charging
// nunca depende disto; no pior caso o selo mente, o checkout não.
//
// Chave de casamento = feedId do card = `produto.sku ?? produto.slug`
// (ver lib/feed-id.ts e CardProduto). Listamos os feedIds possíveis para casar
// sem depender de sku nulo.

export interface CupomVitrine {
  /** Código do cupom no banco (o cliente digita isto no checkout). */
  codigo: string
  /** feedIds possíveis do produto no card: sku e/ou slug. */
  clientFeedIds: string[]
  /** % de desconto do cupom PERCENTUAL (10 = 10% OFF). */
  percentual: number
  /** Início de vigência opcional (ISO com offset -03:00). Ausente = sem início. */
  inicio?: string
  /** Fim de vigência opcional, inclusivo (ISO com offset). Ausente = sem validade. */
  fim?: string
}

// Config v1 — adicionar outro selo é só mais um item aqui, espelhando o Cupom
// escopado criado no admin/migration.
export const CUPONS_VITRINE: readonly CupomVitrine[] = [
  {
    // Espelha o Cupom 10OFFTREND (PERCENTUAL 10, ativo, sem validade) escopado
    // ao Produto slug=sx200-trend — criado na migration
    // 20261028120000_cupom_escopo_produto. feedId do card = sku ?? slug.
    codigo:        '10OFFTREND',
    clientFeedIds: ['CLIM-SX200-TREND', 'sx200-trend'],
    percentual:    10,
  },
]

function vigente(c: CupomVitrine, agora: Date): boolean {
  if (c.inicio && agora.getTime() < new Date(c.inicio).getTime()) return false
  if (c.fim && agora.getTime() > new Date(c.fim).getTime()) return false
  return true
}

/** Cupom de vitrine vigente para um feedId do card (ou null). Só p/ o badge. */
export function cupomVitrinePorFeedId(
  feedId: string | undefined | null,
  agora: Date = new Date(),
): CupomVitrine | null {
  if (!feedId) return null
  const c = CUPONS_VITRINE.find((x) => x.clientFeedIds.includes(feedId))
  return c && vigente(c, agora) ? c : null
}
