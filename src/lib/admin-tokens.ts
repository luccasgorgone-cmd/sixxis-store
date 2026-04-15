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
    cristal:   { label: 'Cristal',   min: 0,     max: 999,   bg: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-200',    dot: 'bg-sky-400' },
    topazio:   { label: 'Topázio',   min: 1000,  max: 2999,  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500' },
    safira:    { label: 'Safira',    min: 3000,  max: 7999,  bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500' },
    diamante:  { label: 'Diamante',  min: 8000,  max: 14999, bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
    esmeralda: { label: 'Esmeralda', min: 15000, max: Infinity, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  },
} as const

export function getNivel(gasto: number) {
  if (gasto >= 15000) return A.nivel.esmeralda
  if (gasto >= 8000)  return A.nivel.diamante
  if (gasto >= 3000)  return A.nivel.safira
  if (gasto >= 1000)  return A.nivel.topazio
  return A.nivel.cristal
}

export function getCategoriaBadge(cat: string) {
  return A.categoria[cat as keyof typeof A.categoria] ?? A.categoria._default
}
