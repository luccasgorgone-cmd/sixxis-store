// ════════════════════════════════════════════════════════════
// SIXXIS — SISTEMA DE AVATARES + NÍVEIS DE FIDELIDADE
// O avatar da Luna é EXCLUSIVO (<LunaAvatar />) e NÃO aparece aqui.
// ════════════════════════════════════════════════════════════

const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/micah/svg'
const MK = '&mouth=smile&scale=88'

// ── 16 AVATARES — 50% masculinos, 50% femininos, diversidade real
export const AVATARES_PREDEFINIDOS: Array<{
  id: string; label: string; url: string; bgColor: string
}> = [
  { id: 'sx-m01', label: 'Carlos',  url: `${DICEBEAR_BASE}?seed=SixxisManA1&backgroundColor=0f2e2b${MK}`,  bgColor: '#0f2e2b' },
  { id: 'sx-f01', label: 'Ana',     url: `${DICEBEAR_BASE}?seed=SixxisFemA1&backgroundColor=1a4f4a${MK}`,  bgColor: '#1a4f4a' },
  { id: 'sx-m02', label: 'Pedro',   url: `${DICEBEAR_BASE}?seed=SixxisManB2&backgroundColor=1e1b4b${MK}`,  bgColor: '#1e1b4b' },
  { id: 'sx-f02', label: 'Maria',   url: `${DICEBEAR_BASE}?seed=SixxisFemB2&backgroundColor=7c2d12${MK}`,  bgColor: '#7c2d12' },
  { id: 'sx-m03', label: 'João',    url: `${DICEBEAR_BASE}?seed=SixxisManC3&backgroundColor=78350f${MK}`,  bgColor: '#78350f' },
  { id: 'sx-f03', label: 'Julia',   url: `${DICEBEAR_BASE}?seed=SixxisFemC3&backgroundColor=14532d${MK}`,  bgColor: '#14532d' },
  { id: 'sx-m04', label: 'Lucas',   url: `${DICEBEAR_BASE}?seed=SixxisManD4&backgroundColor=0c4a6e${MK}`,  bgColor: '#0c4a6e' },
  { id: 'sx-f04', label: 'Sara',    url: `${DICEBEAR_BASE}?seed=SixxisFemD4&backgroundColor=2e1065${MK}`,  bgColor: '#2e1065' },
  { id: 'sx-n01', label: 'Davi',    url: `${DICEBEAR_BASE}?seed=SixxisNeutA1&backgroundColor=162032${MK}`, bgColor: '#162032' },
  { id: 'sx-n02', label: 'Tais',    url: `${DICEBEAR_BASE}?seed=SixxisNeutB2&backgroundColor=44403c${MK}`, bgColor: '#44403c' },
  { id: 'sx-n03', label: 'Bruno',   url: `${DICEBEAR_BASE}?seed=SixxisNeutC3&backgroundColor=083344${MK}`, bgColor: '#083344' },
  { id: 'sx-n04', label: 'Lara',    url: `${DICEBEAR_BASE}?seed=SixxisNeutD4&backgroundColor=1c1917${MK}`, bgColor: '#1c1917' },
  { id: 'sx-p01', label: 'Rafael',  url: `${DICEBEAR_BASE}?seed=SixxisPremA1&backgroundColor=0a1628${MK}`, bgColor: '#0a1628' },
  { id: 'sx-p02', label: 'Clara',   url: `${DICEBEAR_BASE}?seed=SixxisPremB2&backgroundColor=92400e${MK}`, bgColor: '#92400e' },
  { id: 'sx-p03', label: 'Miguel',  url: `${DICEBEAR_BASE}?seed=SixxisPremC3&backgroundColor=0d3b44${MK}`, bgColor: '#0d3b44' },
  { id: 'sx-p04', label: 'Bia',     url: `${DICEBEAR_BASE}?seed=SixxisPremD4&backgroundColor=1e293b${MK}`, bgColor: '#1e293b' },
]

export const AVATAR_INICIAL = {
  id: 'inicial',
  label: 'Inicial do Nome',
  url: null as string | null,
  bgColor: '#0f2e2b',
}

export const TODOS_AVATARES = [AVATAR_INICIAL, ...AVATARES_PREDEFINIDOS]

