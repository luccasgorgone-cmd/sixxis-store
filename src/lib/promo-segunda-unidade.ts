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
   * Ressalva curta exibida JUNTO de toda promessa em destaque da promo (home,
   * PDP, /ofertas). Precisa refletir `excluir`: promessa sem a exceção visível é
   * risco de oferta enganosa (CDC art. 30/37). null = sem exceção.
   */
  ressalva: string | null
  /**
   * SKUs e/ou slugs que NÃO participam da promo (nem descontam nem contam no
   * pareamento). Hook de margem — vazio por padrão (regra pura "site inteiro").
   * Um SKU de produto aqui exclui TAMBÉM as variações dele cujo SKU segue o
   * padrão `<SKU do produto>-<sufixo>` (ex.: CLIM-SX200-PRIME → -Branco/-Preto),
   * porque o item do carrinho guarda o SKU da variação, não o do produto.
   * Variação com SKU fora desse padrão (ex.: SPN-LIFEBRA-SX) precisa ser listada
   * explicitamente.
   */
  excluir: readonly string[]
  /** Piso de preço: unidades abaixo deste valor não participam (0 = sem piso). */
  pisoItemDescontado: number
}

// Config única — editar aqui para go-live (flipar `ativa`, travar datas, e, se o
// Luccas decidir, listar SKUs de margem baixa em `excluir`).
export const PROMO_BF: ConfigPromoBF = {
  ativa:              true,  // ← GO do Luccas (23/11/2026): "vai começar hoje a Black Friday"
  percentual:         50,
  inicio:             '2026-11-23T00:00:00-03:00', // começa hoje (GO do Luccas 23/11)
  fim:                '2026-11-30T23:59:59-03:00',  // Cyber Monday (default — confirmar fim com Luccas)
  descricao:          '2ª unidade com 50% OFF — Black Friday',
  ressalva:           'exceto SX200 Prime',
  // 23/11/2026 (pedido do Luccas): SX200 Prime fora da promo da 2ª unidade
  // (único produto excluído). Lista sku E slug para cobrir desconto E badge
  // (feedId = sku ?? slug). As variações CLIM-SX200-PRIME-Branco/-Preto (que é o
  // que o carrinho guarda) caem pela regra do SKU-base — ver `excluido()`.
  excluir:            ['CLIM-SX200-PRIME', 'sx200-prime'],
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

/**
 * Um identificador (sku/slug/feedId/SKU de variação) está excluído da promo?
 * FONTE ÚNICA da exclusão para carrinho, drawer, checkout, selo e /api/pedidos.
 * Casa o id exato OU uma variação do excluído (`<excluído>-<sufixo>`): o cliente
 * só conhece o `feedId` do item, que para variação precificada é o SKU da
 * variação (CLIM-SX200-PRIME-Branco). Sem isto o carrinho mostrava o desconto
 * que o servidor não dá (24/11/2026). O hífen evita falso positivo de prefixo
 * (CLIM-SX200-PRIME não casa CLIM-SX200-PRIMEX).
 */
export function idExcluidoDaPromo(id: string | null | undefined): boolean {
  if (id == null) return false
  const alvo = id.trim()
  if (!alvo) return false
  return PROMO_BF.excluir.some((e) => alvo === e || alvo.startsWith(e + '-'))
}

function excluido(identificadores: Array<string | null | undefined>): boolean {
  if (PROMO_BF.excluir.length === 0) return false
  return identificadores.some(idExcluidoDaPromo)
}

/** Badge amigável para a PDP/vitrine quando a promo está ativa (ou null). */
export interface PromoBadge {
  descricao: string
  percentual: number
  fim: string | null
  ressalva: string | null
}

function badge(): PromoBadge {
  return { descricao: PROMO_BF.descricao, percentual: PROMO_BF.percentual, fim: PROMO_BF.fim, ressalva: PROMO_BF.ressalva }
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
 * (precoPromocional/variação). `sku`/`slug` (do produto) e `skuVariacao` (da
 * variação escolhida) são os ids usados na exclusão de margem.
 */
export function calcularPromoServidor(
  itens: Array<{
    erpProdutoId: string
    precoUnitario: number
    quantidade: number
    sku?: string | null
    slug?: string | null
    skuVariacao?: string | null
  }>,
  agora: Date = new Date(),
): ResultadoPromo {
  if (!promoAtiva(agora)) return { ativo: false, desconto: 0, unidadesComDesconto: 0, descricao: null }
  return aplicarGlobal(
    expandir(
      itens.map((i) => ({ preco: i.precoUnitario, quantidade: i.quantidade, ids: [i.sku, i.slug, i.skuVariacao] })),
    ),
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
