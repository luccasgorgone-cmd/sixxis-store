// Utilitários SERVER-SIDE do Tráfego Bruto (Fase 4C). Importado só pelo route
// handler Node (/api/trafego/coletar) e pelo read admin — NUNCA pelo proxy
// (que deve ficar leve e não depender de módulos compartilhados).

import crypto from 'crypto'

// Leitura fail-closed de segredos do Tráfego Bruto. Sem fallback literal
// commitado (os antigos defaults públicos foram removidos). Em produção, se a
// env var não estiver definida, lança — nunca roda com um segredo público
// conhecido. Em dev, gera um valor efêmero por processo só pra não travar o
// ambiente local (nunca é um literal commitado). Resolvido de forma preguiçosa
// (em tempo de request), não no topo do módulo, para não quebrar o `next build`.
const _efemeroDev: Partial<Record<string, string>> = {}
function lerSegredoTrafego(nome: 'TRAFEGO_INTERNAL_SECRET' | 'TRAFEGO_SALT'): string {
  const v = process.env[nome]
  if (v) return v
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`[trafego] ${nome} é obrigatória em produção (fail-closed).`)
  }
  if (!_efemeroDev[nome]) {
    console.warn(`[trafego] ${nome} não definida — usando valor efêmero de dev (nunca use em produção).`)
    _efemeroDev[nome] = `dev-ephemeral-${crypto.randomBytes(16).toString('hex')}`
  }
  return _efemeroDev[nome]!
}

// Secret simples compartilhado proxy↔coletor: impede que terceiros inflem a
// métrica chamando o endpoint direto.
export function getTrafegoSecret(): string {
  return lerSegredoTrafego('TRAFEGO_INTERNAL_SECRET')
}

// SALT do hash de visitante. Mantém o visitorHash irreversível mesmo conhecendo
// IP+UA (o espaço é pequeno). Obrigatório via env em produção.
export function getTrafegoSalt(): string {
  return lerSegredoTrafego('TRAFEGO_SALT')
}

// Bots óbvios — descartados antes de gravar. Lista pragmática (não exaustiva).
const BOT_RE = /bot|crawl|spider|slurp|mediapartners|adsbot|bingpreview|facebookexternalhit|whatsapp|telegram|discord|slackbot|headless|phantom|puppeteer|playwright|lighthouse|gtmetrix|pingdom|uptime|monitor|statuscake|python-requests|python-urllib|go-http|java\/|okhttp|curl|wget|axios|node-fetch|httpclient|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|yandex|baiduspider|duckduckbot|applebot|amazonbot|gptbot|claudebot|ccbot|perplexity/i

export function isBot(ua: string): boolean {
  if (!ua) return true // sem UA = quase sempre robô/healthcheck
  return BOT_RE.test(ua)
}

export function parseDispositivo(ua: string): string {
  const s = ua.toLowerCase()
  if (/ipad|tablet|kindle|playbook|silk/.test(s)) return 'tablet'
  if (/mobi|android.*mobile|iphone|ipod|windows phone/.test(s)) return 'mobile'
  if (/android/.test(s)) return 'mobile'
  return 'desktop'
}

export function parseBrowser(ua: string): string {
  if (/edg(e|a|ios)?\//i.test(ua)) return 'Edge'
  if (/opr\/|opera/i.test(ua)) return 'Opera'
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet'
  if (/firefox|fxios/i.test(ua)) return 'Firefox'
  if (/chrome|crios|chromium/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  return 'Outro'
}

export function parseOs(ua: string): string {
  if (/windows nt/i.test(ua)) return 'Windows'
  if (/iphone|ipad|ipod|ios/i.test(ua)) return 'iOS'
  if (/mac os x|macintosh/i.test(ua)) return 'macOS'
  if (/android/i.test(ua)) return 'Android'
  if (/linux/i.test(ua)) return 'Linux'
  if (/cros/i.test(ua)) return 'ChromeOS'
  return 'Outro'
}

// dia (YYYY-MM-DD) e hora (0-23) no fuso BRT — mesma régua do resto do analytics.
export function diaHoraBRT(d: Date): { dia: string; hora: number } {
  const dia = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false,
  }).formatToParts(d)
  const horaStr = parts.find((p) => p.type === 'hour')?.value ?? '0'
  const hora = Number(horaStr) % 24 // '24' à meia-noite em alguns ICU → 0
  return { dia, hora }
}

// Host da origem externa do referrer (sem query, sem path). Referrer interno
// (mesmo host do site) vira null — só interessa origem de fora.
export function refHost(referrer: string | null | undefined, selfHost: string | null): string | null {
  if (!referrer) return null
  try {
    const h = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase()
    if (!h) return null
    const self = (selfHost || '').replace(/^www\./, '').toLowerCase()
    if (self && h === self) return null
    return h.slice(0, 255)
  } catch {
    return null
  }
}
