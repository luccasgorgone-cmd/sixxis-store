'use client'

import { useEffect, useState } from 'react'
import { Loader2, Gift, TrendingUp, Users, Trophy } from 'lucide-react'
import { getNivel } from '@/lib/admin-tokens'

interface Cliente {
  id:    string
  nome:  string
  email: string
  pontos?: { pontos: number } | null
}

function NivelBadge({ pontos }: { pontos: number }) {
  const nivel = getNivel(pontos)
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 border ${nivel.bg} ${nivel.text} ${nivel.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${nivel.dot}`} />
      {nivel.label}
    </span>
  )
}

export default function AdminFidelidadePage() {
  const [ranking, setRanking] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/fidelidade')
      .then((r) => r.json())
      .then((d) => {
        setRanking(d.ranking ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const sorted = [...ranking].sort((a, b) => (b.pontos?.pontos ?? 0) - (a.pontos?.pontos ?? 0))

  const comPontos    = sorted.filter((c) => (c.pontos?.pontos ?? 0) > 0)
  const totalPontos  = sorted.reduce((s, c) => s + (c.pontos?.pontos ?? 0), 0)
  const nivelOuro    = sorted.filter((c) => (c.pontos?.pontos ?? 0) >= 500).length
  const nivelDiamante= sorted.filter((c) => (c.pontos?.pontos ?? 0) >= 2000).length

  const statCards = [
    { icon: Users,    iconBg: 'bg-[#3cbfb3]/10', iconColor: 'text-[#3cbfb3]', label: 'Clientes com pontos', value: comPontos.length },
    { icon: TrendingUp, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500', label: 'Total de pontos ativos', value: totalPontos.toLocaleString('pt-BR') },
    { icon: Trophy,   iconBg: 'bg-yellow-50',    iconColor: 'text-yellow-500', label: 'Nível Ouro+',           value: nivelOuro },
    { icon: Gift,     iconBg: 'bg-cyan-50',       iconColor: 'text-cyan-500',   label: 'Nível Diamante',        value: nivelDiamante },
  ]

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Programa de Fidelidade</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ranking e histórico de pontos dos clientes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, iconBg, iconColor, label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Levels reference */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Níveis do programa</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Bronze',   range: '0 – 99 pts',    bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500' },
            { label: 'Prata',    range: '100 – 499 pts',  bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-400' },
            { label: 'Ouro',     range: '500 – 1.999 pts',bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
            { label: 'Diamante', range: '2.000+ pts',     bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',   dot: 'bg-cyan-500' },
          ].map(({ label, range, bg, text, border, dot }) => (
            <div key={label} className={`rounded-xl border px-4 py-3 ${bg} ${border}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className={`text-sm font-bold ${text}`}>{label}</span>
              </div>
              <p className={`text-xs ${text} opacity-70`}>{range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#3cbfb3] animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Ranking de clientes</h2>
            <span className="text-xs text-gray-400">{comPontos.length} com pontos</span>
          </div>
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Nenhum cliente com pontos ainda</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['#', 'Cliente', 'Email', 'Nível', 'Pontos'].map((h, i) => (
                    <th key={i} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, idx) => {
                  const pts = c.pontos?.pontos ?? 0
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5">
                        <span className={`text-sm font-bold ${idx < 3 ? 'text-[#3cbfb3]' : 'text-gray-400'}`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{c.nome}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{c.email}</td>
                      <td className="px-5 py-3.5">
                        <NivelBadge pontos={pts} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-[#3cbfb3]">
                          {pts.toLocaleString('pt-BR')} pts
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
