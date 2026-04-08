'use client'

import { useEffect, useState } from 'react'
import { Loader2, Gift, TrendingUp } from 'lucide-react'

interface Cliente {
  id:    string
  nome:  string
  email: string
  pontos?: { pontos: number } | null
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Programa de Fidelidade</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ranking e histórico de pontos dos clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: Gift, label: 'Clientes com pontos', value: ranking.filter((c) => (c.pontos?.pontos ?? 0) > 0).length },
          { icon: TrendingUp, label: 'Total de pontos ativos', value: ranking.reduce((s, c) => s + (c.pontos?.pontos ?? 0), 0) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-[#e8f8f7] flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#3cbfb3]" />
              </div>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">{value.toLocaleString('pt-BR')}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#3cbfb3] animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Ranking de clientes</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['#', 'Cliente', 'Email', 'Pontos'].map((h, i) => (
                  <th key={i} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranking.sort((a, b) => (b.pontos?.pontos ?? 0) - (a.pontos?.pontos ?? 0)).map((c, idx) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-bold text-gray-400">#{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{c.nome}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-[#3cbfb3]">
                      {(c.pontos?.pontos ?? 0).toLocaleString('pt-BR')} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ranking.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Nenhum cliente com pontos ainda</div>
          )}
        </div>
      )}
    </div>
  )
}
