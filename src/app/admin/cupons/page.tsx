'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Tag, Plus, Search, X, Edit2, Trash2, Eye,
  Copy, CheckCircle, Clock, AlertTriangle, Percent,
  DollarSign, Truck, Users, TrendingDown, RefreshCcw,
  ChevronDown, BarChart3, ChevronLeft, ChevronRight,
} from 'lucide-react'

// ── TIPOS ────────────────────────────────────────────────────────────────────

interface Cupom {
  id: string; codigo: string; tipo: string; valor: number
  usoMaximo: number | null; totalUsos: number; pedidoMinimo: number
  validade: string | null; ativo: boolean; descricao: string | null
  primeiraCompra: boolean; expirado: boolean; esgotado: boolean
  recentesUsos: { usadoEm: string; nomeCliente: string | null; valorDesconto: number }[]
  createdAt: string
}

interface Stats {
  totalCupons: number; totalAtivos: number
  totalInativos: number; totalEconomia: number
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function formatValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function dataRelativa(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const dias = Math.floor(diff / 86400000)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 30)  return `há ${dias} dias`
  return new Date(d).toLocaleDateString('pt-BR')
}

function diasRestantes(validade: string | null): number | null {
  if (!validade) return null
  const diff = new Date(validade).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

// ── BADGE DE TIPO ─────────────────────────────────────────────────────────────

function TipoBadge({ tipo, valor }: { tipo: string; valor: number }) {
  const configs: Record<string, { label: string; cor: string; bg: string; icone: React.ElementType }> = {
    PERCENTUAL:   { label: `${valor}% OFF`,  cor: '#3cbfb3', bg: '#e8f8f7', icone: Percent    },
    VALOR_FIXO:   { label: `R$\u00a0${valor} OFF`, cor: '#2563eb', bg: '#dbeafe', icone: DollarSign },
    FRETE_GRATIS: { label: 'Frete Grátis',   cor: '#7c3aed', bg: '#ede9fe', icone: Truck       },
  }
  const cfg = configs[tipo] ?? configs.PERCENTUAL
  const Icon = cfg.icone
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.cor }}
    >
      <Icon size={10} />{cfg.label}
    </span>
  )
}

// ── MODAL CRIAR / EDITAR ──────────────────────────────────────────────────────

