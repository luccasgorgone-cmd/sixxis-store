'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Users, Eye, ShoppingCart, TrendingUp,
  Monitor, Smartphone, Tablet, Cookie,
  Search, RefreshCw,
} from 'lucide-react'

interface DadosAnalytics {
  periodo: number
  resumo: {
    totalVisitas: number
    aceitaram: number
    recusaram: number
    taxaAceite: number
    totalEventos: number
    compras: number
    taxaConversao: number
    receita: number
  }
  topPaginas: { pagina: string; visitas: number }[]
  topBuscas: { termo: string; count: number }[]
  dispositivoStats: { dispositivo: string; count: number }[]
  clientes: {
    sessionId: string
    ultimaVisita: string
    totalVisitas: number
    totalPaginas: number
    dispositivo: string
    carrinhosAbertos: number
    comprasFeitas: number
    totalGasto: number
  }[]
}

export default function AnalyticsDashboard() {
  const [dados, setDados] = useState<DadosAnalytics | null>(null)
  const [periodo, setPeriodo] = useState('7')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)

  const buscarDados = useCallback(async (p: string) => {
    setLoading(true)
    setErro('')
    try {
      const res = await fetch(`/api/admin/analytics?periodo=${p}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detalhes || err.erro || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setDados(data)
      setUltimaAtualizacao(new Date())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar analytics'
      setErro(msg)
      console.error('[AnalyticsDashboard]', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { buscarDados(periodo) }, [periodo, buscarDados])

  if (erro) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <p className="text-red-700 font-bold mb-2">Erro ao carregar analytics</p>
      <p className="text-red-500 text-sm font-mono mb-4">{erro}</p>
      <button
        onClick={() => buscarDados(periodo)}
        className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition"
      >
        Tentar novamente
      </button>
    </div>
  )

  const r = dados?.resumo

  return (
    <div className="space-y-6">

      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-600">Período:</span>
          {[
            { val: '1', label: 'Hoje' },
            { val: '7', label: '7 dias' },
            { val: '30', label: '30 dias' },
            { val: '90', label: '90 dias' },
          ].map(p => (
            <button
              key={p.val}
              onClick={() => setPeriodo(p.val)}
              className={`px-3 py-1.5 rounded-xl text-sm font-bold transition ${
                periodo === p.val
                  ? 'bg-[#0f2e2b] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#3cbfb3]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {ultimaAtualizacao && (
            <span className="text-xs text-gray-400">
              Atualizado: {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button
            onClick={() => buscarDados(periodo)}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:border-[#3cbfb3] hover:text-[#3cbfb3] transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {loading && !dados ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users,        label: 'Visitantes Únicos',    valor: String(r?.totalVisitas || 0), cor: '#3cbfb3', num: true },
              { icon: Cookie,       label: 'Taxa de Aceite LGPD',  valor: `${r?.taxaAceite || 0}%`,    cor: '#16a34a', num: false },
              { icon: ShoppingCart, label: 'Compras Rastreadas',   valor: String(r?.compras || 0),      cor: '#8b5cf6', num: true },
              { icon: TrendingUp,   label: 'Taxa de Conversão',    valor: `${r?.taxaConversao || 0}%`, cor: '#f59e0b', num: false },
            ].map(kpi => {
              const Icon = kpi.icon
              return (
                <div
                  key={kpi.label}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: kpi.cor + '18' }}
                  >
                    <Icon size={17} style={{ color: kpi.cor }} />
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900">
                    {kpi.num ? Number(kpi.valor).toLocaleString('pt-BR') : kpi.valor}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
                </div>
              )
            })}
          </div>

          {/* Receita + Consentimentos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 mb-4">Resumo Financeiro</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">Receita rastreada</span>
                  <span className="text-base font-extrabold text-green-700">
                    R$ {(r?.receita || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">Total de compras</span>
                  <span className="text-base font-bold text-gray-900">{r?.compras || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Ticket médio</span>
                  <span className="text-base font-bold text-gray-900">
                    {r?.compras
                      ? `R$ ${((r.receita || 0) / r.compras).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <Cookie size={14} className="text-[#3cbfb3]" />
                Consentimentos LGPD
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">Aceitaram analytics</span>
                    <span className="text-green-600 font-bold">{r?.aceitaram || 0}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${r?.taxaAceite || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">Recusaram opcionais</span>
                    <span className="text-orange-500 font-bold">{r?.recusaram || 0}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-orange-400 h-2 rounded-full transition-all"
                      style={{ width: `${100 - (r?.taxaAceite || 0)}%` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 pt-1">
                  Taxa de aceite: <strong>{r?.taxaAceite || 0}%</strong> dos visitantes
                </p>
              </div>
            </div>
          </div>

          {/* Top páginas + Top buscas + Dispositivos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                <Eye size={14} className="text-[#3cbfb3]" />
                Páginas Mais Visitadas
              </h3>
              {dados?.topPaginas?.length ? (
                <div className="space-y-2">
                  {dados.topPaginas.map((p, i) => (
                    <div key={p.pagina} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 w-4">{i + 1}</span>
                      <span className="text-xs text-gray-600 truncate flex-1 font-mono">{p.pagina || '/'}</span>
                      <span className="text-xs font-extrabold text-gray-900 shrink-0">{p.visitas}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">
                  Sem dados ainda. Os eventos aparecerão conforme os visitantes navegam.
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                <Search size={14} className="text-[#3cbfb3]" />
                Termos Mais Buscados
              </h3>
              {dados?.topBuscas?.length ? (
                <div className="space-y-2">
                  {dados.topBuscas.map((b, i) => (
                    <div key={b.termo} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 w-4">{i + 1}</span>
                      <span className="text-xs text-gray-700 truncate flex-1">{b.termo}</span>
                      <span className="text-xs font-extrabold text-gray-900 shrink-0">{b.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">
                  Nenhuma busca registrada ainda.
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                <Monitor size={14} className="text-[#3cbfb3]" />
                Dispositivos
              </h3>
              {dados?.dispositivoStats?.length ? (
                <div className="space-y-3">
                  {dados.dispositivoStats.map(d => {
                    const total = dados.dispositivoStats.reduce((s, x) => s + x.count, 0)
                    const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
                    const Icon =
                      d.dispositivo === 'mobile' ? Smartphone
                      : d.dispositivo === 'tablet' ? Tablet
                      : Monitor
                    return (
                      <div key={d.dispositivo}>
                        <div className="flex justify-between text-xs mb-1">
                          <div className="flex items-center gap-1.5">
                            <Icon size={12} className="text-gray-500" />
                            <span className="text-gray-600 capitalize font-medium">{d.dispositivo}</span>
                          </div>
                          <span className="font-bold text-gray-900">{pct}% ({d.count})</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-[#3cbfb3] h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">Sem dados de dispositivos.</p>
              )}
            </div>
          </div>

          {/* Tabela de visitantes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users size={15} className="text-[#3cbfb3]" />
              <h3 className="text-sm font-extrabold text-gray-900">
                Visitantes Recentes ({dados?.clientes?.length || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Sessão', 'Dispositivo', 'Visitas', 'Páginas', 'Carrinhos', 'Compras', 'Gasto Total', 'Última Visita'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dados?.clientes?.length ? dados.clientes.map(c => (
                    <tr key={c.sessionId} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{c.sessionId}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 capitalize">{c.dispositivo}</td>
                      <td className="px-4 py-3 text-xs font-bold text-gray-900">{c.totalVisitas}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{c.totalPaginas}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{c.carrinhosAbertos}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${c.comprasFeitas > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {c.comprasFeitas}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-gray-900">
                        {c.totalGasto > 0
                          ? `R$ ${c.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(c.ultimaVisita).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                        Nenhum visitante registrado ainda. Os dados aparecerão assim que os visitantes
                        aceitarem os cookies de analytics e navegarem pelo site.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
