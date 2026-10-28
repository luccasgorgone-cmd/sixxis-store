// ─── Promo "leve 2, a 2ª unidade com desconto" ───────────────────────────────
// Desconto automático POR QUANTIDADE, calculado no servidor (fonte de verdade,
// em /api/pedidos) e reaproveitado no cliente só para EXIBIÇÃO. Não é um Cupom:
// o Cupom só sabe descontar o subtotal inteiro (percentual/valor fixo/frete),
// não raciocina "por unidade".
//
// Regra: a cada PAR de unidades do mesmo produto, 1 unidade sai com `percentual`
// de desconto → unidadesComDesconto = floor(qtd / 2).
//   2 un → 1 com desconto   3 un → 1 com desconto   4 un → 2 com desconto
//
// Não acumula com cupom: quando a promo está ATIVA para o carrinho, o cupom é
// IGNORADO no pedido inteiro. Essa exclusão é aplicada por quem chama — o
// servidor (/api/pedidos, autoritativo) e o checkout/carrinho (UX).
//
// Chave de negócio = Produto.erpProdutoId (estável entre ambientes). No cliente
// o carrinho só carrega `feedId` (= sku ?? slug, ver lib/feed-id.ts), então a
// config também lista as `clientFeedIds` possíveis para casar lá. O charging
// nunca depende disso: o servidor casa exato por erpProdutoId.

export interface PromoSegundaUnidade {
  /** Chave estável de negócio (Produto.erpProdutoId) — usada no servidor. */
  erpProdutoId: string
  /**
   * feedIds possíveis no carrinho do cliente (sku e/ou slug do produto).
   * SX180 Trend não tem variação precificada (110/220V mesmo preço) → feedId é
   * `sku ?? slug`. Listar ambos cobre o caso de sku nulo sem ler o banco.
   */
  clientFeedIds: string[]
  /** % de desconto na unidade "par" (50 = metade do preço). */
  percentual: number
  /** Início de vigência (ISO com offset — America/Sao_Paulo = -03:00). */
  inicio: string
  /** Fim de vigência, inclusivo (ISO com offset). */
  fim: string
  /** Rótulo amigável exibido ao cliente ("2ª unidade 50% OFF"). */
  descricao: string
}

// Config v1 — adicionar outra promo dessas é só mais um item aqui.
export const PROMOS_SEGUNDA_UNIDADE: readonly PromoSegundaUnidade[] = [
  {
    // erpProdutoId REAL do produto no banco (produto criado no admin, nao via ERP
    // sync) — confirmado em producao. NAO confundir com o id do arquivo de
    // dimensoes (CLIM-SX180-TREND), que e outro namespace. O servidor casa por
    // este valor; errar aqui faz o desconto nunca aplicar no pedido.
    erpProdutoId:  'ADMIN-1781206602840-9qw3wci',
    // feedId do carrinho = sku ?? slug (lib/feed-id). sku=CLIM-SX180-TREND,
    // slug=sx180-trend — ambos cobrem a exibicao no cliente.
    clientFeedIds: ['CLIM-SX180-TREND', 'sx180-trend'],
    percentual:    50,
    inicio:        '2026-10-27T00:00:00-03:00',
    fim:           '2026-11-04T23:59:59-03:00',
    descricao:     '2ª unidade 50% OFF',
  },
]

export interface ResultadoPromo {
  /** true quando pelo menos 1 unidade recebeu desconto. */
  ativo: boolean
  /** Desconto total em reais (2 casas). */
  desconto: number
  /** Quantas unidades saíram com desconto (floor(qtd/2) somado por produto). */
  unidadesComDesconto: number
  /** Rótulo da promo aplicada (para a UI); null se nada aplicou. */
  descricao: string | null
}

function vigente(p: PromoSegundaUnidade, agora: Date): boolean {
  const ini = new Date(p.inicio).getTime()
  const fim = new Date(p.fim).getTime()
  const t = agora.getTime()
  return t >= ini && t <= fim
}

