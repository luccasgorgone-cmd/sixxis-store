'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, RefreshCw, Search, ChevronRight, Circle,
  User, Bot, TrendingUp, Calendar, X,
} from 'lucide-react'

interface MensagemPreview {
  id: string
  conteudo: string
  createdAt: string
}

interface ConversaListItem {
  id: string
  sessaoId: string
  paginaOrigem: string | null
  status: string
  totalMensagens: number
  createdAt: string
  ultimaMensagem: string | null
  mensagens: MensagemPreview[]
  _count: { mensagens: number }
}

interface Mensagem {
  id: string
  role: 'user' | 'assistant'
  conteudo: string
  latenciaMs: number | null
  createdAt: string
}

interface ConversaDetalhe extends ConversaListItem {
  mensagens: Mensagem[]
}

interface Metricas {
  total: number
  mediasMensagens: number
  mediaDuracaoMin: number
  atendimentosHoje: number
  aoVivo: number
}

interface DadosLista {
  conversas: ConversaListItem[]
  total: number
  paginas: number
  metricas: Metricas
}

const fmtData = (d: string | null) =>
  d ? new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—'

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cor: string; label: string; dot: string }> = {
    ativa:       { cor: 'bg-emerald-100 text-emerald-700', label: 'Ativa',       dot: 'bg-emerald-500 animate-pulse' },
    encerrada:   { cor: 'bg-gray-100 text-gray-600',       label: 'Encerrada',   dot: 'bg-gray-400' },
    transferida: { cor: 'bg-blue-100 text-blue-700',       label: 'Transferida', dot: 'bg-blue-500' },
    abandonada:  { cor: 'bg-orange-100 text-orange-700',   label: 'Abandonada',  dot: 'bg-orange-400' },
  }
  const c = cfg[status] || { cor: 'bg-gray-100 text-gray-600', label: status, dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${c.cor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

export default function LunaRelatorioPage() {
  const [dados, setDados] = useState<DadosLista | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [conversaSelecionada, setConversaSelecionada] = useState<ConversaListItem | null>(null)
  const [conversaDetalhe, setConversaDetalhe] = useState<ConversaDetalhe | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)

  const [periodo, setPeriodo] = useState('7d')
  const [status, setStatus] = useState('')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const buscarDados = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        pagina: String(pagina),
        limite: '20',
        periodo,
        ...(status && { status }),
        ...(busca && { busca }),
      })
      const res = await fetch(`/api/admin/luna-relatorio?${params}`, { cache: 'no-store' })
      const data = await res.json()
      setDados(data)
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
    } finally {
      setCarregando(false)
    }
  }, [pagina, periodo, status, busca])

  const buscarDetalhe = async (id: string) => {
    setCarregandoDetalhe(true)
    try {
      const res = await fetch(`/api/admin/luna-relatorio/${id}`, { cache: 'no-store' })
      const data = await res.json()
      setConversaDetalhe(data)
    } catch (err) {
      console.error('Erro ao buscar detalhe:', err)
    } finally {
      setCarregandoDetalhe(false)
    }
  }

  useEffect(() => { buscarDados() }, [buscarDados])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(buscarDados, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, buscarDados])

  const periodoLabel = periodo === '1d' ? 'Hoje'
    : periodo === '7d' ? 'Últimos 7 dias'
    : periodo === '30d' ? 'Últimos 30 dias' : 'Últimos 90 dias'

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3cbfb3] flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            Relatório Luna
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Todos os atendimentos do agente Luna — histórico e ao vivo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(a => !a)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              autoRefresh ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <Circle size={8} className={autoRefresh ? 'fill-emerald-500 animate-pulse' : 'fill-gray-400'} />
            {autoRefresh ? 'Ao vivo' : 'Pausado'}
          </button>
          <button
            onClick={buscarDados}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-all"
          >
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>
      </div>

      {/* MÉTRICAS */}
      {dados?.metricas && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Circle, label: 'Ao Vivo Agora', valor: dados.metricas.aoVivo, cor: 'text-emerald-500', bg: 'bg-emerald-50', pulse: dados.metricas.aoVivo > 0 },
            { icon: Calendar, label: 'Hoje', valor: dados.metricas.atendimentosHoje, cor: 'text-blue-500', bg: 'bg-blue-50' },
            { icon: TrendingUp, label: periodoLabel, valor: dados.metricas.total, cor: 'text-[#3cbfb3]', bg: 'bg-[#e8f8f7]' },
            { icon: MessageSquare, label: 'Média por conversa', valor: `${dados.metricas.mediasMensagens} msgs`, cor: 'text-purple-500', bg: 'bg-purple-50' },
          ].map((m, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                <m.icon size={16} className={`${m.cor} ${m.pulse ? 'animate-pulse' : ''}`} />
              </div>
              <p className={`text-2xl font-black ${m.cor}`}>{m.valor}</p>
              <p className="text-xs text-gray-400 mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* FILTROS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={busca}
              onChange={e => { setBusca(e.target.value); setPagina(1) }}
              placeholder="Buscar nas conversas..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20"
            />
          </div>
          <select
            value={periodo}
            onChange={e => { setPeriodo(e.target.value); setPagina(1) }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#3cbfb3]"
          >
            <option value="1d">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPagina(1) }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#3cbfb3]"
          >
            <option value="">Todos os status</option>
            <option value="ativa">Ativas</option>
            <option value="encerrada">Encerradas</option>
            <option value="transferida">Transferidas</option>
            <option value="abandonada">Abandonadas</option>
          </select>
        </div>
      </div>

      {/* LISTA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-sm font-bold text-gray-900">
            {dados?.total || 0} conversas encontradas
          </p>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#3cbfb3] border-t-transparent animate-spin" />
          </div>
        ) : !dados || dados.conversas.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {dados.conversas.map(conv => {
              const preview = conv.mensagens?.[0]?.conteudo?.substring(0, 100)
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setConversaSelecionada(conv)
                    buscarDetalhe(conv.sessaoId || conv.id)
                  }}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/80 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#e8f8f7] flex items-center justify-center shrink-0">
                    <MessageSquare size={16} style={{ color: '#3cbfb3' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-gray-900 truncate">Visitante</p>
                      <StatusBadge status={conv.status} />
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {preview || 'Sem mensagens do usuário ainda'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[10px] text-gray-400">{fmtData(conv.createdAt)}</span>
                      <span className="text-[10px] text-gray-400">{conv._count?.mensagens || 0} msgs</span>
                      {conv.paginaOrigem && (
                        <span className="text-[10px] text-gray-400 truncate max-w-[160px]">
                          {conv.paginaOrigem.replace(/https?:\/\/[^/]+/, '') || '/'}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </button>
              )
            })}
          </div>
        )}

        {/* Paginação */}
        {dados && dados.paginas > 1 && (
          <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-all"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-500">
              Página {pagina} de {dados.paginas}
            </span>
            <button
              onClick={() => setPagina(p => Math.min(dados.paginas, p + 1))}
              disabled={pagina === dados.paginas}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-all"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>

      {/* DRAWER */}
      {conversaSelecionada && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setConversaSelecionada(null); setConversaDetalhe(null) }}
          />
          <div className="relative w-full max-w-lg bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="min-w-0">
                <p className="font-black text-gray-900 truncate">Conversa com visitante</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmtData(conversaSelecionada.createdAt)}
                  {' · '}{conversaSelecionada._count?.mensagens || 0} mensagens
                </p>
              </div>
              <button
                onClick={() => { setConversaSelecionada(null); setConversaDetalhe(null) }}
                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/40">
              {carregandoDetalhe ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 rounded-full border-2 border-[#3cbfb3] border-t-transparent animate-spin" />
                </div>
              ) : !conversaDetalhe?.mensagens?.length ? (
                <p className="text-center text-sm text-gray-400 py-10">Sem mensagens salvas</p>
              ) : (
                conversaDetalhe.mensagens.map(msg => (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'assistant' ? 'bg-[#3cbfb3]' : 'bg-gray-300'
                    }`}>
                      {msg.role === 'assistant'
                        ? <Bot size={12} className="text-white" />
                        : <User size={12} className="text-gray-600" />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                      msg.role === 'assistant'
                        ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                        : 'bg-[#3cbfb3] text-white rounded-tr-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-line leading-relaxed">{msg.conteudo}</p>
                      <p className={`text-[9px] mt-1 ${
                        msg.role === 'assistant' ? 'text-gray-400' : 'text-white/70'
                      }`}>
                        {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {msg.latenciaMs != null && msg.role === 'assistant' && (
                          <span> · {msg.latenciaMs}ms</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 px-5 py-3 bg-white">
              <div className="flex items-center justify-between text-xs text-gray-400 gap-2">
                <span className="truncate">
                  Página: {conversaSelecionada.paginaOrigem?.replace(/https?:\/\/[^/]+/, '') || '—'}
                </span>
                <StatusBadge status={conversaSelecionada.status} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
