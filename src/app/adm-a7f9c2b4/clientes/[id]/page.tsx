'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Phone, CreditCard, MapPin,
  ShoppingBag, Coins, ShieldOff, ShieldCheck, Calendar,
  TrendingUp, Clock, CheckCircle, XCircle, Package,
  Truck, AlertCircle, RotateCcw
} from 'lucide-react'

const STATUS_PEDIDO: Record<string, { label: string; cor: string; bg: string; icone: React.ElementType }> = {
  PENDENTE:    { label: 'Aguardando',   cor: '#d97706', bg: '#fef3c7', icone: Clock         },
  CONFIRMADO:  { label: 'Confirmado',  cor: '#2563eb', bg: '#dbeafe', icone: CheckCircle   },
  PROCESSANDO: { label: 'Separando',   cor: '#7c3aed', bg: '#ede9fe', icone: Package       },
  ENVIADO:     { label: 'Enviado',     cor: '#7c3aed', bg: '#ede9fe', icone: Truck         },
  ENTREGUE:    { label: 'Entregue',    cor: '#059669', bg: '#d1fae5', icone: CheckCircle   },
  CANCELADO:   { label: 'Cancelado',   cor: '#dc2626', bg: '#fee2e2', icone: XCircle       },
  REEMBOLSADO: { label: 'Reembolsado', cor: '#6b7280', bg: '#f3f4f6', icone: RotateCcw    },
}

