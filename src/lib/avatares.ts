// ════════════════════════════════════════════════════════════
// SIXXIS — SISTEMA DE AVATARES 3D CLAY
// Avatares SVG inline renderizados via <UserAvatar3D />
// O avatar da Luna é EXCLUSIVO (<LunaAvatar />) e NÃO aparece aqui.
// ════════════════════════════════════════════════════════════

import type { UserAvatarConfig } from '@/components/ui/UserAvatar3D'

export const AVATARES_PREDEFINIDOS_CONFIG: UserAvatarConfig[] = [
  // ─── ROW 1: verde Sixxis ───
  { id: 'sx-v01', label: 'Aurora',    skinTone: 'light',        hairColor: 'brown',      hairStyle: 'bob',            shirtColor: '#0f2e2b', shirtAccent: '#0a1f1d', bgColor: '#1a5a52', bgColor2: '#0a2820' },
  { id: 'sx-v02', label: 'Clara',     skinTone: 'medium-light', hairColor: 'black',      hairStyle: 'short-straight', shirtColor: '#1a3a38', shirtAccent: '#0f2520', bgColor: '#0f3d35', bgColor2: '#071f1a' },
  { id: 'sx-v03', label: 'Sofia',     skinTone: 'light',        hairColor: 'blonde',     hairStyle: 'ponytail',       shirtColor: '#0a2820', shirtAccent: '#061510', bgColor: '#164d45', bgColor2: '#08281f' },
  { id: 'sx-v04', label: 'Natalia',   skinTone: 'medium',       hairColor: 'dark-brown', hairStyle: 'bun',            shirtColor: '#0d3330', shirtAccent: '#071e1c', bgColor: '#0f4a40', bgColor2: '#062518' },
  // ─── ROW 2: azul / índigo ───
  { id: 'sx-a01', label: 'Marina',    skinTone: 'medium',       hairColor: 'black',      hairStyle: 'long-straight',  shirtColor: '#1e1b4b', shirtAccent: '#0c0a2a', bgColor: '#22205a', bgColor2: '#0c0a2e' },
  { id: 'sx-a02', label: 'Valentina', skinTone: 'medium-light', hairColor: 'auburn',     hairStyle: 'bob',            shirtColor: '#0c4a6e', shirtAccent: '#072d42', bgColor: '#0e5278', bgColor2: '#07304a' },
  { id: 'sx-a03', label: 'Beatriz',   skinTone: 'light',        hairColor: 'black',      hairStyle: 'curly-short',    shirtColor: '#0a1628', shirtAccent: '#060e18', bgColor: '#0e1e38', bgColor2: '#060e1e' },
  { id: 'sx-a04', label: 'Helena',    skinTone: 'medium',       hairColor: 'dark-brown', hairStyle: 'ponytail',       shirtColor: '#0f172a', shirtAccent: '#070d18', bgColor: '#141c38', bgColor2: '#080d20' },
  // ─── ROW 3: quentes ───
  { id: 'sx-q01', label: 'Juliana',   skinTone: 'medium-dark',  hairColor: 'black',      hairStyle: 'short-straight', shirtColor: '#78350f', shirtAccent: '#4a1f05', bgColor: '#8a3d10', bgColor2: '#4a1e05' },
  { id: 'sx-q02', label: 'Fernanda',  skinTone: 'dark',         hairColor: 'black',      hairStyle: 'curly-short',    shirtColor: '#7c2d12', shirtAccent: '#4a1808', bgColor: '#8f3215', bgColor2: '#4a1a08' },
  { id: 'sx-q03', label: 'Camila',    skinTone: 'medium-dark',  hairColor: 'dark-brown', hairStyle: 'bun',            shirtColor: '#92400e', shirtAccent: '#5a2808', bgColor: '#9a4510', bgColor2: '#5a2808' },
  { id: 'sx-q04', label: 'Isabella',  skinTone: 'medium',       hairColor: 'auburn',     hairStyle: 'long-straight',  shirtColor: '#44403c', shirtAccent: '#282420', bgColor: '#4e4a44', bgColor2: '#28241e' },
  // ─── ROW 4: premium escuro ───
  { id: 'sx-p01', label: 'Gabriela',  skinTone: 'dark',         hairColor: 'black',      hairStyle: 'bob',            shirtColor: '#1c1917', shirtAccent: '#100e0c', bgColor: '#242019', bgColor2: '#100e0a' },
  { id: 'sx-p02', label: 'Mariana',   skinTone: 'medium-light', hairColor: 'black',      hairStyle: 'short-straight', shirtColor: '#1e293b', shirtAccent: '#0f1826', bgColor: '#253048', bgColor2: '#10182a' },
  { id: 'sx-p03', label: 'Larissa',   skinTone: 'medium',       hairColor: 'brown',      hairStyle: 'ponytail',       shirtColor: '#14532d', shirtAccent: '#08301a', bgColor: '#185e34', bgColor2: '#0a3018' },
  { id: 'sx-p04', label: 'Patricia',  skinTone: 'medium-dark',  hairColor: 'dark-brown', hairStyle: 'curly-short',    shirtColor: '#083344', shirtAccent: '#041c28', bgColor: '#0a3d52', bgColor2: '#041e2c' },
]

export function isAvatar3D(id: string): boolean {
  return !!id && id.startsWith('sx-')
}

export function getAvatarConfig(id: string): UserAvatarConfig | null {
  return AVATARES_PREDEFINIDOS_CONFIG.find(c => c.id === id) || null
}

// ── 16 AVATARES PREDEFINIDOS (formato legado, mapeado dos 3D configs)
export const AVATARES_PREDEFINIDOS: Array<{
  id: string
  label: string
  url: string | null
  bgColor: string
}> = AVATARES_PREDEFINIDOS_CONFIG.map(c => ({
  id: c.id,
  label: c.label,
  url: null,
  bgColor: c.bgColor,
}))

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
