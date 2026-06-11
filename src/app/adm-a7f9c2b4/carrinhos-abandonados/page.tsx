'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingCart, RefreshCcw, Mail, Phone, ChevronDown,
  Package, Clock, TrendingUp, Users, MessageCircle, Send,
} from 'lucide-react'

// Escala única de etapas (espelha CarrinhoCliente.etapaAtual / carrinho-cliente-sync).
const ETAPA_LABEL: Record<number, string> = {
  1: 'Carrinho',
  2: 'Identificação',
  3: 'Endereço',
  4: 'Frete',
  5: 'Pagamento',
}
const ETAPA_COR: Record<number, string> = {
  1: '#94a3b8',
  2: '#3b82f6',
  3: '#8b5cf6',
  4: '#f59e0b',
  5: '#10b981',
}

interface ItemCarrinho {
  produtoId: string
  slug?: string
  nome: string
  variacao?: string | null
  qtd: number
  preco: number
}
interface CarrinhoAbandonado {
  id: string
  clienteId: string
  nome: string | null
  email: string
  telefone: string | null
  itens: ItemCarrinho[]
  totalItens: number
  valorTotal: number
  etapaAtual: number
  atualizadoEm: string
  criadoEm: string
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function haQuantoTempo(d: string): string {
  const ms = Date.now() - new Date(d).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const dias = Math.floor(h / 24)
  if (dias < 30) return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
  return `há ${Math.floor(dias / 30)} ${Math.floor(dias / 30) === 1 ? 'mês' : 'meses'}`
}

function soDigitos(v: string | null): string {
  return (v || '').replace(/\D/g, '')
}

export default function CarrinhosAbandonadosPage() {
  const [carrinhos, setCarrinhos] = useState<CarrinhoAbandonado[]>([])
  const [valorTotalGeral, setValorTotalGeral] = useState(0)
  const [loading, setLoading] = useState(true)
  const [ordenar, setOrdenar] = useState<'recencia' | 'valor'>('valor')
  const [horas, setHoras] = useState(1)
  const [expandidoId, setExpandidoId] = useState<string | null>(null)

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ ordenar, horas: String(horas) })
      const res = await fetch(`/api/admin/carrinhos-abandonados?${params}`, {
        cache: 'no-store', credentials: 'include',
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setCarrinhos(Array.isArray(data.carrinhos) ? data.carrinhos : [])
      setValorTotalGeral(Number(data.valorTotalGeral) || 0)
    } catch (err) {
      console.error('[admin/carrinhos-abandonados] fetch falhou:', err)
      setCarrinhos([])
      setValorTotalGeral(0)
    } finally {
      setLoading(false)
    }
  }, [ordenar, horas])

  useEffect(() => {
    let alive = true
    const t = setTimeout(() => { if (alive) buscar() }, 200)
    return () => { alive = false; clearTimeout(t) }
  }, [buscar])

  const ticketMedio = carrinhos.length > 0 ? valorTotalGeral / carrinhos.length : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 mb-6 md:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShoppingCart size={22} className="text-[#3cbfb3]" /> Carrinhos Abandonados
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Clientes cadastrados com carrinho em aberto e sem compra há mais de {horas}h
          </p>
        </div>
        <button
          onClick={buscar}
          className="shrink-0 flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-colors"
        >
          <RefreshCcw size={15} /> <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Carrinhos abandonados', valor: String(carrinhos.length),       icone: ShoppingCart, cor: '#3cbfb3' },
          { label: 'Valor recuperável',     valor: fmtBRL(valorTotalGeral),         icone: TrendingUp,   cor: '#8b5cf6' },
          { label: 'Ticket médio',          valor: fmtBRL(ticketMedio),             icone: Users,        cor: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${s.cor}15` }}>
              <s.icone size={18} style={{ color: s.cor }} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black text-gray-900 truncate">{s.valor}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CONTROLES */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ordenar</label>
          <select
            value={ordenar}
            onChange={e => setOrdenar(e.target.value as 'recencia' | 'valor')}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#3cbfb3] bg-white"
          >
            <option value="valor">Maior valor</option>
            <option value="recencia">Mais recentes</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Inativo há</label>
          <select
            value={horas}
            onChange={e => setHoras(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#3cbfb3] bg-white"
          >
            <option value={1}>+1 hora</option>
            <option value={3}>+3 horas</option>
            <option value={6}>+6 horas</option>
            <option value={24}>+24 horas</option>
            <option value={72}>+3 dias</option>
          </select>
        </div>
      </div>

      {/* LISTA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-[2.2fr_1.6fr_0.8fr_1fr_1.1fr_1fr_auto] gap-4 px-5 py-3 bg-gray-50/80 border-b border-gray-100">
          {['Cliente', 'Contato', 'Itens', 'Valor total', 'Etapa atual', 'Última atividade', ''].map((h, i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</span>
          ))}
        </div>

        {loading && (
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-[2.2fr_1.6fr_0.8fr_1fr_1.1fr_1fr_auto] gap-4 px-5 py-4 items-center">
                {[...Array(7)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        )}

        {!loading && carrinhos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingCart size={48} className="text-gray-200 mb-4" />
            <p className="text-base font-semibold text-gray-400">Nenhum carrinho abandonado</p>
            <p className="text-sm text-gray-300 mt-1">
              Nenhum cliente cadastrado tem carrinho em aberto há mais de {horas}h.
            </p>
          </div>
        )}

        {!loading && carrinhos.length > 0 && (
          <div className="divide-y divide-gray-50">
            {carrinhos.map(c => {
              const aberto = expandidoId === c.id
              const tel = soDigitos(c.telefone)
              const etapaCor = ETAPA_COR[c.etapaAtual] || '#94a3b8'
              return (
                <div key={c.id}>
                  {/* LINHA */}
                  <div
                    onClick={() => setExpandidoId(aberto ? null : c.id)}
                    className="grid grid-cols-1 md:grid-cols-[2.2fr_1.6fr_0.8fr_1fr_1.1fr_1fr_auto] gap-3 md:gap-4 px-5 py-4 items-center hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    {/* Cliente */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-[#0f2e2b]">
                        {(c.nome || c.email)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.nome || 'Sem nome'}</p>
                        <p className="text-xs text-gray-400 truncate md:hidden">{c.email}</p>
                      </div>
                    </div>

                    {/* Contato */}
                    <div className="min-w-0 hidden md:block">
                      <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                        <Mail size={11} className="text-gray-300 shrink-0" /> {c.email}
                      </p>
                      {c.telefone && (
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-gray-300 shrink-0" /> {c.telefone}
                        </p>
                      )}
                    </div>

                    {/* Itens */}
                    <div className="flex items-center gap-1.5 text-sm">
                      <Package size={14} className="text-gray-300" />
                      <span className="font-bold text-gray-900">{c.totalItens}</span>
                      <span className="text-gray-400 text-xs md:hidden">itens</span>
                    </div>

                    {/* Valor */}
                    <span className="text-sm font-black text-gray-900">{fmtBRL(c.valorTotal)}</span>

                    {/* Etapa */}
                    <div>
                      <span
                        className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${etapaCor}18`, color: etapaCor }}
                      >
                        {ETAPA_LABEL[c.etapaAtual] || '—'}
                      </span>
                    </div>

                    {/* Última atividade */}
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={11} className="text-gray-300" /> {haQuantoTempo(c.atualizadoEm)}
                    </span>

                    {/* Chevron */}
                    <ChevronDown
                      size={16}
                      className={`text-gray-300 transition-transform justify-self-end ${aberto ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* DETALHE */}
                  {aberto && (
                    <div className="px-5 pb-5 pt-1 bg-gray-50/40 border-t border-gray-100">
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 pt-4">
                        {/* Itens do carrinho */}
                        <div>
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Itens do carrinho
                          </p>
                          <div className="space-y-2">
                            {c.itens.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate">{it.nome}</p>
                                  {it.variacao && <p className="text-xs text-gray-400">{it.variacao}</p>}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-bold text-gray-900">{fmtBRL(it.preco * it.qtd)}</p>
                                  <p className="text-[11px] text-gray-400">{it.qtd} × {fmtBRL(it.preco)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Ações de recuperação (gancho — envio ainda não implementado) */}
                        <div>
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Recuperação
                          </p>
                          <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-2">
                            <a
                              href={`mailto:${c.email}`}
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-2 w-full text-sm font-semibold px-3 py-2.5 rounded-xl bg-[#3cbfb3]/10 text-[#0f766e] hover:bg-[#3cbfb3] hover:text-white transition-all"
                            >
                              <Mail size={14} /> Enviar e-mail
                            </a>
                            <a
                              href={tel ? `https://wa.me/55${tel}` : undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => { e.stopPropagation(); if (!tel) e.preventDefault() }}
                              className={`flex items-center gap-2 w-full text-sm font-semibold px-3 py-2.5 rounded-xl transition-all ${
                                tel
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white'
                                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                              }`}
                            >
                              <MessageCircle size={14} /> WhatsApp
                            </a>
                            <button
                              type="button"
                              disabled
                              title="Disponível em breve"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-2 w-full text-sm font-semibold px-3 py-2.5 rounded-xl bg-gray-50 text-gray-300 cursor-not-allowed"
                            >
                              <Send size={14} /> Campanha automática
                              <span className="ml-auto text-[10px] font-bold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">em breve</span>
                            </button>
                            <p className="text-[11px] text-gray-400 leading-snug pt-1">
                              Abandonou na etapa <strong>{ETAPA_LABEL[c.etapaAtual] || '—'}</strong> · carrinho criado {haQuantoTempo(c.criadoEm)}.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
