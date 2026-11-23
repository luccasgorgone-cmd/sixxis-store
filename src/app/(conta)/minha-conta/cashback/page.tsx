'use client'

import { useState, useEffect } from 'react'
import { Gift, ArrowDownLeft, ArrowUpRight, Zap, Info } from 'lucide-react'
import LayoutConta from '@/components/conta/LayoutConta'
import { IconeNivel } from '@/components/ui/NivelIcons'

function formatValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatData(d: string | Date) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CashbackPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'credito' | 'debito'>('todos')

  useEffect(() => {
    fetch('/api/cashback').then(r => r.json()).then(d => {
      setDados(d); setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <LayoutConta>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#111717] rounded-2xl h-32 animate-pulse border border-[#2A3937]" />
          ))}
        </div>
      </LayoutConta>
    )
  }

  const nivel = dados?.nivel || { atual: 'Cristal', cor: '#38bdf8', cashbackPct: 0.02 }
  const stats = dados?.estatisticas || {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extrato = (dados?.extrato || []).filter((t: any) =>
    filtro === 'todos' ? true : filtro === 'credito' ? t.tipo === 'credito' : t.tipo === 'debito'
  )

  return (
    <LayoutConta>
      <div className="space-y-5">

        {/* ── HERO SALDO ── */}
        <div className="relative overflow-hidden rounded-2xl"
          style={{ background: `linear-gradient(135deg, #0b2220 0%, #0f2e2b 45%, ${nivel.cor}50 100%)` }}>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 3px 3px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full opacity-10"
            style={{ backgroundColor: nivel.cor }} />

          <div className="relative p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gift size={16} className="text-white/60" />
                  <p className="text-white/60 text-sm font-medium">Saldo disponível</p>
                </div>
                <p className="text-4xl font-black text-white">{formatValor(dados?.saldo || 0)}</p>
                <p className="text-white/50 text-xs mt-1">Use no checkout como desconto</p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs mb-1">Seu cashback</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <IconeNivel nivel={nivel.atual} size={24} />
                  <span className="text-2xl font-black" style={{ color: nivel.cor }}>
                    {((nivel.cashbackPct || 0.02) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-white/40 text-[10px]">nível {nivel.atual}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Ganho', valor: formatValor(stats.cashbackAcumulado || 0) },
                { label: 'Total Usado', valor: formatValor(stats.cashbackUsado || 0) },
                { label: 'Compras',     valor: String(stats.totalCompras || 0) },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-white/50 text-[9px] uppercase tracking-wide">{s.label}</p>
                  <p className="text-white font-black text-sm mt-0.5">{s.valor}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COMO FUNCIONA ── */}
        <div className="bg-[#111717] rounded-2xl border border-[#2A3937] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-[#00cfb5]" />
            <h2 className="text-sm font-black text-[#F4F7F6]">Como funciona o cashback?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { num: '01', titulo: 'Compre na Sixxis', desc: 'A cada compra aprovada, você recebe cashback automático na sua conta', cor: '#00cfb5' },
              { num: '02', titulo: 'Acumule saldo', desc: `Você tem ${((nivel.cashbackPct || 0.02) * 100).toFixed(0)}% de cashback no nível ${nivel.atual}. Suba de nível para ganhar mais!`, cor: nivel.cor },
              { num: '03', titulo: 'Use no checkout', desc: 'Na finalização, aplique seu saldo como desconto (até 20% do valor do pedido)', cor: '#16a34a' },
            ].map((s, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ backgroundColor: `${s.cor}08` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
                  style={{ backgroundColor: `${s.cor}20`, color: s.cor }}>{s.num}</div>
                <div>
                  <p className="text-xs font-bold text-[#F4F7F6]">{s.titulo}</p>
                  <p className="text-[10px] text-[#B0BFBC] mt-0.5 leading-snug">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── EXTRATO ── */}
        <div className="bg-[#111717] rounded-2xl border border-[#2A3937] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-[#F4F7F6]">Extrato</h2>
            <div className="flex items-center gap-1 bg-[#192221] rounded-xl p-1">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'credito', label: 'Entradas' },
                { id: 'debito', label: 'Saídas' },
              ].map(f => (
                <button key={f.id}
                  onClick={() => setFiltro(f.id as 'todos' | 'credito' | 'debito')}
                  className={[
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                    filtro === f.id ? 'bg-[#111717] text-[#F4F7F6] shadow-sm' : 'text-[#B0BFBC] hover:text-[#D7E0DD]',
                  ].join(' ')}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {extrato.length === 0 ? (
            <div className="py-12 text-center">
              <Gift size={36} className="text-[#8a9794] mx-auto mb-3" />
              <p className="text-[#8a9794] text-sm">Nenhuma transação ainda</p>
              <p className="text-[#6b7a77] text-xs mt-1">Faça sua primeira compra para começar a ganhar cashback!</p>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- pre-existente, fora do escopo do redesign de cor */}
              <a href="/produtos"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #00cfb5, #65E5D4)', color: '#0f2e2b' }}>
                <Zap size={14} /> Ver produtos
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {extrato.map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-3 hover:bg-[#192221]/50 px-2 rounded-xl transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.tipo === 'credito' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {t.tipo === 'credito'
                      ? <ArrowDownLeft size={16} className="text-emerald-600" />
                      : <ArrowUpRight size={16} className="text-red-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#F4F7F6] truncate">
                      {t.descricao || (t.tipo === 'credito' ? 'Cashback recebido' : 'Cashback usado')}
                    </p>
                    <p className="text-[10px] text-[#8a9794]">{formatData(t.createdAt)}</p>
                  </div>
                  <p className={`text-sm font-black shrink-0 ${t.tipo === 'credito' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.tipo === 'credito' ? '+' : '-'}{formatValor(t.valor)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutConta>
  )
}
