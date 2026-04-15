'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, Send, ChevronDown, Loader2, ExternalLink, ShoppingCart, ShoppingBag, Eye,
} from 'lucide-react'
import Link from 'next/link'
import { LunaAvatar, LunaAvatarMini } from '@/components/ui/LunaAvatar'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Mensagem {
  id:             string
  role:           'user' | 'assistant'
  content:        string
  timestamp:      Date
  isFollowup?:    boolean
  isEncerramento?: boolean
}

interface LunaConfig {
  ativo:                boolean
  nome:                 string
  saudacao:             string
  corPrimaria:          string
  corSecundaria:        string
  whatsappVendas:       string
  whatsappSuporte:      string
  followupAtivo:        boolean
  followupDelay1:       number
  followupMensagem1:    string
  followupDelay2:       number
  followupMensagem2:    string
  encerramentoAuto:     boolean
  mensagemEncerramento: string
}

interface CTAData {
  slug:  string
  nome:  string
  preco: string
}

const DEFAULT_CONFIG: LunaConfig = {
  ativo:                true,
  nome:                 'Luna',
  saudacao:             'Olá! Sou a Luna, assistente da Sixxis 👋 Como posso te ajudar hoje?',
  corPrimaria:          '#3cbfb3',
  corSecundaria:        '#0f2e2b',
  whatsappVendas:       '5518997474701',
  whatsappSuporte:      '5511934102621',
  followupAtivo:        true,
  followupDelay1:       30,
  followupMensagem1:    'Ficou alguma dúvida sobre o produto que indiquei? Posso também calcular o frete até você — é só me informar o CEP. 😊',
  followupDelay2:       30,
  followupMensagem2:    'Se preferir falar com nossa equipe diretamente, estamos disponíveis pelo WhatsApp: (18) 99747-4701. Foi um prazer atender você!',
  encerramentoAuto:     true,
  mensagemEncerramento: '👋 Encerrando o atendimento por inatividade. Se precisar de ajuda, é só abrir o chat novamente.',
}

// ── CTA parser ────────────────────────────────────────────────────────────────

function parsearCTA(content: string): { text: string; cta: CTAData | null } {
  const match = content.match(/\[CTA\](\{[^}]+\})\[\/CTA\]/)
  if (!match) return { text: content, cta: null }
  try {
    const cta = JSON.parse(match[1]) as CTAData
    const text = content.replace(/\s*\[CTA\]\{[^}]+\}\[\/CTA\]/, '').trim()
    return { text, cta }
  } catch {
    return { text: content, cta: null }
  }
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function parseInline(text: string, corPrimaria: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)]*)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      nodes.push(<strong key={m.index} className="font-bold text-gray-900">{m[1]}</strong>)
    } else {
      const href  = m[3]
      const label = m[2]
      const isExt = href.startsWith('http')
      if (isExt) {
        nodes.push(
          <a key={m.index} href={href} target="_blank" rel="noopener noreferrer"
            className="font-semibold hover:underline inline-flex items-center gap-0.5"
            style={{ color: corPrimaria }}>
            {label}<ExternalLink size={10} />
          </a>
        )
      } else {
        nodes.push(
          <Link key={m.index} href={href} className="font-semibold hover:underline" style={{ color: corPrimaria }}>
            {label}
          </Link>
        )
      }
    }
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function MarkdownMessage({ content, corPrimaria }: { content: string; corPrimaria: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^[-•]\s/.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^[-•]\s/.test(lines[i])) {
        items.push(<li key={i} className="text-gray-700 leading-relaxed">{parseInline(lines[i].replace(/^[-•]\s/, ''), corPrimaria)}</li>)
        i++
      }
      elements.push(<ul key={`ul-${i}`} className="list-disc list-inside space-y-0.5 my-1 pl-1">{items}</ul>)
      continue
    }
    if (line.trim() === '') { elements.push(<div key={`sp-${i}`} className="h-1" />); i++; continue }
    elements.push(<p key={i} className="leading-relaxed">{parseInline(line, corPrimaria)}</p>)
    i++
  }
  return <div className="text-sm space-y-1">{elements}</div>
}

// ── CTA Card ──────────────────────────────────────────────────────────────────

