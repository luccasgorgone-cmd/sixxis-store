// ─── Promo Black Friday — "2ª unidade com 50% OFF" (SITE INTEIRO) ────────────
// Desconto automático por quantidade, calculado no servidor (fonte de verdade,
// em /api/pedidos) e reaproveitado no cliente só para EXIBIÇÃO. Não é um Cupom:
// o Cupom só sabe descontar o subtotal inteiro; esta promo raciocina por UNIDADE.
//
// REGRA (confirmada com o Luccas + Marketing, nov/2026):
//   • Vale para TODO produto do site (não é mais whitelist de 1 produto).
//   • A cada PAR de unidades do carrinho, a unidade MAIS BARATA do par sai com
//     `percentual`% OFF. Generalizando: com N unidades elegíveis, k = floor(N/2)
//     descontos, aplicados nas k unidades MAIS BARATAS ("leve 4 = 2 descontos,
//     nos 2 mais baratos"). O desconto é SEMPRE no mais barato, NUNCA no mais caro.
//   • 2 do mesmo produto → preços iguais → 1 unidade (a "2ª") sai 50%.
//   • 2 produtos diferentes → desconto na unidade do produto mais barato.
//
// MARGEM (hooks, por decisão do Luccas): `excluir` tira SKUs/slugs da promo por
// completo (nem descontam nem contam no pareamento — protege itens de margem
// baixa, ex.: 2× aspirador não gera desconto); `pisoItemDescontado` ignora
// unidades abaixo de um preço mínimo. Vazios/0 = regra pura "site inteiro".
//
// ATIVAÇÃO: `ativa` é o interruptor-mestre (GO do Luccas). A promo só incide
// quando `ativa=true` E dentro de [inicio, fim]. Default `ativa=false` → a promo
// fica DORMENTE (sem badge, sem desconto, zero mudança de comportamento), para
// o código poder subir sem ir ao ar antes do go-live confirmado.
//
// Não acumula com cupom: quando a promo está ATIVA e incide no carrinho, o cupom
// é IGNORADO no pedido inteiro. Essa exclusão é aplicada por quem chama — o
// servidor (/api/pedidos, autoritativo) e o checkout/carrinho (UX).

export interface ConfigPromoBF {
  /** Interruptor-mestre (GO do Luccas). false = promo dormente. */
  ativa: boolean
  /** % de desconto na unidade "par" (50 = metade do preço). */
  percentual: number
  /** Início de vigência (ISO com offset — America/Sao_Paulo = -03:00). */
  inicio: string
  /** Fim de vigência, inclusivo (ISO com offset). `null` = sem data final. */
  fim: string | null
  /** Rótulo amigável exibido ao cliente. */
  descricao: string
  /**
   * SKUs e/ou slugs que NÃO participam da promo (nem descontam nem contam no
   * pareamento). Hook de margem — vazio por padrão (regra pura "site inteiro").
   */
  excluir: readonly string[]
  /** Piso de preço: unidades abaixo deste valor não participam (0 = sem piso). */
  pisoItemDescontado: number
}

// Config única — editar aqui para go-live (flipar `ativa`, travar datas, e, se o
// Luccas decidir, listar SKUs de margem baixa em `excluir`).
export const PROMO_BF: ConfigPromoBF = {
  ativa:              false, // ← GO do Luccas flipa para true
  percentual:         50,
  inicio:             '2026-11-27T00:00:00-03:00', // ← confirmar data/hora com Luccas
  fim:                '2026-11-30T23:59:59-03:00',  // ← confirmar (Cyber Monday)
  descricao:          '2ª unidade com 50% OFF — Black Friday',
  excluir:            [], // ← ex.: ['aspirador-sixxis', 'CLIM-...'] se Luccas pedir
  pisoItemDescontado: 0,
}

export interface ResultadoPromo {
  /** true quando pelo menos 1 unidade recebeu desconto. */
  ativo: boolean
  /** Desconto total em reais (2 casas). */
  desconto: number
  /** Quantas unidades saíram com desconto (floor(elegíveis/2)). */
  unidadesComDesconto: number
  /** Rótulo da promo aplicada (para a UI); null se nada aplicou. */
  descricao: string | null
}

/** A promo está ativa (interruptor + janela) neste instante? */
export function promoAtiva(agora: Date = new Date()): boolean {
  if (!PROMO_BF.ativa) return false
  const t = agora.getTime()
  if (t < new Date(PROMO_BF.inicio).getTime()) return false
  if (PROMO_BF.fim !== null && t > new Date(PROMO_BF.fim).getTime()) return false
  return true
}

/** Um identificador (sku/slug/feedId) está excluído da promo? */
function excluido(identificadores: Array<string | null | undefined>): boolean {
  if (PROMO_BF.excluir.length === 0) return false
  const set = new Set(PROMO_BF.excluir)
  return identificadores.some((id) => id != null && set.has(id))
}

