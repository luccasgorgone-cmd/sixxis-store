// ════════════════════════════════════════════════════════════
// SIXXIS — SISTEMA DE AVATARES ILUSTRADOS
// Powered by DiceBear Micah (api.dicebear.com/9.x/micah)
// ════════════════════════════════════════════════════════════

const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/micah/svg'

// ── 16 AVATARES PREDEFINIDOS
export const AVATARES_PREDEFINIDOS: Array<{
  id: string
  label: string
  url: string
  bgColor: string
}> = [
  // ── ROW 1: Tons escuros (Sixxis identity)
  { id: 'sixxis-explorer', label: 'Explorador', url: `${DICEBEAR_BASE}?seed=SixxisExplorer&backgroundColor=0f2e2b`, bgColor: '#0f2e2b' },
  { id: 'sixxis-scholar',  label: 'Estudioso',  url: `${DICEBEAR_BASE}?seed=SixxisScholar&backgroundColor=1a4f4a`,  bgColor: '#1a4f4a' },
  { id: 'sixxis-creative', label: 'Criativo',   url: `${DICEBEAR_BASE}?seed=SixxisCreative&backgroundColor=0d3b44`, bgColor: '#0d3b44' },
  { id: 'sixxis-pro',      label: 'Profissional',url: `${DICEBEAR_BASE}?seed=SixxisPro&backgroundColor=162032`,     bgColor: '#162032' },

  // ── ROW 2: Azuis e violetas
  { id: 'sixxis-dreamer', label: 'Sonhador',   url: `${DICEBEAR_BASE}?seed=SixxisDreamer&backgroundColor=1e1b4b`, bgColor: '#1e1b4b' },
  { id: 'sixxis-mystic',  label: 'Místico',    url: `${DICEBEAR_BASE}?seed=SixxisMystic&backgroundColor=2d1b69`,  bgColor: '#2d1b69' },
  { id: 'sixxis-cosmic',  label: 'Cósmico',    url: `${DICEBEAR_BASE}?seed=SixxisCosmic&backgroundColor=0a1628`,  bgColor: '#0a1628' },
  { id: 'sixxis-nova',    label: 'Nova',        url: `${DICEBEAR_BASE}?seed=SixxisNova&backgroundColor=0f172a`,    bgColor: '#0f172a' },

  // ── ROW 3: Quentes e terrosos
  { id: 'sixxis-solar',  label: 'Solar',   url: `${DICEBEAR_BASE}?seed=SixxisSolar&backgroundColor=78350f`,  bgColor: '#78350f' },
  { id: 'sixxis-ember',  label: 'Brasa',   url: `${DICEBEAR_BASE}?seed=SixxisEmber&backgroundColor=7c2d12`,  bgColor: '#7c2d12' },
  { id: 'sixxis-earth',  label: 'Terra',   url: `${DICEBEAR_BASE}?seed=SixxisEarth&backgroundColor=44403c`,  bgColor: '#44403c' },
  { id: 'sixxis-amber',  label: 'Âmbar',   url: `${DICEBEAR_BASE}?seed=SixxisAmber&backgroundColor=92400e`,  bgColor: '#92400e' },

  // ── ROW 4: Escuros premium
  { id: 'sixxis-onyx',   label: 'Ônix',        url: `${DICEBEAR_BASE}?seed=SixxisOnyx&backgroundColor=1c1917`,   bgColor: '#1c1917' },
  { id: 'sixxis-storm',  label: 'Tempestade',   url: `${DICEBEAR_BASE}?seed=SixxisStorm&backgroundColor=1e293b`,  bgColor: '#1e293b' },
  { id: 'sixxis-forest', label: 'Floresta',     url: `${DICEBEAR_BASE}?seed=SixxisForest&backgroundColor=14532d`, bgColor: '#14532d' },
  { id: 'sixxis-ocean',  label: 'Oceano',       url: `${DICEBEAR_BASE}?seed=SixxisOcean&backgroundColor=0c4a6e`,  bgColor: '#0c4a6e' },
]

// Avatar padrão (inicial do nome)
export const AVATAR_INICIAL = {
  id: 'inicial',
  label: 'Inicial do Nome',
  url: null as null,
  bgColor: '#0f2e2b',
}

// ── TODOS os avatares (inicial primeiro, depois os 16)
export const TODOS_AVATARES = [AVATAR_INICIAL, ...AVATARES_PREDEFINIDOS]

// ── Configuração dos Níveis — 5 gemas
export const NIVEIS_CONFIG: Record<string, {
  cor: string; corSec: string; corSombra: string; corTexto: string; bg: string
  espessura: number; label: string; emoji: string
  cashbackPct: number; minGasto: number; maxGasto: number; proximoNivel: string | null
}> = {
  Cristal: {
    cor: '#38bdf8', corSec: '#bae6fd', corSombra: 'rgba(56,189,248,0.4)',
    corTexto: '#0c4a6e', bg: '#f0f9ff',
    espessura: 3, label: 'Cristal', emoji: '🔷',
    cashbackPct: 0.02, minGasto: 0, maxGasto: 999, proximoNivel: 'Topázio',
  },
  Topázio: {
    cor: '#f59e0b', corSec: '#fde68a', corSombra: 'rgba(245,158,11,0.45)',
    corTexto: '#78350f', bg: '#fffbeb',
    espessura: 3.5, label: 'Topázio', emoji: '🟡',
    cashbackPct: 0.03, minGasto: 1000, maxGasto: 2999, proximoNivel: 'Safira',
  },
  Safira: {
    cor: '#2563eb', corSec: '#bfdbfe', corSombra: 'rgba(37,99,235,0.5)',
    corTexto: '#1e3a8a', bg: '#eff6ff',
    espessura: 4, label: 'Safira', emoji: '💙',
    cashbackPct: 0.04, minGasto: 3000, maxGasto: 7999, proximoNivel: 'Diamante',
  },
  Diamante: {
    cor: '#818cf8', corSec: '#e0e7ff', corSombra: 'rgba(129,140,248,0.55)',
    corTexto: '#3730a3', bg: '#eef2ff',
    espessura: 4.5, label: 'Diamante', emoji: '💎',
    cashbackPct: 0.05, minGasto: 8000, maxGasto: 14999, proximoNivel: 'Esmeralda',
  },
  Esmeralda: {
    cor: '#10b981', corSec: '#a7f3d0', corSombra: 'rgba(16,185,129,0.6)',
    corTexto: '#064e3b', bg: '#ecfdf5',
    espessura: 5, label: 'Esmeralda', emoji: '💚',
    cashbackPct: 0.07, minGasto: 15000, maxGasto: Infinity, proximoNivel: null,
  },
}

export const ORDEM_NIVEIS_GEM = ['Cristal', 'Topázio', 'Safira', 'Diamante', 'Esmeralda'] as const

export function calcularNivel(totalGasto: number): string {
  if (totalGasto >= 15000) return 'Esmeralda'
  if (totalGasto >= 8000)  return 'Diamante'
  if (totalGasto >= 3000)  return 'Safira'
  if (totalGasto >= 1000)  return 'Topázio'
  return 'Cristal'
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
    atual: nome,
    proximoNivel: cfg.proximoNivel,
    progressoPercent,
    faltam,
    cor: cfg.cor,
    corSec: cfg.corSec,
    corTexto: cfg.corTexto,
    bg: cfg.bg,
    cashbackPct: cfg.cashbackPct,
    minGasto: cfg.minGasto,
    maxGasto: cfg.maxGasto,
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

// ── Cores de background para avatares de inicial (variadas por nome)
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