function CTACard({ cta, corPrimaria }: { cta: CTAData; corPrimaria: string }) {
  const [adicionando, setAdicionando] = useState(false)
  const [adicionado,  setAdicionado]  = useState(false)

  async function handleCarrinho() {
    setAdicionando(true)
    try {
      const res = await fetch('/api/carrinho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: cta.slug, quantidade: 1 }),
      })
      if (res.ok) {
        setAdicionado(true)
        setTimeout(() => setAdicionado(false), 2000)
      } else {
        window.location.href = `/produtos/${cta.slug}?acao=carrinho`
      }
    } catch {
      window.location.href = `/produtos/${cta.slug}?acao=carrinho`
    } finally {
      setAdicionando(false)
    }
  }

  return (
    <div className="mt-2.5 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100">
        <p className="text-[11px] font-bold text-gray-800 leading-snug line-clamp-2">{cta.nome}</p>
        <p className="text-base font-black mt-0.5" style={{ color: corPrimaria }}>R$ {cta.preco}</p>
      </div>
      <div className="flex gap-1.5 p-2">
        <a
          href={`/produtos/${cta.slug}?acao=comprar`}
          onClick={(e) => { e.preventDefault(); window.location.href = `/produtos/${cta.slug}?acao=comprar` }}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold text-white transition active:scale-95"
          style={{ backgroundColor: corPrimaria }}
        >
          <ShoppingBag size={11} />
          Comprar
        </a>
        <button
          onClick={handleCarrinho}
          disabled={adicionando}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold border transition active:scale-95 disabled:opacity-60"
          style={{ borderColor: adicionado ? '#10b981' : corPrimaria, color: adicionado ? '#10b981' : corPrimaria }}
        >
          {adicionando ? <Loader2 size={11} className="animate-spin" /> : <ShoppingCart size={11} />}
          {adicionado ? 'Adicionado!' : 'Carrinho'}
        </button>
        <Link
          href={`/produtos/${cta.slug}`}
          className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-500 hover:border-gray-300 transition"
        >
          <Eye size={11} />
        </Link>
      </div>
    </div>
  )
}

// ── Atalhos ───────────────────────────────────────────────────────────────────

const ATALHOS = [
  { label: 'Climatizadores', msg: 'Quero ver os climatizadores disponíveis' },
  { label: 'Aspiradores',    msg: 'Quais aspiradores vocês têm?' },
  { label: 'Preços',         msg: 'Quais são os preços dos produtos?' },
  { label: 'Frete',          msg: 'Como funciona o frete?' },
  { label: 'Atendente',      msg: 'Quero falar com um atendente' },
  { label: 'Garantia',       msg: 'Como funciona a garantia?' },
]

// ── LunaWidget ────────────────────────────────────────────────────────────────

interface LunaWidgetProps {
  onOcultar?: () => void
}