// ── Configuração dos Níveis — 5 gemas com svgIcon + corBanner
export const NIVEIS_CONFIG: Record<string, {
  cor: string; corSec: string; corSombra: string; corTexto: string; bg: string
  corBanner: string
  espessura: number; label: string; emoji: string
  svgIcon: (s?: number) => string
  cashbackPct: number; minGasto: number; maxGasto: number; proximoNivel: string | null
}> = {
  Cristal: {
    cor: '#22d3ee', corSec: '#a5f3fc', corSombra: 'rgba(34,211,238,0.55)',
    corTexto: '#0c4a6e', bg: '#f0f9ff',
    corBanner: 'linear-gradient(135deg, #083344 0%, #0e7490 45%, #06b6d4 75%, #67e8f9 100%)',
    espessura: 3, label: 'Cristal', emoji: '🔷',
    svgIcon: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><path d="M16 1L31 9.5V22.5L16 31L1 22.5V9.5L16 1Z" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.88)" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 6L26 12V20L16 26L6 20V12L16 6Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.38)" stroke-width="0.8"/><circle cx="16" cy="16" r="2.8" fill="rgba(255,255,255,0.92)"/></svg>`,
    cashbackPct: 0.02, minGasto: 0, maxGasto: 999, proximoNivel: 'Topázio',
  },
  Topázio: {
    cor: '#f97316', corSec: '#fed7aa', corSombra: 'rgba(249,115,22,0.55)',
    corTexto: '#78350f', bg: '#fffbeb',
    corBanner: 'linear-gradient(135deg, #431407 0%, #9a3412 40%, #ea580c 70%, #fb923c 100%)',
    espessura: 3.5, label: 'Topázio', emoji: '🔶',
    svgIcon: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><path d="M16 2L29 10V22L16 30L3 22V10L16 2Z" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.82)" stroke-width="1.5"/><path d="M16 2L3 10L16 16L29 10L16 2Z" fill="rgba(255,255,255,0.20)"/><circle cx="16" cy="16" r="3.2" fill="rgba(255,255,255,0.88)"/></svg>`,
    cashbackPct: 0.03, minGasto: 1000, maxGasto: 2999, proximoNivel: 'Safira',
  },
  Safira: {
    cor: '#3b82f6', corSec: '#bfdbfe', corSombra: 'rgba(59,130,246,0.55)',
    corTexto: '#1e3a8a', bg: '#eff6ff',
    corBanner: 'linear-gradient(135deg, #0c1445 0%, #1e3a8a 40%, #2563eb 70%, #93c5fd 100%)',
    espessura: 4, label: 'Safira', emoji: '💠',
    svgIcon: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><path d="M16 2L30 10.5L26 30H6L2 10.5L16 2Z" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.82)" stroke-width="1.5" stroke-linejoin="round"/><path d="M2 10.5H30M16 2L9 10.5M16 2L23 10.5" stroke="rgba(255,255,255,0.45)" stroke-width="1"/><path d="M13 7L16 2L19 7H13Z" fill="rgba(255,255,255,0.65)"/></svg>`,
    cashbackPct: 0.04, minGasto: 3000, maxGasto: 7999, proximoNivel: 'Diamante',
  },
  Diamante: {
    cor: '#a855f7', corSec: '#e9d5ff', corSombra: 'rgba(168,85,247,0.55)',
    corTexto: '#3730a3', bg: '#eef2ff',
    corBanner: 'linear-gradient(135deg, #2e1065 0%, #6b21a8 38%, #9333ea 68%, #d8b4fe 100%)',
    espessura: 4.5, label: 'Diamante', emoji: '💎',
    svgIcon: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><path d="M8 2H24L31 12L16 30L1 12L8 2Z" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.82)" stroke-width="1.5" stroke-linejoin="round"/><path d="M1 12H31M8 2L14 12M24 2L18 12M14 12L16 30M18 12L16 30" stroke="rgba(255,255,255,0.35)" stroke-width="1"/><path d="M11 7H21L24 12H8L11 7Z" fill="rgba(255,255,255,0.28)"/></svg>`,
    cashbackPct: 0.05, minGasto: 8000, maxGasto: 14999, proximoNivel: 'Esmeralda',
  },
  Esmeralda: {
    cor: '#10b981', corSec: '#a7f3d0', corSombra: 'rgba(16,185,129,0.55)',
    corTexto: '#064e3b', bg: '#ecfdf5',
    corBanner: 'linear-gradient(135deg, #022c22 0%, #065f46 38%, #059669 65%, #6ee7b7 100%)',
    espessura: 5, label: 'Esmeralda', emoji: '💚',
    svgIcon: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><path d="M16 1L31 9.5V22.5L16 31L1 22.5V9.5L16 1Z" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.88)" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 5L27 11V21L16 27L5 21V11L16 5Z" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.38)" stroke-width="0.8"/><circle cx="16" cy="16" r="2.5" fill="rgba(255,255,255,0.92)"/><path d="M16 11L17.8 15H22L18.5 17.5L20 22L16 19.5L12 22L13.5 17.5L10 15H14.2L16 11Z" fill="rgba(255,255,255,0.28)" stroke="rgba(255,255,255,0.55)" stroke-width="0.5"/></svg>`,
    cashbackPct: 0.07, minGasto: 15000, maxGasto: Infinity, proximoNivel: null,
  },
}