/** Badge amigável para a PDP/vitrine quando a promo está ativa (ou null). */
export interface PromoBadge {
  descricao: string
  percentual: number
  fim: string | null
}

function badge(): PromoBadge {
  return { descricao: PROMO_BF.descricao, percentual: PROMO_BF.percentual, fim: PROMO_BF.fim }
}

/**
 * Badge por feedId (= sku ?? slug) para a vitrine/PDP. Retorna o badge quando a
 * promo está ativa e o produto NÃO está excluído; senão null. (Site inteiro: não
 * depende de whitelist — qualquer produto não-excluído mostra o selo.)
 */
export function promoVigentePorFeedId(
  feedId: string | undefined | null,
  agora: Date = new Date(),
): PromoBadge | null {
  if (!promoAtiva(agora)) return null
  if (excluido([feedId])) return null
  return badge()
}

/**
 * Badge por erpProdutoId — mantido para compat (homepage/tests). Site inteiro:
 * retorna o badge quando a promo está ativa (exclusão é por sku/slug, não erp).
 */
export function promoVigentePorErp(
  _erpProdutoId: string,
  agora: Date = new Date(),
): PromoBadge | null {
  return promoAtiva(agora) ? badge() : null
}

// Núcleo: recebe unidades (preço efetivo + identificadores p/ exclusão) e aplica
// a regra global. Pool elegível = unidades não-excluídas e >= piso; as k = floor
// (pool/2) MAIS BARATAS do pool saem com `percentual`% OFF.
// Pré-condição: os chamadores (calcular*) já validaram a janela com promoAtiva(agora).
function aplicarGlobal(
  unidades: Array<{ preco: number; ids: Array<string | null | undefined> }>,
): ResultadoPromo {
  const inativo: ResultadoPromo = { ativo: false, desconto: 0, unidadesComDesconto: 0, descricao: null }

  const pool = unidades
    .filter((u) => Number.isFinite(u.preco) && u.preco >= 0)
    .filter((u) => u.preco >= PROMO_BF.pisoItemDescontado)
    .filter((u) => !excluido(u.ids))
    .map((u) => u.preco)
    .sort((a, b) => a - b)

  const k = Math.floor(pool.length / 2)
  if (k <= 0) return inativo

  // As k unidades mais baratas do pool (store-favoring; "sempre no mais barato").
  let desconto = 0
  for (let i = 0; i < k; i++) desconto += pool[i] * (PROMO_BF.percentual / 100)
  desconto = Math.round(desconto * 100) / 100

  return { ativo: true, desconto, unidadesComDesconto: k, descricao: PROMO_BF.descricao }
}

/** Expande itens (quantidade → unidades individuais) para o cálculo global. */
function expandir<T extends { preco: number; quantidade: number; ids: Array<string | null | undefined> }>(
  itens: T[],
): Array<{ preco: number; ids: Array<string | null | undefined> }> {
  const out: Array<{ preco: number; ids: Array<string | null | undefined> }> = []
  for (const it of itens) {
    const q = Math.max(0, Math.floor(Number(it.quantidade)) || 0)
    for (let i = 0; i < q; i++) out.push({ preco: it.preco, ids: it.ids })
  }
  return out
}

/**
 * SERVIDOR (autoritativo). Itens já resolvidos: `precoUnitario` é o preço efetivo
 * (precoPromocional/variação). `sku`/`slug` opcionais para a exclusão de margem.
 */
export function calcularPromoServidor(
  itens: Array<{
    erpProdutoId: string
    precoUnitario: number
    quantidade: number
    sku?: string | null
    slug?: string | null
  }>,
  agora: Date = new Date(),
): ResultadoPromo {
  if (!promoAtiva(agora)) return { ativo: false, desconto: 0, unidadesComDesconto: 0, descricao: null }
  return aplicarGlobal(
    expandir(itens.map((i) => ({ preco: i.precoUnitario, quantidade: i.quantidade, ids: [i.sku, i.slug] }))),
  )
}

/**
 * CLIENTE (só exibição). Itens do carrinho (feedId + preco + quantidade). O valor
 * cobrado é sempre o que o servidor recalcula; isto é para a UI.
 */
export function calcularPromoCliente(
  itens: Array<{ feedId?: string | null; preco: number; quantidade: number; slug?: string | null }>,
  agora: Date = new Date(),
): ResultadoPromo {
  if (!promoAtiva(agora)) return { ativo: false, desconto: 0, unidadesComDesconto: 0, descricao: null }
  return aplicarGlobal(
    expandir(itens.map((i) => ({ preco: i.preco, quantidade: i.quantidade, ids: [i.feedId, i.slug] }))),
  )
}