function ModalCupom({
  cupom, onClose, onSalvo,
}: {
  cupom: Cupom | null; onClose: () => void; onSalvo: () => void
}) {
  const [form, setForm] = useState({
    codigo:         cupom?.codigo         || '',
    tipo:           cupom?.tipo           || 'PERCENTUAL',
    valor:          String(cupom?.valor   ?? 10),
    usoMaximo:      String(cupom?.usoMaximo ?? ''),
    pedidoMinimo:   String(cupom?.pedidoMinimo ?? 0),
    validade:       cupom?.validade
                      ? new Date(cupom.validade).toISOString().split('T')[0]
                      : '',
    ativo:          cupom?.ativo          ?? true,
    descricao:      cupom?.descricao      || '',
    primeiraCompra: cupom?.primeiraCompra ?? false,
  })
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState('')
  const [copiado, setCopiado]     = useState(false)
  const isEdicao = !!cupom

  function gerarCodigo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let c = 'SX'
    for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)]
    setForm((p) => ({ ...p, codigo: c }))
  }

  async function handleSalvar() {
    if (!form.codigo.trim())               { setErro('Código obrigatório'); return }
    if (!form.valor || Number(form.valor) <= 0) { setErro('Valor inválido'); return }
    setSalvando(true); setErro('')
    try {
      const url    = isEdicao ? `/api/admin/cupons/${cupom!.id}` : '/api/admin/cupons'
      const method = isEdicao ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valor:        Number(form.valor),
          pedidoMinimo: Number(form.pedidoMinimo || 0),
          usoMaximo:    form.usoMaximo ? Number(form.usoMaximo) : null,
          validade:     form.validade || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErro(d.error || 'Erro ao salvar')
        return
      }
      onSalvo()
    } catch {
      setErro('Erro de rede. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const labelInput = 'block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5'
  const input      = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8f8f7] flex items-center justify-center">
              <Tag size={20} style={{ color: '#3cbfb3' }} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">
                {isEdicao ? `Editar: ${cupom!.codigo}` : 'Novo Cupom'}
              </h2>
              <p className="text-xs text-gray-400">
                {isEdicao ? 'Altere os campos desejados' : 'Preencha os dados do cupom'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertTriangle size={15} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{erro}</p>
            </div>
          )}

          {/* Código */}
          <div>
            <label className={labelInput}>Código do Cupom *</label>
            <div className="flex gap-2">
              <input
                value={form.codigo}
                onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                className={`${input} flex-1 font-mono font-bold tracking-wider`}
                placeholder="SIXXIS10"
                maxLength={20}
              />
              <button type="button" onClick={gerarCodigo}
                className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#3cbfb3] hover:border-[#3cbfb3]/40 text-xs font-medium transition whitespace-nowrap">
                Gerar
              </button>
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(form.codigo); setCopiado(true); setTimeout(() => setCopiado(false), 2000) }}
                className="w-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-[#3cbfb3] transition">
                {copiado ? <CheckCircle size={15} className="text-emerald-500" /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          {/* Tipo + Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelInput}>Tipo</label>
              <div className="relative">
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                  className={`${input} appearance-none pr-8`}
                >
                  <option value="PERCENTUAL">Percentual (%)</option>
                  <option value="VALOR_FIXO">Valor fixo (R$)</option>
                  <option value="FRETE_GRATIS">Frete grátis</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelInput}>
                {form.tipo === 'PERCENTUAL' ? 'Desconto (%)' : form.tipo === 'VALOR_FIXO' ? 'Desconto (R$)' : 'Valor mínimo p/ frete'}
              </label>
              <input
                type="number" min="0"
                max={form.tipo === 'PERCENTUAL' ? 100 : undefined}
                value={form.valor}
                onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                className={input}
                placeholder={form.tipo === 'PERCENTUAL' ? '10' : '50'}
              />
            </div>
          </div>

          {/* Uso máximo + Pedido mínimo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelInput}>Usos máximos</label>
              <input
                type="number" min="1"
                value={form.usoMaximo}
                onChange={(e) => setForm((p) => ({ ...p, usoMaximo: e.target.value }))}
                className={input}
                placeholder="Ilimitado"
              />
              <p className="text-[10px] text-gray-400 mt-1">Deixe vazio para ilimitado</p>
            </div>
            <div>
              <label className={labelInput}>Pedido mínimo (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.pedidoMinimo}
                onChange={(e) => setForm((p) => ({ ...p, pedidoMinimo: e.target.value }))}
                className={input}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Validade */}
          <div>
            <label className={labelInput}>Validade</label>
            <input
              type="date"
              value={form.validade}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm((p) => ({ ...p, validade: e.target.value }))}
              className={input}
            />
            <p className="text-[10px] text-gray-400 mt-1">Deixe vazio para sem prazo de expiração</p>
          </div>

          {/* Descrição */}
          <div>
            <label className={labelInput}>Descrição interna (opcional)</label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
              className={input}
              placeholder="Ex: Campanha de verão 2025"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            {([
              { key: 'ativo'          as const, label: 'Cupom ativo',           desc: 'Cupom disponível para uso pelos clientes' },
              { key: 'primeiraCompra' as const, label: 'Apenas primeira compra', desc: 'Válido somente para novos clientes sem pedidos anteriores' },
            ] as const).map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, [item.key]: !p[item.key] }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${form[item.key] ? 'bg-[#3cbfb3]' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={handleSalvar} disabled={salvando}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b' }}
          >
            {salvando ? (
              <><div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />&nbsp;Salvando...</>
            ) : (
              <><CheckCircle size={16} />{isEdicao ? 'Salvar alterações' : 'Criar cupom'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MODAL HISTÓRICO DE USOS ───────────────────────────────────────────────────

interface UsoItem {
  id: string
  usadoEm: string
  valorDesconto: number
  emailCliente: string | null
  nomeCliente: string | null
  cliente: { nome: string; email: string } | null
}

function ModalUsos({ cupom, onClose }: { cupom: Cupom; onClose: () => void }) {
  const [usos, setUsos]         = useState<UsoItem[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [economia, setEconomia] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/cupons/${cupom.id}/usos?page=${page}&limit=15`)
      .then((r) => r.json())
      .then((d) => {
        setUsos(d.usos || [])
        setTotal(d.total || 0)
        setEconomia(d.economiaTotal || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [cupom.id, page])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-[#3cbfb3]" />
              Histórico: <span className="font-mono text-[#3cbfb3]">{cupom.codigo}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {total} uso{total !== 1 ? 's' : ''} · Economia total gerada: {formatValor(economia)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-100">
          {[
            { label: 'Total de usos',  valor: total,                        cor: '#3cbfb3' },
            { label: 'Economia gerada',valor: formatValor(economia),        cor: '#16a34a' },
            { label: 'Restam',         valor: cupom.usoMaximo ? `${cupom.usoMaximo - cupom.totalUsos} usos` : '∞', cor: '#7c3aed' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-3 text-center border border-gray-100">
              <p className="text-lg font-black" style={{ color: s.cor }}>{s.valor}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : usos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users size={40} className="text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Este cupom ainda não foi utilizado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2 bg-gray-50">
                {['Cliente', 'Desconto', 'Data'].map((h) => (
                  <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</span>
                ))}
              </div>
              {usos.map((uso) => {
                const nome  = uso.cliente?.nome  || uso.nomeCliente  || 'Cliente'
                const email = uso.cliente?.email || uso.emailCliente || '—'
                return (
                  <div key={uso.id} className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 items-center hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#0f2e2b] text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {nome[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{nome}</p>
                        <p className="text-xs text-gray-400 truncate">{email}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                      -{formatValor(uso.valorDesconto)}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {dataRelativa(uso.usadoEm)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Paginação */}
        {total > 15 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">{total} registros</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-40 transition">
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm text-gray-600 px-2 py-1">Página {page}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={usos.length < 15}
                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-40 transition">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export default function AdminCupons() {
  const [cupons, setCupons]               = useState<Cupom[]>([])
  const [stats, setStats]                 = useState<Stats | null>(null)
  const [loading, setLoading]             = useState(true)
  const [busca, setBusca]                 = useState('')
  const [filtroStatus, setFiltroStatus]   = useState('')
  const [filtroTipo, setFiltroTipo]       = useState('')
  const [modalCriar, setModalCriar]       = useState(false)
  const [cupomEditando, setCupomEditando] = useState<Cupom | null>(null)
  const [cupomUsos, setCupomUsos]         = useState<Cupom | null>(null)
  const [deletando, setDeletando]         = useState<string | null>(null)
  const [page, setPage]                   = useState(1)
  const [total, setTotal]                 = useState(0)

  const buscarCupons = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (busca)         params.set('busca',  busca)
    if (filtroStatus)  params.set('status', filtroStatus)
    if (filtroTipo)    params.set('tipo',   filtroTipo)
    params.set('page', String(page))
    try {
      const res  = await fetch(`/api/admin/cupons?${params}`)
      const data = await res.json()
      setCupons(data.cupons || [])
      setStats(data.stats  || null)
      setTotal(data.total  || 0)
    } finally {
      setLoading(false)
    }
  }, [busca, filtroStatus, filtroTipo, page])

  useEffect(() => {
    const t = setTimeout(buscarCupons, busca ? 400 : 0)
    return () => clearTimeout(t)
  }, [buscarCupons])

  async function excluirCupom(id: string, codigo: string) {
    if (!confirm(`Excluir o cupom "${codigo}"? Esta ação não pode ser desfeita.`)) return
    setDeletando(id)
    await fetch(`/api/admin/cupons/${id}`, { method: 'DELETE' })
    setDeletando(null)
    buscarCupons()
  }

  function statusCupom(c: Cupom) {
    if (!c.ativo)   return { label: 'Inativo',  cor: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' }
    if (c.expirado) return { label: 'Expirado', cor: '#dc2626', bg: '#fee2e2', border: '#fecaca' }
    if (c.esgotado) return { label: 'Esgotado', cor: '#d97706', bg: '#fef3c7', border: '#fde68a' }
    return           { label: 'Ativo',   cor: '#059669', bg: '#d1fae5', border: '#a7f3d0' }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Tag size={22} className="text-[#3cbfb3]" />
            Cupons de Desconto
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Gerencie cupons, prazos, usos e histórico completo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={buscarCupons}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition">
            <RefreshCcw size={16} />
          </button>
          <button
            onClick={() => setModalCriar(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:shadow-md hover:-translate-y-px"
            style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b' }}
          >
            <Plus size={16} /> Novo Cupom
          </button>
        </div>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total de Cupons', valor: stats.totalCupons,                                      cor: '#3cbfb3', bg: '#e8f8f7', icone: Tag          },
            { label: 'Cupons Ativos',   valor: stats.totalAtivos,                                      cor: '#059669', bg: '#d1fae5', icone: CheckCircle  },
            { label: 'Cupons Inativos', valor: stats.totalInativos,                                    cor: '#6b7280', bg: '#f3f4f6', icone: X            },
            { label: 'Economia Gerada', valor: formatValor(stats.totalEconomia),                       cor: '#2563eb', bg: '#dbeafe', icone: TrendingDown },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
                <s.icone size={20} style={{ color: s.cor }} />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{s.valor}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FILTROS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={busca}
              onChange={(e) => { setBusca(e.target.value.toUpperCase()); setPage(1) }}
              placeholder="Buscar pelo código..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition"
            />
          </div>

          {[
            {
              value: filtroStatus,
              onChange: (v: string) => { setFiltroStatus(v); setPage(1) },
              options: [
                { value: '',          label: 'Todos os status' },
                { value: 'ativo',     label: 'Ativos'          },
                { value: 'inativo',   label: 'Inativos'        },
                { value: 'expirado',  label: 'Expirados'       },
              ],
            },
            {
              value: filtroTipo,
              onChange: (v: string) => { setFiltroTipo(v); setPage(1) },
              options: [
                { value: '',             label: 'Todos os tipos'   },
                { value: 'PERCENTUAL',   label: 'Percentual (%)'  },
                { value: 'VALOR_FIXO',   label: 'Valor Fixo (R$)' },
                { value: 'FRETE_GRATIS', label: 'Frete Grátis'    },
              ],
            },
          ].map((sel, i) => (
            <div key={i} className="relative">
              <select
                value={sel.value}
                onChange={(e) => sel.onChange(e.target.value)}
                className="appearance-none border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#3cbfb3] transition cursor-pointer"
              >
                {sel.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          ))}

          {(filtroStatus || filtroTipo || busca) && (
            <button
              onClick={() => { setBusca(''); setFiltroStatus(''); setFiltroTipo(''); setPage(1) }}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 px-3 py-2.5 transition-colors"
            >
              <X size={13} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50/80 border-b border-gray-100">
          {['Cupom', 'Tipo', 'Usos', 'Validade', 'Status', 'Ações'].map((h) => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 bg-gray-100 animate-pulse rounded-lg" />
                    <div className="h-3 w-16 bg-gray-100 animate-pulse rounded-lg" />
                  </div>
                </div>
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 animate-pulse rounded-lg" />
                ))}
                <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-xl" />
              </div>
            ))}
          </div>
        ) : cupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Tag size={36} className="text-gray-200" />
            </div>
            <p className="text-base font-semibold text-gray-400 mb-1">
              {busca || filtroStatus || filtroTipo ? 'Nenhum cupom encontrado' : 'Nenhum cupom cadastrado'}
            </p>
            <p className="text-sm text-gray-300 mb-4">
              {busca || filtroStatus || filtroTipo ? 'Tente ajustar os filtros' : 'Crie seu primeiro cupom de desconto'}
            </p>
            {!busca && !filtroStatus && !filtroTipo && (
              <button
                onClick={() => setModalCriar(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b' }}
              >
                <Plus size={16} /> Criar primeiro cupom
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {cupons.map((c) => {
              const st     = statusCupom(c)
              const dias   = diasRestantes(c.validade)
              const pctUso = c.usoMaximo ? Math.min(100, (c.totalUsos / c.usoMaximo) * 100) : 0

              return (
                <div
                  key={c.id}
                  className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors group"
                >
                  {/* Cupom */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: c.ativo && !c.expirado ? '#e8f8f7' : '#f3f4f6' }}
                    >
                      <Tag size={16} style={{ color: c.ativo && !c.expirado ? '#3cbfb3' : '#9ca3af' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-gray-900 font-mono tracking-wider">{c.codigo}</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(c.codigo)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-[#3cbfb3]"
                          title="Copiar código"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      {c.descricao && (
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">{c.descricao}</p>
                      )}
                      {c.primeiraCompra && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 mt-0.5 inline-block">
                          1ª compra
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tipo */}
                  <TipoBadge tipo={c.tipo} valor={c.valor} />

                  {/* Usos */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-900">{c.totalUsos}</span>
                      <span className="text-xs text-gray-400">
                        {c.usoMaximo ? `/ ${c.usoMaximo}` : '∞'}
                      </span>
                    </div>
                    {c.usoMaximo && (
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pctUso}%`,
                            backgroundColor: pctUso >= 90 ? '#ef4444' : pctUso >= 70 ? '#f59e0b' : '#3cbfb3',
                          }}
                        />
                      </div>
                    )}
                    {c.pedidoMinimo > 0 && (
                      <p className="text-[10px] text-gray-400 mt-0.5">Mín: {formatValor(c.pedidoMinimo)}</p>
                    )}
                  </div>

                  {/* Validade */}
                  <div>
                    {c.validade ? (
                      <div>
                        <p className="text-sm text-gray-700">
                          {new Date(c.validade).toLocaleDateString('pt-BR')}
                        </p>
                        {dias !== null && (
                          <p className={`text-xs mt-0.5 flex items-center gap-1 ${
                            dias < 0 ? 'text-red-500' :
                            dias <= 3 ? 'text-amber-500' :
                            dias <= 7 ? 'text-yellow-600' : 'text-gray-400'
                          }`}>
                            <Clock size={10} />
                            {dias < 0 ? 'Expirado' :
                             dias === 0 ? 'Expira hoje!' :
                             dias === 1 ? 'Expira amanhã' :
                             `${dias} dias restantes`}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Sem prazo</span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border"
                      style={{ backgroundColor: st.bg, color: st.cor, borderColor: st.border }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.cor }} />
                      {st.label}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setCupomUsos(c)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-[#3cbfb3] hover:border-[#3cbfb3]/40 transition-all"
                      title="Ver histórico de usos"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => setCupomEditando(c)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-[#3cbfb3] hover:border-[#3cbfb3]/40 transition-all"
                      title="Editar cupom"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => excluirCupom(c.id, c.codigo)}
                      disabled={deletando === c.id}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 transition-all disabled:opacity-40"
                      title="Excluir cupom"
                    >
                      {deletando === c.id
                        ? <div className="w-3.5 h-3.5 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                        : <Trash2 size={15} />
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Paginação */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">{total} cupons encontrados</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-gray-700">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAIS */}
      {(modalCriar || cupomEditando) && (
        <ModalCupom
          cupom={cupomEditando}
          onClose={() => { setModalCriar(false); setCupomEditando(null) }}
          onSalvo={() => { setModalCriar(false); setCupomEditando(null); buscarCupons() }}
        />
      )}
      {cupomUsos && (
        <ModalUsos cupom={cupomUsos} onClose={() => setCupomUsos(null)} />
      )}
    </div>
  )
}