export const ORDEM_NIVEIS_GEM = ['Cristal', 'Topázio', 'Safira', 'Diamante', 'Esmeralda'] as const

export function getNivelSVGString(nivel: string, size = 20): string {
  return NIVEIS_CONFIG[nivel]?.svgIcon(size) || NIVEIS_CONFIG.Cristal.svgIcon(size)
}

export function calcularNivel(totalGasto: number): string {
  if (totalGasto >= 15000) return 'Esmeralda'
  if (totalGasto >= 8000)  return 'Diamante'
  if (totalGasto >= 3000)  return 'Safira'
  if (totalGasto >= 1000)  return 'Topázio'
  return 'Cristal'
}

export function normalizarNivel(n: string): string {
  if (NIVEIS_CONFIG[n]) return n
  const mapa: Record<string, string> = {
    Bronze: 'Cristal', Prata: 'Topázio', Ouro: 'Safira',
    Diamante: 'Diamante', Black: 'Esmeralda',
  }
  return mapa[n] || 'Cristal'
}

export function calcularNivelCompleto(totalGasto: number) {
  const nome = calcularNivel(totalGasto)
  const cfg = NIVEIS_CONFIG[nome]
  const faltam = cfg.proximoNivel
    ? Math.max(0, NIVEIS_CONFIG[cfg.proximoNivel].minGasto - totalGasto)
    : 0
  const progressoPercent = cfg.proximoNivel
    ? Math.min(100, Math.round(((totalGasto - cfg.minGasto) / (NIVEIS_CONFIG[cfg.proximoNivel].minGasto - cfg.minGasto)) * 100))
    : 100
  return {
    atual: nome, proximoNivel: cfg.proximoNivel, progressoPercent, faltam,
    cor: cfg.cor, corSec: cfg.corSec, corTexto: cfg.corTexto, bg: cfg.bg,
    cashbackPct: cfg.cashbackPct, minGasto: cfg.minGasto, maxGasto: cfg.maxGasto,
  }
}

export function getAvatarUrl(avatarId: string): string | null {
  if (!avatarId || avatarId === 'inicial') return null
  return AVATARES_PREDEFINIDOS.find(a => a.id === avatarId)?.url || null
}

export function getAvatarBgColor(avatarId: string, nome?: string): string {
  if (!avatarId || avatarId === 'inicial') {
    return nome ? getInitialBgColor(nome) : '#0f2e2b'
  }
  return AVATARES_PREDEFINIDOS.find(a => a.id === avatarId)?.bgColor || '#0f2e2b'
}

const CORES_INICIAL = [
  '#0f2e2b', '#1a4f4a', '#162032', '#1e1b4b',
  '#2d1b69', '#0a1628', '#78350f', '#7c2d12',
  '#44403c', '#14532d', '#0c4a6e', '#1c1917',
]

export function getInitialBgColor(nome: string): string {
  let hash = 0
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CORES_INICIAL[Math.abs(hash) % CORES_INICIAL.length]
}
