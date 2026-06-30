// ─── Meta Pixel — helper de eventos (lado client) ────────────────────────────
// Espelha o padrão de src/lib/analytics/events.ts (GA4): um disparo central,
// com gate LGPD. Aqui o gate é a categoria 'marketing' (Pixel = publicidade).
//
// A base do Pixel (fbevents.js + init + PageView) é carregada no layout raiz por
// <MetaPixelScript/>. Este módulo só DISPARA eventos padrão da Meta nos mesmos
// pontos onde o GA4 já dispara — chamado de dentro de events.ts.

import { marketingConsentido } from '@/lib/consent'

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

type Fbq = ((...args: unknown[]) => void) & {
  queue?: unknown[]
  loaded?: boolean
  version?: string
}

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

// Garante value numérico em BRL (nunca Decimal/string) — exigência da Meta.
function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

/**
 * Dispara um evento padrão da Meta. No-op sem fbq (script ainda não montou) ou
 * sem consentimento de marketing. `options.eventID` vai como 4º arg do fbq —
 * essencial p/ DEDUPLICAR com o CAPI (fase 2): mesmo id no browser e no servidor.
 */
export function trackMeta(
  evento: string,
  params: Record<string, unknown> = {},
  options?: { eventID?: string },
) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  // LGPD: mesmo gate que concede/revoga o consentimento do Pixel.
  // (Plugue/remova este gate junto com o do GA4 se a política mudar.)
  if (!marketingConsentido()) return

  const limpo: Record<string, unknown> = { ...params }
  if ('value' in limpo) limpo.value = num(limpo.value)

  if (options?.eventID) {
    window.fbq('track', evento, limpo, { eventID: options.eventID })
  } else {
    window.fbq('track', evento, limpo)
  }
}

// PageView avulso (trocas de rota client-side). Mesmo gate do trackMeta.
export function trackMetaPageView() {
  trackMeta('PageView')
}

// ─── Advanced Matching (browser) ─────────────────────────────────────────────
// Enriquece o Pixel com dados do cliente conhecido para casar conversões. Os
// valores vão NORMALIZADOS porém SEM hash: a lib da Meta (fbevents.js) hasheia
// em/ph/fn/ln/ct/st/zp/external_id em SHA-256 no client antes de enviar. NUNCA
// hasheamos aqui (dobraria o hash). external_id usa o id do cliente — o MESMO
// valor sai no CAPI (hash server-side igual) para casar browser↔servidor.

function soDigitos(v?: string | null): string {
  return (v ?? '').replace(/\D/g, '')
}
// Texto: trim + lowercase (email, nome, cidade, country). A lib remove
// pontuação/acentos no hash; só garantimos minúsculo e sem espaços nas pontas.
function normTexto(v?: string | null): string | undefined {
  const t = (v ?? '').trim().toLowerCase()
  return t || undefined
}
// Telefone: só dígitos, com DDI 55 (Brasil) garantido.
function normTelefone(v?: string | null): string | undefined {
  const d = soDigitos(v)
  if (!d) return undefined
  return d.startsWith('55') ? d : `55${d}`
}
// UF: 2 letras minúsculas.
function normEstado(v?: string | null): string | undefined {
  const t = (v ?? '').trim().toLowerCase().slice(0, 2)
  return t || undefined
}
// CEP/zip: só dígitos.
function normCep(v?: string | null): string | undefined {
  const d = soDigitos(v)
  return d || undefined
}

export interface MetaAdvancedMatching {
  email?:      string | null
  telefone?:   string | null
  nome?:       string | null // nome completo → deriva fn/ln se não vierem
  firstName?:  string | null
  lastName?:   string | null
  cidade?:     string | null
  estado?:     string | null
  cep?:        string | null
  country?:    string | null
  externalId?: string | null
}

// Monta o objeto de advanced matching NORMALIZADO (sem hash) a partir de dados
// crus do cliente. Exportado para o CAPI reusar a MESMA normalização antes de
// hashear server-side. Só inclui campos presentes.
export function montarAdvancedMatching(dados: MetaAdvancedMatching): Record<string, string> {
  let fn = normTexto(dados.firstName)
  let ln = normTexto(dados.lastName)
  if ((!fn || !ln) && dados.nome) {
    const partes = dados.nome.trim().split(/\s+/).filter(Boolean)
    if (!fn) fn = normTexto(partes[0])
    if (!ln && partes.length > 1) ln = normTexto(partes[partes.length - 1])
  }

  const am: Record<string, string> = {}
  const em = normTexto(dados.email)
  if (em) am.em = em
  const ph = normTelefone(dados.telefone)
  if (ph) am.ph = ph
  if (fn) am.fn = fn
  if (ln) am.ln = ln
  const ct = normTexto(dados.cidade)
  if (ct) am.ct = ct
  const st = normEstado(dados.estado)
  if (st) am.st = st
  const zp = normCep(dados.cep)
  if (zp) am.zp = zp
  const country = normTexto(dados.country)
  if (country) am.country = country
  const externalId = (dados.externalId ?? '').trim()
  if (externalId) am.external_id = externalId
  return am
}

// Re-inicializa o Pixel com advanced matching. Re-chamar fbq('init', MESMA_ID,
// {...}) só ATUALIZA a config de matching — NÃO re-dispara PageView (confirmado:
// o PageView só sai em fbq('track','PageView')). No-op sem fbq, sem PIXEL_ID, ou
// sem consentimento de marketing (LGPD: não enviar PII sem opt-in).
export function initMetaAdvancedMatching(dados: MetaAdvancedMatching): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  if (!META_PIXEL_ID) return
  if (!marketingConsentido()) return

  const am = montarAdvancedMatching(dados)
  if (Object.keys(am).length === 0) return

  window.fbq('init', META_PIXEL_ID, am)
}
