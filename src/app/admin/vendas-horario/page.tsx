'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from 'recharts'
import { Clock, TrendingUp, Calendar, Star, Zap } from 'lucide-react'

interface PorHora { hora: number; label: string; pedidos: number; receita: number; itens: number }
interface PorDiaSemana { dia: number; nome: string; pedidos: number; receita: number }
interface Previsao {
  data: string
  diaSemana: number
  nomeDia: string
  previsaoPedidos: number
  previsaoReceita: number
  melhorHorario: number
  confianca: string
}
interface PorData { data: string; pedidos: number; receita: number }
interface Resumo { totalPedidos: number; totalReceita: number; mediaPorDia: number; ticketMedio: number }

interface Dados {
  resumo: Resumo
  porHora: PorHora[]
  porDiaSemana: PorDiaSemana[]
  melhoresHoras: PorHora[]
  porData: PorData[]
  previsao: Previsao[]
  heatmap: Record<string, number>
}

const fmtBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const COR_PRINCIPAL = '#3cbfb3'
const COR_ESCURO = '#0f2e2b'

function Heatmap({ data }: { data: Record<string, number> }) {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const horas = Array.from({ length: 24 }, (_, i) => i)
  const maxVal = Math.max(...Object.values(data), 1)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex mb-1">
          <div className="w-10 shrink-0" />
          {horas.map(h => (
            <div key={h} className="flex-1 text-center text-[9px] text-gray-400">
              {h % 3 === 0 ? `${h}h` : ''}
            </div>
          ))}
        </div>
        {dias.map((dia, d) => (
          <div key={d} className="flex items-center mb-1">
            <div className="w-10 text-[10px] text-gray-500 font-semibold shrink-0">{dia}</div>
            {horas.map(h => {
              const val = data[`${d}_${h}`] || 0
              const intensity = val / maxVal
              return (
                <div
                  key={h}
                  className="flex-1 mx-px rounded-sm"
                  style={{
                    height: 22,
                    backgroundColor: val === 0
                      ? '#f3f4f6'
                      : `rgba(60,191,179,${0.15 + intensity * 0.85})`,
                  }}
                  title={`${dia} ${h}h: ${val} pedido(s)`}
                />
              )
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2 justify-end">
          <span className="text-[9px] text-gray-400">Menos</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(i => (
            <div key={i} className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: `rgba(60,191,179,${0.15 + i * 0.85})` }}/>
          ))}
          <span className="text-[9px] text-gray-400">Mais</span>
        </div>
      </div>
    </div>
  )
}

function ConfiancaBadge({ nivel }: { nivel: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    alta: { cls: 'bg-emerald-100 text-emerald-700', label: 'Alta' },
    'média': { cls: 'bg-yellow-100 text-yellow-700', label: 'Média' },
    baixa: { cls: 'bg-gray-100 text-gray-500', label: 'Baixa' },
  }
  const c = cfg[nivel] || { cls: 'bg-gray-100 text-gray-500', label: nivel }
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${c.cls}`}>
      {c.label}
    </span>
  )
}

export default function VendasHorarioPage() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [periodo, setPeriodo] = useState('30d')

  useEffect(() => {
    setCarregando(true)
    fetch(`/api/admin/vendas-horario?periodo=${periodo}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setDados(d); setCarregando(false) })
      .catch(() => setCarregando(false))
  }, [periodo])

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3cbfb3] flex items-center justify-center">
              <Clock size={20} className="text-white" />
            </div>
            Horários de Venda
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Quando seus clientes compram — histórico e previsão
          </p>
        </div>
        <select
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#3cbfb3]"
        >
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
          <option value="365d">Último ano</option>
        </select>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-[#3cbfb3] border-t-transparent animate-spin" />
        </div>
      ) : !dados ? null : (
        <>
          {/* RESUMO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Pedidos', valor: dados.resumo.totalPedidos, icon: TrendingUp },
              { label: 'Total Receita', valor: fmtBRL(dados.resumo.totalReceita), icon: Zap },
              { label: 'Média/Dia', valor: `${dados.resumo.mediaPorDia} pedidos`, icon: Calendar },
              { label: 'Ticket Médio', valor: fmtBRL(dados.resumo.ticketMedio), icon: Star },
            ].map((m, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <m.icon size={16} style={{ color: '#3cbfb3' }} className="mb-2" />
                <p className="text-xl font-black text-gray-900">{m.valor}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* PREVISÃO 7 DIAS */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-black text-gray-900 mb-1 flex items-center gap-2">
              <Zap size={16} style={{ color: '#3cbfb3' }} />
              Previsão — Próximos 7 dias
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Baseado no histórico do período selecionado
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {dados.previsao.map((p, i) => (
                <div key={i} className={`rounded-xl border p-3 text-center ${
                  p.previsaoPedidos > 0
                    ? 'border-[#3cbfb3]/30 bg-[#f0fffe]'
                    : 'border-gray-100 bg-gray-50'
                }`}>
                  <p className="text-[10px] font-bold text-gray-500">{p.nomeDia}</p>
                  <p className="text-[9px] text-gray-400 mb-2">
                    {new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit',
                    })}
                  </p>
                  <p className="text-lg font-black" style={{ color: '#3cbfb3' }}>
                    {p.previsaoPedidos}
                  </p>
                  <p className="text-[9px] text-gray-400">pedidos</p>
                  <p className="text-[9px] font-semibold text-gray-600 mt-1">
                    {fmtBRL(p.previsaoReceita)}
                  </p>
                  <p className="text-[8px] text-gray-400 mt-1">
                    Top: {p.melhorHorario.toString().padStart(2, '0')}h
                  </p>
                  <div className="mt-1.5">
                    <ConfiancaBadge nivel={p.confianca} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRÁFICO POR HORA */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={16} style={{ color: '#3cbfb3' }} />
              Vendas por Hora do Dia
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dados.porHora}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    name === 'receita' ? fmtBRL(v) : v,
                    name === 'receita' ? 'Receita' : 'Pedidos',
                  ]}
                />
                <Bar dataKey="pedidos" radius={[4, 4, 0, 0]}>
                  {dados.porHora.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={dados.melhoresHoras.some(m => m.hora === entry.hora)
                        ? COR_ESCURO
                        : COR_PRINCIPAL}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {dados.melhoresHoras.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className="text-xs font-bold text-gray-500">Top horários:</span>
                {dados.melhoresHoras.map(h => (
                  <span key={h.hora}
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#e8f8f7', color: '#0f2e2b' }}>
                    {h.hora.toString().padStart(2, '0')}h — {h.pedidos} pedidos
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* DIAS + EVOLUÇÃO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={16} style={{ color: '#3cbfb3' }} />
                Por Dia da Semana
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dados.porDiaSemana}>
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [v, 'Pedidos']} />
                  <Bar dataKey="pedidos" radius={[4, 4, 0, 0]}>
                    {dados.porDiaSemana.map((_entry, index) => (
                      <Cell key={index} fill={index === 0 ? COR_ESCURO : COR_PRINCIPAL} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={16} style={{ color: '#3cbfb3' }} />
                Evolução Diária
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dados.porData.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="data"
                    tick={{ fontSize: 9 }}
                    tickFormatter={(d: string) => d.slice(5)}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [v, 'Pedidos']} />
                  <Line type="monotone" dataKey="pedidos" stroke={COR_PRINCIPAL} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* HEATMAP */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-black text-gray-900 mb-1 flex items-center gap-2">
              <Star size={16} style={{ color: '#3cbfb3' }} />
              Mapa de Calor — Hora × Dia da Semana
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Concentração de vendas — mais escuro = mais vendas
            </p>
            <Heatmap data={dados.heatmap} />
          </div>
        </>
      )}
    </div>
  )
}
