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

// ── Configuração dos Níveis
export const NIVEIS_CONFIG: Record<string, {
  cor: string; corSec: string; corSombra: string
  espessura: number; label: string; emoji: string
}> = {
  Bronze: {
    cor: '#cd7f32', corSec: '#fbbf24', corSombra: 'rgba(205,127,50,0.4)',
    espessura: 3, label: 'Bronze', emoji: '🥉',
  },
  Prata: {
    cor: '#94a3b8', corSec: '#e2e8f0', corSombra: 'rgba(148,163,184,0.4)',
    espessura: 3.5, label: 'Prata', emoji: '🥈',
  },
  Ouro: {
    cor: '#f59e0b', corSec: '#fde68a', corSombra: 'rgba(245,158,11,0.5)',
    espessura: 4, label: 'Ouro', emoji: '🥇',
  },
  Diamante: {
    cor: '#3b82f6', corSec: '#bfdbfe', corSombra: 'rgba(59,130,246,0.5)',
    espessura: 4.5, label: 'Diamante', emoji: '💎',
  },
  Black: {
    cor: '#ffd700', corSec: '#fffbeb', corSombra: 'rgba(255,215,0,0.6)',
    espessura: 5, label: 'Black', emoji: '⬛',
  },
}

export function calcularNivel(totalGasto: number): string {
  if (totalGasto >= 10000) return 'Black'
  if (totalGasto >= 5000)  return 'Diamante'
  if (totalGasto >= 2000)  return 'Ouro'
  if (totalGasto >= 500)   return 'Prata'
  return 'Bronze'
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
