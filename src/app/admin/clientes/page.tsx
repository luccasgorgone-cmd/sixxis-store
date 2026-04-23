'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Users, Search, Filter, X, ChevronDown,
  Eye, ShieldOff, ShieldCheck,
  ShoppingBag, Coins, UserCheck, UserX,
  RefreshCcw, ChevronLeft, ChevronRight
} from 'lucide-react'

interface Cliente {
  id: string
  nome: string | null
  email: string
  cpf: string | null
  telefone: string | null
  createdAt: string
  bloqueado: boolean
  motivoBloqueio: string | null
  cashbackSaldo: number
  totalGasto: number
  totalPedidos: number
  ultimaCompra: string | null
  _count?: { pedidos: number }
}

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal]       = useState(0)
  const [totalGeral, setTotalGeral] = useState(0)
  const [loading, setLoading]   = useState(true)
  const [estados, setEstados]   = useState<string[]>([])

  const [busca, setBusca]             = useState('')
  const [status, setStatus]           = useState('')
  const [gastoFaixa, setGastoFaixa]   = useState('')
  const [recorrencia, setRecorrencia] = useState('')
  const [estado, setEstado]           = useState('')
  const [ordenar, setOrdenar]         = useState('createdAt')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [page, setPage]               = useState(1)
  const limit = 20

  const filtrosAtivos = [status, gastoFaixa, recorrencia, estado].filter(Boolean).length

  const buscarClientes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    try {
      if (busca)   params.set('busca', busca)
      if (status)  params.set('status', status)
      if (ordenar) params.set('ordenar', ordenar)
      params.set('page', String(page))
      params.set('limit', String(limit))

      if (gastoFaixa === '0-500')         { params.set('gastoMin', '0');     params.set('gastoMax', '500')   }
      else if (gastoFaixa === '500-2000') { params.set('gastoMin', '500');   params.set('gastoMax', '2000')  }
      else if (gastoFaixa === '2000-10000') { params.set('gastoMin', '2000'); params.set('gastoMax', '10000') }
      else if (gastoFaixa === '10000+')   { params.set('gastoMin', '10000') }

      if (recorrencia === '1')    { params.set('pedidosMin', '1');  params.set('pedidosMax', '1') }
      else if (recorrencia === '2-5') { params.set('pedidosMin', '2'); params.set('pedidosMax', '5') }
      else if (recorrencia === '6+')  { params.set('pedidosMin', '6') }

      if (estado) params.set('estado', estado)

      const res  = await fetch(`/api/admin/clientes?${params}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Erro ' + res.status)
      const data = await res.json()
      setClientes(Array.isArray(data.clientes) ? data.clientes : [])
      setTotal(Number(data.total) || 0)
      setTotalGeral(Number(data.totalGeral ?? data.total) || 0)
      if (Array.isArray(data.estados) && data.estados.length) setEstados(data.estados)
    } catch (err) {
      console.error('[clientes] fetch falhou:', err)
      setClientes([])
      setTotal(0)
      setTotalGeral(0)
    } finally {
      setLoading(false)
    }
  }, [busca, status, gastoFaixa, recorrencia, estado, ordenar, page])

  useEffect(() => {
    const t = setTimeout(buscarClientes, busca ? 400 : 0)
    return () => clearTimeout(t)
  }, [buscarClientes])

  function limparFiltros() {
    setStatus(''); setGastoFaixa(''); setRecorrencia(''); setEstado('')
    setOrdenar('createdAt'); setPage(1)
  }

  function fmtValor(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function dataRelativa(d: string | null) {
    if (!d) return null
    const dias = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
    if (dias === 0) return 'hoje'
    if (dias === 1) return 'ontem'
    if (dias < 30)  return `há ${dias} dias`
    if (dias < 365) return `há ${Math.floor(dias / 30)} meses`
    return `há ${Math.floor(dias / 365)} anos`
  }

  const totalPages = Math.ceil(total / limit)

  const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 mb-6 md:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users size={22} className="text-[#3cbfb3]" /> Clientes
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            {loading ? 'Carregando...' : `${totalGeral} cliente${totalGeral !== 1 ? 's' : ''} cadastrado${totalGeral !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={buscarClientes}
          className="shrink-0 flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-colors"
        >
          <RefreshCcw size={15} /> <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* STATS RÁPIDAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de clientes',  valor: totalGeral,                                     icone: Users,      cor: '#3cbfb3' },
          { label: 'Ativos',             valor: clientes.filter(c => !c.bloqueado).length,      icone: UserCheck,  cor: '#10b981' },
          { label: 'Bloqueados',         valor: clientes.filter(c =>  c.bloqueado).length,      icone: UserX,      cor: '#ef4444' },
          { label: 'Com compras',        valor: clientes.filter(c => c.totalPedidos > 0).length, icone: ShoppingBag, cor: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${s.cor}15` }}>
              <s.icone size={18} style={{ color: s.cor }} />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">{s.valor}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* BARRA DE BUSCA + FILTROS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou CPF..."
              value={busca}
              onChange={e => { setBusca(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={ordenar}
              onChange={e => setOrdenar(e.target.value)}
              className="flex-1 md:flex-initial border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#3cbfb3] bg-white md:min-w-[160px]"
            >
              <option value="createdAt">Mais recentes</option>
              <option value="totalGasto">Maior gasto</option>
              <option value="totalPedidos">Mais pedidos</option>
              <option value="ultimaCompra">Última compra</option>
            </select>

            <button
              onClick={() => setFiltrosAbertos(!filtrosAbertos)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                filtrosAtivos > 0
                  ? 'bg-[#0f2e2b] text-white border-[#0f2e2b]'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter size={15} />
              Filtros
              {filtrosAtivos > 0 && (
                <span className="bg-[#3cbfb3] text-[#0f2e2b] text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {filtrosAtivos}
                </span>
              )}
              <ChevronDown size={14} className={`transition-transform ${filtrosAbertos ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {filtrosAbertos && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Status</label>
                <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#3cbfb3] bg-white">
                  <option value="">Todos</option>
                  <option value="ativo">Ativos</option>
                  <option value="bloqueado">Bloqueados</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Valor gasto</label>
                <select value={gastoFaixa} onChange={e => { setGastoFaixa(e.target.value); setPage(1) }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#3cbfb3] bg-white">
                  <option value="">Qualquer valor</option>
                  <option value="0-500">Até R$ 500</option>
                  <option value="500-2000">R$ 500 a R$ 2.000</option>
                  <option value="2000-10000">R$ 2.000 a R$ 10.000</option>
                  <option value="10000+">Acima de R$ 10.000</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Recorrência</label>
                <select value={recorrencia} onChange={e => { setRecorrencia(e.target.value); setPage(1) }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#3cbfb3] bg-white">
                  <option value="">Todos</option>
                  <option value="1">1 compra</option>
                  <option value="2-5">2 a 5 compras</option>
                  <option value="6+">6 ou mais compras</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Estado</label>
                <select value={estado} onChange={e => { setEstado(e.target.value); setPage(1) }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#3cbfb3] bg-white">
                  <option value="">Todos os estados</option>
                  {(estados.length > 0 ? estados : UFS).map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
            {filtrosAtivos > 0 && (
              <button onClick={limparFiltros}
                className="mt-3 flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors">
                <X size={13} /> Limpar todos os filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-gray-50/80 border-b border-gray-100">
          {['Cliente', 'Pedidos', 'Total Gasto', 'Cashback', 'Última Compra', 'Status', 'Ações'].map((h, i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</span>
          ))}
        </div>

        {loading && (
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-gray-100 animate-pulse rounded-lg w-3/4" />
                    <div className="h-3 bg-gray-100 animate-pulse rounded-lg w-1/2" />
                  </div>
                </div>
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 animate-pulse rounded-lg" />
                ))}
                <div className="h-8 w-14 bg-gray-100 animate-pulse rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {!loading && clientes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={48} className="text-gray-200 mb-4" />
            <p className="text-base font-semibold text-gray-400">Nenhum cliente encontrado</p>
            <p className="text-sm text-gray-300 mt-1">
              {filtrosAtivos > 0 ? 'Tente ajustar os filtros' : 'Ainda não há clientes cadastrados'}
            </p>
            {filtrosAtivos > 0 && (
              <button onClick={limparFiltros} className="mt-4 text-sm text-[#3cbfb3] hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {!loading && clientes.length > 0 && (
          <div className="divide-y divide-gray-50">
            {clientes.map(c => (
              <div
                key={c.id}
                onClick={() => window.location.href = `/admin/clientes/${c.id}`}
                className={`grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-gray-50/50 transition-colors cursor-pointer group ${c.bloqueado ? 'bg-red-50/30' : ''}`}
              >
                {/* Cliente */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: c.bloqueado ? '#ef4444' : '#0f2e2b' }}>
                    {(c.nome || c.email)?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#3cbfb3] transition-colors">
                      {c.nome || 'Sem nome'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{c.email}</p>
                    {c.cpf && <p className="text-xs text-gray-300">{c.cpf}</p>}
                  </div>
                </div>

                {/* Pedidos */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-bold ${c.totalPedidos > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                    {c.totalPedidos}
                  </span>
                  {c.totalPedidos >= 6 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">VIP</span>
                  )}
                  {c.totalPedidos >= 2 && c.totalPedidos < 6 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">REG</span>
                  )}
                </div>

                {/* Total gasto */}
                <span className={`text-sm font-bold ${c.totalGasto > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                  {fmtValor(c.totalGasto)}
                </span>

                {/* Cashback */}
                <span className={`text-sm font-semibold ${c.cashbackSaldo > 0 ? 'text-[#3cbfb3]' : 'text-gray-300'}`}>
                  {fmtValor(c.cashbackSaldo)}
                </span>

                {/* Última compra */}
                <span className="text-xs text-gray-500">
                  {c.ultimaCompra ? dataRelativa(c.ultimaCompra) : '—'}
                </span>

                {/* Status */}
                <div>
                  {c.bloqueado ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                      <ShieldOff size={10} /> Bloqueado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <ShieldCheck size={10} /> Ativo
                    </span>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <a
                    href={`/admin/clientes/${c.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-[#3cbfb3]/10 text-[#3cbfb3] hover:bg-[#3cbfb3] hover:text-white transition-all"
                  >
                    <Eye size={13} /> Ver
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Mostrando {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} de {total} clientes
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-gray-700">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