type Aba = 'visao' | 'pedidos' | 'cashback' | 'enderecos' | 'seguranca'

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [cliente, setCliente]               = useState<any>(null)
  const [loading, setLoading]               = useState(true)
  const [erro, setErro]                     = useState('')
  const [abaAtiva, setAbaAtiva]             = useState<Aba>('visao')
  const [abaBloqueio, setAbaBloqueio]       = useState(false)
  const [motivoBloqueio, setMotivoBloqueio] = useState('')
  const [salvando, setSalvando]             = useState(false)

  useEffect(() => {
    fetch(`/api/admin/clientes/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setErro(d.error)
        else setCliente(d.cliente || d)
        setLoading(false)
      })
      .catch(() => { setErro('Erro ao carregar cliente'); setLoading(false) })
  }, [id])

  async function toggleBloqueio() {
    if (!cliente) return
    const bloquear = !cliente.bloqueado
    if (bloquear && !motivoBloqueio.trim()) { alert('Informe o motivo do bloqueio'); return }
    setSalvando(true)
    try {
      const res  = await fetch(`/api/admin/clientes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloqueado: bloquear, motivoBloqueio: motivoBloqueio || null }),
      })
      const data = await res.json()
      const c    = data.cliente || data
      setCliente((prev: any) => ({ ...prev, bloqueado: c.bloqueado, motivoBloqueio: c.motivoBloqueio, bloqueadoEm: c.bloqueadoEm }))
      setAbaBloqueio(false)
      setMotivoBloqueio('')
    } finally {
      setSalvando(false)
    }
  }

  function fmtValor(v: number) {
    return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function fmtData(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-9 w-9 bg-gray-100 animate-pulse rounded-xl" />
        <div className="h-8 w-56 bg-gray-100 animate-pulse rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />)}
        </div>
        <div className="lg:col-span-3 h-96 bg-gray-100 animate-pulse rounded-2xl" />
      </div>
    </div>
  )

  if (erro || !cliente) return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={16} /> Voltar
      </button>
      <div className="text-center py-20">
        <AlertCircle size={48} className="mx-auto text-red-300 mb-4" />
        <p className="text-lg font-semibold text-gray-500">{erro || 'Cliente não encontrado'}</p>
      </div>
    </div>
  )

  const pedidos          = cliente.pedidos || []
  const cashbackHistorico = cliente.cashback || []
  const enderecos        = cliente.enderecos || []
  const ticketMedio      = pedidos.length > 0
    ? pedidos.reduce((s: number, p: any) => s + Number(p.total || 0), 0) / pedidos.length
    : 0

  const ABAS: { id: Aba; label: string }[] = [
    { id: 'visao',     label: 'Visão Geral' },
    { id: 'pedidos',   label: `Pedidos (${pedidos.length})` },
    { id: 'cashback',  label: 'Cashback' },
    { id: 'enderecos', label: `Endereços (${enderecos.length})` },
    { id: 'seguranca', label: 'Segurança' },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/adm-a7f9c2b4/clientes')}
            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{cliente.nome || 'Cliente sem nome'}</h1>
            <p className="text-sm text-gray-500">Cadastrado em {fmtData(cliente.createdAt)}</p>
          </div>
        </div>
        {cliente.bloqueado ? (
          <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 font-semibold text-sm">
            <ShieldOff size={16} /> Bloqueado
          </span>
        ) : (
          <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-sm">
            <ShieldCheck size={16} /> Cliente Ativo
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* COLUNA LATERAL */}
        <div className="lg:col-span-1 space-y-4">

          {/* Perfil */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-black mx-auto mb-4"
              style={{ backgroundColor: cliente.bloqueado ? '#ef4444' : '#0f2e2b' }}>
              {(cliente.nome || cliente.email)?.[0]?.toUpperCase() || '?'}
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">{cliente.nome || 'Sem nome'}</h2>
            <p className="text-sm text-gray-400 mb-4">{cliente.email}</p>
            <div className="space-y-2 text-left">
              {cliente.telefone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="text-gray-400 shrink-0" /> {cliente.telefone}
                </div>
              )}
              {cliente.cpf && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard size={14} className="text-gray-400 shrink-0" /> {cliente.cpf}
                </div>
              )}
              {enderecos[0] && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  {enderecos[0].cidade ? `${enderecos[0].cidade}, ` : ''}{enderecos[0].estado}
                </div>
              )}
            </div>
          </div>

          {/* Métricas */}
          {[
            { label: 'Total Gasto',  valor: fmtValor(cliente.totalGasto),  icone: TrendingUp,  cor: '#0f2e2b' },
            { label: 'Pedidos',      valor: String(cliente.totalPedidos),   icone: ShoppingBag, cor: '#3cbfb3' },
            { label: 'Ticket Médio', valor: fmtValor(ticketMedio),          icone: Calendar,    cor: '#8b5cf6' },
            { label: 'Cashback',     valor: fmtValor(cliente.cashbackSaldo), icone: Coins,      cor: '#f59e0b' },
          ].map((m, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${m.cor}15` }}>
                <m.icone size={18} style={{ color: m.cor }} />
              </div>
              <div>
                <p className="text-lg font-black text-gray-900">{m.valor}</p>
                <p className="text-xs text-gray-500">{m.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Abas */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {ABAS.map(aba => (
                <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
                  className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                    abaAtiva === aba.id
                      ? 'border-[#3cbfb3] text-[#3cbfb3] bg-[#3cbfb3]/5'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}>
                  {aba.label}
                </button>
              ))}
            </div>

            <div className="p-6">

              {/* VISÃO GERAL */}
              {abaAtiva === 'visao' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Informações da Conta</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Nome completo',  valor: cliente.nome || '—' },
                        { label: 'E-mail',         valor: cliente.email },
                        { label: 'CPF',            valor: cliente.cpf || '—' },
                        { label: 'Telefone',       valor: cliente.telefone || '—' },
                        { label: 'Cadastrado em',  valor: fmtData(cliente.createdAt) },
                        { label: 'Última compra',  valor: fmtData(cliente.ultimaCompra) },
                      ].map((item, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                          <p className="text-sm font-semibold text-gray-900 break-all">{item.valor}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {pedidos.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Últimos Pedidos</h3>
                      <div className="space-y-2">
                        {pedidos.slice(0, 3).map((p: any) => {
                          const cfg  = STATUS_PEDIDO[p.status] || STATUS_PEDIDO.PENDENTE
                          const Icon = cfg.icone
                          return (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-gray-400">#{p.id?.slice(-6).toUpperCase()}</span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: cfg.bg, color: cfg.cor }}>
                                  <Icon size={10} />{cfg.label}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{fmtValor(Number(p.total || 0))}</p>
                                <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {pedidos.length > 3 && (
                        <button onClick={() => setAbaAtiva('pedidos')} className="mt-2 text-sm text-[#3cbfb3] hover:underline">
                          Ver todos os {pedidos.length} pedidos →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PEDIDOS */}
              {abaAtiva === 'pedidos' && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
                    Histórico Completo — {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
                  </h3>
                  {pedidos.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-400 text-sm">Nenhum pedido encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pedidos.map((p: any) => {
                        const cfg  = STATUS_PEDIDO[p.status] || STATUS_PEDIDO.PENDENTE
                        const Icon = cfg.icone
                        return (
                          <div key={p.id} className="border border-gray-100 rounded-xl p-4 hover:border-[#3cbfb3]/30 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-xs font-mono text-gray-400">#{p.id?.slice(-8).toUpperCase()}</span>
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: cfg.bg, color: cfg.cor }}>
                                    <Icon size={10} />{cfg.label}
                                  </span>
                                </div>
                                {p.itens?.length > 0 && (
                                  <p className="text-sm text-gray-600 mb-1">
                                    {p.itens.map((it: any) => it.nomeProduto || it.produto?.nome).filter(Boolean).join(', ')}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400">{fmtData(p.createdAt)}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-base font-black text-gray-900">{fmtValor(Number(p.total || 0))}</p>
                                {p.formaPagamento && <p className="text-xs text-gray-400">{p.formaPagamento}</p>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* CASHBACK */}
              {abaAtiva === 'cashback' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Extrato de Cashback</h3>
                    <div className="px-4 py-2 rounded-xl text-base font-black" style={{ backgroundColor: '#e8f8f7', color: '#3cbfb3' }}>
                      Saldo: {fmtValor(cliente.cashbackSaldo)}
                    </div>
                  </div>
                  {cashbackHistorico.length === 0 ? (
                    <div className="text-center py-12">
                      <Coins size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-400 text-sm">Nenhuma transação de cashback</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cashbackHistorico.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{t.descricao}</p>
                            <p className="text-xs text-gray-400">{fmtData(t.createdAt)}</p>
                          </div>
                          <span className={`text-sm font-black ${t.tipo === 'credito' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {t.tipo === 'credito' ? '+' : '-'}{fmtValor(Math.abs(t.valor))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ENDEREÇOS */}
              {abaAtiva === 'enderecos' && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Endereços Cadastrados</h3>
                  {enderecos.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-400 text-sm">Nenhum endereço cadastrado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {enderecos.map((e: any, i: number) => (
                        <div key={e.id || i} className={`border rounded-xl p-4 ${e.principal ? 'border-[#3cbfb3]/40 bg-[#f0fffe]' : 'border-gray-100'}`}>
                          <div className="flex items-start gap-3">
                            <MapPin size={16} className="text-[#3cbfb3] mt-0.5 shrink-0" />
                            <div>
                              {e.principal && (
                                <span className="inline-block text-[10px] font-bold text-[#3cbfb3] bg-[#3cbfb3]/10 px-2 py-0.5 rounded-full mb-1">Principal</span>
                              )}
                              <p className="text-sm text-gray-900">{e.logradouro}, {e.numero}{e.complemento ? `, ${e.complemento}` : ''}</p>
                              <p className="text-sm text-gray-600">{e.bairro} — {e.cidade}, {e.estado}</p>
                              <p className="text-xs text-gray-400">CEP: {e.cep}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SEGURANÇA */}
              {abaAtiva === 'seguranca' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Status de Acesso</h3>
                    {cliente.bloqueado ? (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4">
                        <div className="flex items-start gap-3">
                          <ShieldOff size={20} className="text-red-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-red-700">Cliente bloqueado</p>
                            {cliente.motivoBloqueio && (
                              <p className="text-sm text-red-600 mt-1">Motivo: {cliente.motivoBloqueio}</p>
                            )}
                            {cliente.bloqueadoEm && (
                              <p className="text-xs text-red-400 mt-1">Desde: {fmtData(cliente.bloqueadoEm)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-4">
                        <div className="flex items-center gap-3">
                          <ShieldCheck size={20} className="text-emerald-600" />
                          <p className="text-sm font-bold text-emerald-700">Conta ativa — acesso liberado</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {!abaBloqueio ? (
                    <button
                      onClick={() => setAbaBloqueio(true)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                        cliente.bloqueado
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {cliente.bloqueado ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                      {cliente.bloqueado ? 'Desbloquear Cliente' : 'Bloquear Cliente'}
                    </button>
                  ) : (
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-4">
                      <h4 className="text-sm font-bold text-gray-900">
                        {cliente.bloqueado ? 'Confirmar desbloqueio?' : 'Confirmar bloqueio?'}
                      </h4>
                      {!cliente.bloqueado && (
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                            Motivo do bloqueio *
                          </label>
                          <input
                            type="text"
                            value={motivoBloqueio}
                            onChange={e => setMotivoBloqueio(e.target.value)}
                            placeholder="Ex: tentativa de fraude, chargeback..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20"
                          />
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={toggleBloqueio}
                          disabled={salvando}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-70 ${
                            cliente.bloqueado
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          {salvando ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          ) : cliente.bloqueado ? (
                            <><ShieldCheck size={15} /> Confirmar desbloqueio</>
                          ) : (
                            <><ShieldOff size={15} /> Confirmar bloqueio</>
                          )}
                        </button>
                        <button
                          onClick={() => { setAbaBloqueio(false); setMotivoBloqueio('') }}
                          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