/** Todas as promos vigentes agora. Útil para a vitrine decidir o que destacar. */
export function promosVigentes(agora: Date = new Date()): PromoSegundaUnidade[] {
  return PROMOS_SEGUNDA_UNIDADE.filter((p) => vigente(p, agora))
}

/** Promo vigente para um erpProdutoId (ou null). Útil para badge na vitrine. */
export function promoVigentePorErp(
  erpProdutoId: string,
  agora: Date = new Date(),
): PromoSegundaUnidade | null {
  const p = PROMOS_SEGUNDA_UNIDADE.find((x) => x.erpProdutoId === erpProdutoId)
  return p && vigente(p, agora) ? p : null
}

/** Promo vigente para um feedId do carrinho (ou null). */
export function promoVigentePorFeedId(
  feedId: string | undefined | null,
  agora: Date = new Date(),
): PromoSegundaUnidade | null {
  if (!feedId) return null
  const p = PROMOS_SEGUNDA_UNIDADE.find((x) => x.clientFeedIds.includes(feedId))
  return p && vigente(p, agora) ? p : null
}

// Núcleo: recebe itens já resolvidos para uma promo vigente e calcula o desconto.
// Agrupa por erpProdutoId (o mesmo produto pode vir em linhas separadas) e
// desconta as unidades de MENOR preço (conservador, a favor da loja).
function aplicar(
  itens: { promo: PromoSegundaUnidade; preco: number; quantidade: number }[],
): ResultadoPromo {
  const grupos = new Map<string, { promo: PromoSegundaUnidade; preco: number; qtd: number }>()
  for (const it of itens) {
    if (!(it.quantidade > 0) || !(it.preco >= 0)) continue
    const g = grupos.get(it.promo.erpProdutoId)
    if (g) {
      g.preco = Math.min(g.preco, it.preco)
      g.qtd += it.quantidade
    } else {
      grupos.set(it.promo.erpProdutoId, { promo: it.promo, preco: it.preco, qtd: it.quantidade })
    }
  }

  let desconto = 0
  let unidades = 0
  let descricao: string | null = null
  for (const { promo, preco, qtd } of grupos.values()) {
    const n = Math.floor(qtd / 2)
    if (n <= 0) continue
    desconto += n * preco * (promo.percentual / 100)
    unidades += n
    descricao = promo.descricao
  }

  desconto = Math.round(desconto * 100) / 100
  return { ativo: unidades > 0, desconto, unidadesComDesconto: unidades, descricao }
}

/**
 * SERVIDOR (autoritativo). Itens com a chave de negócio erpProdutoId.
 * `precoUnitario` é o preço efetivo já resolvido (precoPromocional/variação).
 */
export function calcularPromoServidor(
  itens: { erpProdutoId: string; precoUnitario: number; quantidade: number }[],
  agora: Date = new Date(),
): ResultadoPromo {
  const resolvidos = itens
    .map((i) => {
      const promo = promoVigentePorErp(i.erpProdutoId, agora)
      return promo ? { promo, preco: i.precoUnitario, quantidade: i.quantidade } : null
    })
    .filter((x): x is { promo: PromoSegundaUnidade; preco: number; quantidade: number } => x !== null)
  return aplicar(resolvidos)
}

/**
 * CLIENTE (só exibição). Itens do carrinho (feedId + preco + quantidade).
 * O valor cobrado é sempre o que o servidor recalcula; isto é para a UI.
 */
export function calcularPromoCliente(
  itens: { feedId?: string | null; preco: number; quantidade: number }[],
  agora: Date = new Date(),
): ResultadoPromo {
  const resolvidos = itens
    .map((i) => {
      const promo = promoVigentePorFeedId(i.feedId, agora)
      return promo ? { promo, preco: i.preco, quantidade: i.quantidade } : null
    })
    .filter((x): x is { promo: PromoSegundaUnidade; preco: number; quantidade: number } => x !== null)
  return aplicar(resolvidos)
}
