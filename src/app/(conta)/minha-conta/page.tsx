'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import LayoutConta from '@/components/conta/LayoutConta'
import {
  ShoppingBag, Gift, TrendingUp, ChevronRight,
  Package, Star, Zap, Clock, CheckCircle, Truck,
} from 'lucide-react'
import { IconeNivel } from '@/components/ui/NivelIcons'
import { NIVEIS_CONFIG, ORDEM_NIVEIS_GEM } from '@/lib/avatares'

function formatValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Padrões geométricos SVG por gema ─────────────────────────────────────────
const BANNER_POR_NIVEL: Record<string, { pattern: string; gradient: string }> = {
  Cristal: {
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 60%, #38bdf8 100%)',
    pattern: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><polygon points='20,2 38,11 38,29 20,38 2,29 2,11' fill='none' stroke='white' stroke-width='0.5' opacity='0.12'/></svg>`,
  },
  Topázio: {
    gradient: 'linear-gradient(135deg, #78350f 0%, #d97706 55%, #fbbf24 100%)',
    pattern: `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='40'><ellipse cx='16' cy='20' rx='12' ry='16' fill='none' stroke='white' stroke-width='0.5' opacity='0.12'/></svg>`,
  },
  Safira: {
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #60a5fa 100%)',
    pattern: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><polygon points='20,2 38,12 32,32 8,32 2,12' fill='none' stroke='white' stroke-width='0.5' opacity='0.12'/></svg>`,
  },
  Diamante: {
    gradient: 'linear-gradient(135deg, #3730a3 0%, #818cf8 55%, #e0e7ff 100%)',
    pattern: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='20' cy='20' r='16' fill='none' stroke='white' stroke-width='0.5' opacity='0.12'/><polygon points='20,4 36,20 20,36 4,20' fill='none' stroke='white' stroke-width='0.4' opacity='0.1'/></svg>`,
  },
  Esmeralda: {
    gradient: 'linear-gradient(135deg, #064e3b 0%, #10b981 55%, #6ee7b7 100%)',
    pattern: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><polygon points='8,2 32,2 38,8 38,32 32,38 8,38 2,32 2,8' fill='none' stroke='white' stroke-width='0.5' opacity='0.12'/></svg>`,
  },
}

const VANTAGENS_NIVEL: Record<string, string[]> = {
  Cristal:   ['2% cashback em compras', 'Acesso ao extrato completo', 'Cupom de boas-vindas SIXXIS10'],
  Topázio:   ['3% cashback em compras', 'Frete grátis acima de R$300', 'Acesso antecipado a ofertas', 'Suporte prioritário'],
  Safira:    ['4% cashback em compras', 'Frete grátis a partir de R$200', 'Desconto exclusivo 5%', 'Atendimento VIP', 'Brindes surpresa'],
  Diamante:  ['5% cashback em compras', 'Frete grátis em qualquer pedido', 'Desconto 8% exclusivo', 'Gerente dedicado', 'Acesso a lançamentos'],
  Esmeralda: ['7% cashback em compras', 'Frete sempre grátis', 'Desconto 10% exclusivo', 'Atendimento 24h', 'Eventos Sixxis', 'Cashback em dobro em datas especiais'],
}

const STATUS_CONFIG: Record<string, { label: string; cor: string; bg: string; Icone: React.ElementType }> = {
  PENDENTE:    { label: 'Pendente',    cor: '#d97706', bg: '#fef3c7', Icone: Clock },
  PROCESSANDO: { label: 'Processando', cor: '#2563eb', bg: '#dbeafe', Icone: Package },
  ENVIADO:     { label: 'Enviado',     cor: '#7c3aed', bg: '#ede9fe', Icone: Truck },
  ENTREGUE:    { label: 'Entregue',    cor: '#059669', bg: '#d1fae5', Icone: CheckCircle },
  PENDENTE_L:  { label: 'Pendente',    cor: '#d97706', bg: '#fef3c7', Icone: Clock },
  PAGO:        { label: 'Pago',        cor: '#2563eb', bg: '#dbeafe', Icone: Package },
  CANCELADO:   { label: 'Cancelado',   cor: '#dc2626', bg: '#fee2e2', Icone: Clock },
}