export default function LunaWidget({ onOcultar }: LunaWidgetProps) {
  const [config,      setConfig]      = useState<LunaConfig>(DEFAULT_CONFIG)
  const [aberto,      setAberto]      = useState(false)
  const [minimizado,  setMinimizado]  = useState(false)
  const [mensagens,   setMensagens]   = useState<Mensagem[]>([])
  const [input,       setInput]       = useState('')
  const [enviando,    setEnviando]    = useState(false)
  const [mostrarBolha, setMostrarBolha] = useState(false)
  const [atendimentoEncerrado, setAtendimentoEncerrado] = useState(false)
  const [naoLidas,    setNaoLidas]    = useState(0)

  const messagesEndRef    = useRef<HTMLDivElement>(null)
  const inputRef          = useRef<HTMLInputElement>(null)
  const sessionId         = useRef(`luna_${Date.now()}`)
  const fu1TimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fu2TimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const followupStepRef   = useRef(0)   // 0=none 1=fu1sent 2=fu2sent 3=encerrado
  const encerramentoRef   = useRef(false)

  // ── Carregar config do backend ────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/agente/config')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setConfig(data) })
      .catch(() => {})
  }, [])

  // ── Bolha de boas-vindas após 4 s ─────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => setMostrarBolha(true), 4000)
    return () => clearTimeout(t)
  }, [])

  // ── Mensagem inicial ao abrir ─────────────────────────────────────────────

  useEffect(() => {
    if (aberto && mensagens.length === 0) {
      setMensagens([{ id: '0', role: 'assistant', content: config.saudacao, timestamp: new Date() }])
    }
    if (aberto) setNaoLidas(0)
  }, [aberto, config.saudacao, mensagens.length])

  // ── Scroll automático ─────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, enviando])

  // ── Foco no input ao abrir ────────────────────────────────────────────────

  useEffect(() => {
    if (aberto && !minimizado) setTimeout(() => inputRef.current?.focus(), 300)
  }, [aberto, minimizado])

  // ── Limpar timers de follow-up ────────────────────────────────────────────

  const limparTimers = useCallback(() => {
    if (fu1TimerRef.current) { clearTimeout(fu1TimerRef.current); fu1TimerRef.current = null }
    if (fu2TimerRef.current) { clearTimeout(fu2TimerRef.current); fu2TimerRef.current = null }
  }, [])

  // ── Enviar mensagem de follow-up ──────────────────────────────────────────

  const enviarFollowup = useCallback((step: 1 | 2) => {
    if (!config.followupAtivo || encerramentoRef.current) return
    const msg    = step === 1 ? config.followupMensagem1 : config.followupMensagem2
    const novaId = `fu${step}_${Date.now()}`
    followupStepRef.current = step

    setMensagens(prev => [...prev, {
      id: novaId, role: 'assistant', content: msg,
      timestamp: new Date(), isFollowup: true,
    }])

    if (!aberto) setNaoLidas(n => n + 1)

    if (step === 1) {
      fu2TimerRef.current = setTimeout(() => {
        if (followupStepRef.current === 1) enviarFollowup(2)
      }, (config.followupDelay2 || 30) * 1000)
    } else if (step === 2 && config.encerramentoAuto) {
      setTimeout(() => {
        if (followupStepRef.current === 2 && !encerramentoRef.current) {
          encerramentoRef.current = true
          followupStepRef.current = 3
          setMensagens(prev => [...prev, {
            id: `enc_${Date.now()}`, role: 'assistant',
            content: config.mensagemEncerramento,
            timestamp: new Date(), isEncerramento: true,
          }])
          setAtendimentoEncerrado(true)
          if (!aberto) setNaoLidas(n => n + 1)
        }
      }, 3000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, aberto])

  // ── Reagir às mensagens para iniciar/cancelar timers ─────────────────────

  useEffect(() => {
    if (mensagens.length === 0) return
    const last = mensagens[mensagens.length - 1]

    if (last.role === 'user') {
      // Usuário respondeu — cancelar follow-ups e encerramento
      limparTimers()
      followupStepRef.current = 0
      encerramentoRef.current = false
      setAtendimentoEncerrado(false)
      return
    }

    if (last.isFollowup || last.isEncerramento) return

    // Mensagem normal da Luna — armar timer do follow-up 1
    limparTimers()
    followupStepRef.current = 0
    if (config.followupAtivo) {
      fu1TimerRef.current = setTimeout(() => {
        if (followupStepRef.current === 0) enviarFollowup(1)
      }, (config.followupDelay1 || 30) * 1000)
    }

    return () => { limparTimers() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensagens])

  useEffect(() => {
    if (!aberto) return
    setNaoLidas(0)
  }, [aberto])

  // ── Chamar API ────────────────────────────────────────────────────────────

  async function chamarAPI(historico: { role: 'user' | 'assistant'; content: string }[]) {
    setEnviando(true)
    try {
      const res  = await fetch('/api/agente', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mensagens: historico, sessionId: sessionId.current }),
      })
      const data = await res.json()
      const nova: Mensagem = {
        id:        `${Date.now()}_r`,
        role:      'assistant',
        content:   data.resposta || 'Desculpe, não consegui responder.',
        timestamp: new Date(),
      }
      setMensagens(prev => [...prev, nova])
      if (!aberto) setNaoLidas(n => n + 1)
    } catch {
      setMensagens(prev => [...prev, {
        id:        `${Date.now()}_err`,
        role:      'assistant',
        content:   `Tive um problema técnico 😅 Fale com nossa equipe: [WhatsApp Vendas](https://wa.me/${config.whatsappVendas})`,
        timestamp: new Date(),
      }])
    } finally {
      setEnviando(false)
    }
  }

  const enviarMensagem = useCallback(async () => {
    if (!input.trim() || enviando || atendimentoEncerrado) return
    const nova: Mensagem = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: new Date() }
    const hist = [...mensagens, nova].map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    setMensagens(prev => [...prev, nova])
    setInput('')
    await chamarAPI(hist)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, enviando, mensagens, atendimentoEncerrado])

  function handleAtalho(msg: string) {
    if (enviando || atendimentoEncerrado) return
    const nova: Mensagem = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() }
    const hist = [...mensagens, nova].map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    setMensagens(prev => [...prev, nova])
    chamarAPI(hist)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem() }
  }

  function novaConversa() {
    limparTimers()
    setMensagens([])
    setAtendimentoEncerrado(false)
    encerramentoRef.current = false
    followupStepRef.current = 0
    sessionId.current = `luna_${Date.now()}`
    setTimeout(() => {
      setMensagens([{ id: '0', role: 'assistant', content: config.saudacao, timestamp: new Date() }])
    }, 50)
  }

  const corPrimaria   = config.corPrimaria   || '#3cbfb3'
  const corSecundaria = config.corSecundaria || '#0f2e2b'
  const gradHeader    = `linear-gradient(135deg, ${corSecundaria}, ${corPrimaria})`

  return (
    <div className="flex flex-col items-end gap-3">

      {/* ── Chat expandido ──────────────────────────────────────────────────── */}
      {aberto && (
        <div
          className={`bg-white rounded-3xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ease-out w-[calc(100vw-2rem)] sm:w-[370px] max-w-[370px] ${minimizado ? 'h-[60px]' : 'h-[530px]'}`}
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 cursor-pointer shrink-0"
            style={{ background: gradHeader }}
            onClick={() => setMinimizado(m => !m)}
          >
            <div className="relative shrink-0">
              <LunaAvatar size={44} animated={false} />
              <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0f2e2b] ${atendimentoEncerrado ? 'bg-gray-400' : 'bg-green-400 animate-pulse'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-none">{config.nome}</p>
              <p className="text-white/70 text-[11px] mt-0.5">
                {atendimentoEncerrado ? 'Atendimento encerrado' : 'Assistente Sixxis • Online'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={e => { e.stopPropagation(); setMinimizado(m => !m) }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <ChevronDown size={14} className={`text-white transition-transform duration-200 ${minimizado ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setAberto(false) }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <X size={13} className="text-white" />
              </button>
            </div>
          </div>

          {!minimizado && (
            <>
              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {mensagens.map(msg => {
                  const { text, cta } = parsearCTA(msg.content)
                  const isUser        = msg.role === 'user'
                  const isEnc         = msg.isEncerramento
                  const isFu          = msg.isFollowup

                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isUser && (
                        isEnc ? (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-gray-200">
                            <span className="text-xs">👋</span>
                          </div>
                        ) : (
                          <div className="shrink-0 mt-0.5">
                            <LunaAvatarMini size={28} />
                          </div>
                        )
                      )}
                      <div className={`max-w-[78%] ${isUser ? '' : 'flex flex-col'}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 leading-relaxed ${
                            isUser
                              ? 'text-white rounded-br-sm'
                              : isEnc
                                ? 'bg-gray-100 text-gray-500 rounded-bl-sm border border-dashed border-gray-200 text-sm italic'
                                : isFu
                                  ? 'bg-white text-gray-700 rounded-bl-sm shadow-sm border border-dashed'
                                  : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                          }`}
                          style={
                            isUser
                              ? { background: corPrimaria }
                              : isFu
                                ? { borderColor: `${corPrimaria}55` }
                                : {}
                          }
                        >
                          {isFu && (
                            <p className="text-[9px] font-semibold uppercase tracking-wide mb-1" style={{ color: corPrimaria }}>
                              Follow-up
                            </p>
                          )}
                          {isUser
                            ? <p className="text-sm">{msg.content}</p>
                            : isEnc
                              ? <p className="text-sm">{text}</p>
                              : <MarkdownMessage content={text} corPrimaria={corPrimaria} />
                          }
                          <p className={`text-[9px] mt-1.5 ${isUser ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                            {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {cta && !isUser && <CTACard cta={cta} corPrimaria={corPrimaria} />}
                      </div>
                    </div>
                  )
                })}

                {enviando && (
                  <div className="flex gap-2.5 items-end">
                    <div className="shrink-0">
                      <LunaAvatarMini size={28} />
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                      <div className="flex gap-1.5 items-center">
                        {[0, 150, 300].map(d => (
                          <span key={d} className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: corPrimaria, animation: `bounce-dots 1.2s ease-in-out ${d}ms infinite` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Banner de encerramento */}
              {atendimentoEncerrado && (
                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 shrink-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">Atendimento encerrado por inatividade</p>
                    <button
                      onClick={novaConversa}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full text-white transition"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      Nova conversa
                    </button>
                  </div>
                </div>
              )}

              {/* Atalhos */}
              {!atendimentoEncerrado && (
                <div className="px-3 py-2 border-t border-gray-100 bg-white shrink-0">
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                    {ATALHOS.map(a => (
                      <button
                        key={a.label}
                        onClick={() => handleAtalho(a.msg)}
                        disabled={enviando}
                        className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 transition whitespace-nowrap bg-white disabled:opacity-50"
                        onMouseEnter={e => {
                          const el = e.currentTarget
                          el.style.borderColor = corPrimaria
                          el.style.backgroundColor = corPrimaria
                          el.style.color = 'white'
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget
                          el.style.borderColor = ''
                          el.style.backgroundColor = ''
                          el.style.color = ''
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                <div
                  className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 transition px-4 py-2.5"
                  onFocus={e => (e.currentTarget.style.borderColor = corPrimaria)}
                  onBlur={e => (e.currentTarget.style.borderColor = '')}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={atendimentoEncerrado ? 'Inicie uma nova conversa acima' : 'Digite sua mensagem...'}
                    disabled={enviando || atendimentoEncerrado}
                    className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 outline-none disabled:opacity-60"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    onClick={enviarMensagem}
                    disabled={!input.trim() || enviando || atendimentoEncerrado}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 active:scale-95"
                    style={{ background: !input.trim() || enviando || atendimentoEncerrado ? '#e5e7eb' : corPrimaria }}
                  >
                    {enviando
                      ? <Loader2 size={14} className="text-gray-400 animate-spin" />
                      : <Send size={14} className="text-white" />
                    }
                  </button>
                </div>
                <p className="text-center text-[9px] text-gray-300 mt-1.5">
                  {config.nome} — Assistente Sixxis • Powered by AI
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Bolha de boas-vindas ────────────────────────────────────────────── */}
      {!aberto && mostrarBolha && (
        <div className="relative animate-bounce-gentle">
          <div
            className="bg-white rounded-2xl rounded-br-sm shadow-xl border border-gray-100 px-4 py-3.5 max-w-[240px]"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
          >
            {/* Header com avatar mini + status */}
            <div className="flex items-center gap-2.5 mb-2 pb-2 border-b border-gray-100">
              <LunaAvatarMini size={28} />
              <div>
                <p className="text-xs font-black text-gray-900 leading-none">{config.nome}</p>
                <p className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Online agora
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 font-medium leading-snug whitespace-pre-line">
              {config.saudacao}
            </p>
          </div>
          <button
            onClick={() => setMostrarBolha(false)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition"
          >
            <X size={10} className="text-gray-600" />
          </button>
          <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45" />
        </div>
      )}

      {/* ── Botão flutuante Luna ────────────────────────────────────────────── */}
      {!aberto && (
        <div className="relative group/luna-btn">
          {/* × para ocultar — sempre no topo-direito do avatar, nunca interfere com o balão */}
          {onOcultar && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onOcultar() }}
              aria-label="Ocultar assistente"
              className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-gray-700/80 backdrop-blur-sm text-white flex items-center justify-center text-[11px] font-bold leading-none opacity-0 group-hover/luna-btn:opacity-100 transition-opacity duration-200 hover:bg-red-500 shadow-sm"
              title="Ocultar (volta em 24h)"
            >
              ×
            </button>
          )}
          <button
            onClick={() => { setAberto(true); setMostrarBolha(false); setNaoLidas(0) }}
            className="relative w-16 h-16 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #0f2e2b, #1a4f4a)',
              boxShadow: '0 8px 32px rgba(60,191,179,0.35), 0 4px 16px rgba(0,0,0,0.4)',
            }}
            aria-label={`Abrir chat com ${config.nome}`}
          >
            <LunaAvatar size={64} animated={false} />
            <span className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${atendimentoEncerrado ? 'bg-gray-400' : 'bg-emerald-500'}`}>
              {!atendimentoEncerrado && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping opacity-75" />
              )}
            </span>
            {naoLidas > 0 && (
              <span className="absolute -top-1 -left-1 min-w-[20px] h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
