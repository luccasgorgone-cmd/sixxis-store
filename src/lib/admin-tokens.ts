// Admin design tokens — single source of truth for the admin UI

export const A = {
  // Brand
  tiffany:     '#3cbfb3',
  tiffanyDark: '#2a9d8f',
  deepGreen:   '#0f2e2b',
  midGreen:    '#1a4f4a',

  // Sidebar
  sidebarBg:         '#0f2e2b',
  sidebarActiveBg:   'rgba(60,191,179,0.15)',
  sidebarActiveText: '#3cbfb3',
  sidebarText:       'rgba(255,255,255,0.6)',
  sidebarLabel:      'rgba(255,255,255,0.28)',
  sidebarBorder:     'rgba(255,255,255,0.08)',
  sidebarIconBg:     'rgba(255,255,255,0.06)',
  sidebarIconActive: 'rgba(60,191,179,0.22)',

  // Status badges
  status: {
    pendente: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400' },
    pago:     { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-400' },
    enviado:  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-400' },
    entregue: { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-400' },
    cancelado:{ bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-400' },
  },

  // Category badges
  categoria: {
    climatizadores: { bg: 'bg-blue-50',   text: 'text-blue-700' },
    aspiradores:    { bg: 'bg-violet-50', text: 'text-violet-700' },
    spinning:       { bg: 'bg-orange-50', text: 'text-orange-700' },
    _default:       { bg: 'bg-gray-100',  text: 'text-gray-600' },
  },

  // Fidelidade levels
  nivel: {
    bronze:   { label: 'Bronze',   min: 0,    max: 99,   bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500' },
    prata:    { label: 'Prata',    min: 100,  max: 499,  bg: 'bg-slate-50',   text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-400' },
    ouro:     { label: 'Ouro',     min: 500,  max: 1999, bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
    diamante: { label: 'Diamante', min: 2000, max: Infinity, bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200',   dot: 'bg-cyan-500' },
  },
} as const

export function getNivel(pontos: number) {
  if (pontos >= 2000) return A.nivel.diamante
  if (pontos >= 500)  return A.nivel.ouro
  if (pontos >= 100)  return A.nivel.prata
  return A.nivel.bronze
}

export function getCategoriaBadge(cat: string) {
  return A.categoria[cat as keyof typeof A.categoria] ?? A.categoria._default
}