const TODOS_NIVEIS = ORDEM_NIVEIS_GEM.map(nome => ({
  nome,
  cor: NIVEIS_CONFIG[nome].cor,
  cashback: `${(NIVEIS_CONFIG[nome].cashbackPct * 100).toFixed(0)}%`,
  maxGasto: NIVEIS_CONFIG[nome].maxGasto,
}))

export default function MinhaContaPage() {
  const { data: session } = useSession()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dados, setDados] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/cashback').then(r => r.json()),
      fetch('/api/pedidos?limit=3').then(r => r.json()),
    ]).then(([cashback, ped]) => {
      setDados(cashback)
      setPedidos(Array.isArray(ped.pedidos) ? ped.pedidos.slice(0, 3) : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const nivel = dados?.nivel || { atual: 'Cristal', cor: '#38bdf8', progressoPercent: 0, proximoNivel: 'Topázio', faltam: 1000, cashbackPct: 0.02 }
  const stats = dados?.estatisticas || {}

  if (loading) {
    return (
      <LayoutConta>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />
          ))}
        </div>
      </LayoutConta>
    )
  }

  return (
    <LayoutConta>
      <div className="space-y-5">

        {/* ── BANNER HERO ── */}
        <div className="relative overflow-hidden rounded-2xl"
          style={{ background: (BANNER_POR_NIVEL[nivel.atual] ?? BANNER_POR_NIVEL.Cristal).gradient }}>
          <div className="absolute inset-0 opacity-100"
            style={{
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent((BANNER_POR_NIVEL[nivel.atual] ?? BANNER_POR_NIVEL.Cristal).pattern)}")`,
            }} />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white/60 text-sm mb-1">Olá,</p>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1">
                  {session?.user?.name?.split(' ')[0] || 'Cliente'}
                </h1>
                <p className="text-white/50 text-sm">{session?.user?.email}</p>
              </div>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <IconeNivel nivel={nivel.atual} size={52} />
                <span className="text-xs font-black px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${nivel.cor}25`, color: nivel.cor }}>
                  {nivel.atual}
                </span>
              </div>
            </div>

            {nivel.proximoNivel && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-white/50 mb-2">
                  <span>{nivel.atual}</span>
                  <span>{nivel.proximoNivel}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${nivel.progressoPercent}%`, backgroundColor: nivel.cor }} />
                </div>
                <p className="text-xs text-white/50">
                  Faltam{' '}
                  <span className="text-white font-bold">{formatValor(nivel.faltam)}</span>{' '}
                  para alcançar o nível {nivel.proximoNivel}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Saldo Cashback', valor: formatValor(dados?.saldo || 0), Icone: Gift, cor: '#3cbfb3', bg: '#e8f8f7', href: '/minha-conta/cashback', destaque: true },
            { label: 'Total Gasto',    valor: formatValor(dados?.totalGasto || 0), Icone: TrendingUp, cor: '#16a34a', bg: '#dcfce7', href: '/minha-conta/pedidos', destaque: false },
            { label: 'Pedidos',        valor: String(stats.totalCompras || 0), Icone: ShoppingBag, cor: '#2563eb', bg: '#dbeafe', href: '/minha-conta/pedidos', destaque: false },
            { label: 'Cashback Ganho', valor: formatValor(stats.cashbackAcumulado || 0), Icone: Star, cor: '#f59e0b', bg: '#fef9c3', href: '/minha-conta/cashback', destaque: false },
          ].map((s, i) => (
            <Link key={i} href={s.href}
              className={[
                'bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group',
                s.destaque ? 'border-[#3cbfb3]/30' : 'border-gray-100',
              ].join(' ')}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                style={{ backgroundColor: s.bg }}>
                <s.Icone size={17} style={{ color: s.cor }} />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-lg font-black mt-0.5 ${s.destaque ? 'text-[#3cbfb3]' : 'text-gray-900'}`}>
                {s.valor}
              </p>
            </Link>
          ))}
        </div>

        {/* ── GRADE: Pedidos + Benefícios ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Pedidos Recentes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-gray-900">Pedidos Recentes</h2>
              <Link href="/minha-conta/pedidos"
                className="text-xs text-[#3cbfb3] hover:underline flex items-center gap-1">
                Ver todos <ChevronRight size={11} />
              </Link>
            </div>
            {pedidos.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingBag size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nenhum pedido ainda</p>
                <Link href="/produtos"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl"
                  style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b' }}>
                  <Zap size={12} /> Explorar produtos
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {pedidos.map((p: any) => {
                  const stKey = String(p.status || '').toUpperCase()
                  const st = STATUS_CONFIG[stKey] || STATUS_CONFIG.PENDENTE
                  return (
                    <Link key={p.id} href={`/minha-conta/pedidos/${p.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: st.bg }}>
                        <st.Icone size={16} style={{ color: st.cor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900">#{String(p.id).slice(-8).toUpperCase()}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-gray-900">{formatValor(Number(p.total))}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: st.bg, color: st.cor }}>
                          {st.label}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Benefícios do Nível */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-5"
              style={{ backgroundColor: nivel.cor }} />
            <div className="flex items-center gap-3 mb-4">
              <IconeNivel nivel={nivel.atual} size={40} />
              <div>
                <h2 className="text-sm font-black text-gray-900">Benefícios {nivel.atual}</h2>
                <p className="text-xs" style={{ color: nivel.cor }}>
                  {((nivel.cashbackPct || 0.02) * 100).toFixed(0)}% cashback em todas as compras
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {(VANTAGENS_NIVEL[nivel.atual] || []).map((v, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${nivel.cor}20` }}>
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke={nivel.cor} strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 leading-snug">{v}</p>
                </div>
              ))}
            </div>
            {nivel.proximoNivel && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">
                  Próximo nível: <strong className="text-gray-700">{nivel.proximoNivel}</strong>
                </p>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${nivel.progressoPercent}%`, backgroundColor: nivel.cor }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{nivel.progressoPercent}% concluído</p>
              </div>
            )}
          </div>
        </div>

        {/* ── TODOS OS NÍVEIS ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-black text-gray-900 mb-4">Programa de Fidelidade Sixxis</h2>
          <div className="grid grid-cols-5 gap-2">
            {TODOS_NIVEIS.map((n, i) => {
              const isAtual = n.nome === nivel.atual
              const idxAtual = ORDEM_NIVEIS_GEM.indexOf(nivel.atual as typeof ORDEM_NIVEIS_GEM[number])
              const isAlcancado = i <= idxAtual
              return (
                <div key={i}
                  className={[
                    'flex flex-col items-center p-3 rounded-2xl border-2 transition-all',
                    isAtual ? 'border-[#3cbfb3] shadow-md' : isAlcancado ? 'border-gray-200 bg-gray-50/50' : 'border-transparent bg-gray-50',
                  ].join(' ')}>
                  <IconeNivel nivel={n.nome} size={36} />
                  <p className="text-[11px] font-black mt-2 text-gray-900">{n.nome}</p>
                  <p className="text-[10px] font-bold" style={{ color: n.cor }}>{n.cashback} CB</p>
                  <p className="text-[9px] text-gray-400 text-center mt-0.5">
                    {n.maxGasto && n.maxGasto !== Infinity ? `até R$${(n.maxGasto / 1000).toFixed(0)}k` : 'R$15k+'}
                  </p>
                  {isAtual && (
                    <span className="mt-1 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b' }}>
                      ATUAL
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </LayoutConta>
  )
}
