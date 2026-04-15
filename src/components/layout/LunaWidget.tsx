'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, Send, ChevronDown, Loader2, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

interface Mensagem {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Props {
  saudacao?:        string
  nome?:            string
  corPrimaria?:     string
  corSecundaria?:   string
  whatsappVendas?:  string
  whatsappSuporte?: string
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function parseInline(text: string, corPrimaria: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\)]*)\)/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      nodes.push(<strong key={m.index} className="font-bold text-gray-900">{m[1]}</strong>)
    } else {
      const href = m[3]
      const label = m[2]
      const isExternal = href.startsWith('http')
      if (isExternal) {
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
    if (line.trim() === '') {
      elements.push(<div key={`sp-${i}`} className="h-1" />)
      i++; continue
    }
    elements.push(<p key={i} className="leading-relaxed">{parseInline(line, corPrimaria)}</p>)
    i++
  }
  return <div className="text-sm space-y-1">{elements}</div>
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function LunaAvatar({ small = false }: { small?: boolean }) {
  const s = small ? 28 : 40
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#3cbfb3" opacity="0.15" />
      <ellipse cx="50" cy="24" rx="21" ry="14" fill="#2c1810" />
      <ellipse cx="31" cy="37" rx="7" ry="13" fill="#2c1810" />
      <ellipse cx="69" cy="37" rx="7" ry="13" fill="#2c1810" />
      <circle cx="50" cy="40" r="20" fill="#FDDCB5" />
      <circle cx="43" cy="38" r="3.2" fill="#1a1a2e" />
      <circle cx="57" cy="38" r="3.2" fill="#1a1a2e" />
      <circle cx="44.2" cy="37" r="1.1" fill="white" />
      <circle cx="58.2" cy="37" r="1.1" fill="white" />
      <ellipse cx="50" cy="44" rx="2" ry="1.5" fill="#e8b89a" />
      <path d="M44 49 Q50 55 56 49" stroke="#c8745a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M22 100 Q22 73 50 69 Q78 73 78 100 Z" fill="#0f2e2b" />
      <circle cx="50" cy="77" r="3" fill="#3cbfb3" opacity="0.9" />
    </svg>
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

export default function LunaWidget({
  saudacao       = 'Olá! Sou a Luna, assistente da Sixxis 👋 Como posso te ajudar hoje?',
  nome           = 'Luna',
  corPrimaria    = '#3cbfb3',
  corSecundaria  = '#0f2e2b',
  whatsappVendas = '5518997474701',
}: Props) {
  const [aberto,       setAberto]       = useState(false)
  const [minimizado,   setMinimizado]   = useState(false)
  const [mensagens,    setMensagens]    = useState<Mensagem[]>([])
  const [input,        setInput]        = useState('')
  const [enviando,     setEnviando]     = useState(false)
  const [mostrarBolha, setMostrarBolha] = useState(false)

  const messagesEndRef      = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLInputElement>(null)
  const sessionId           = useRef(`luna_${Date.now()}`)
  const inactivityTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastMsgRoleRef      = useRef<'user' | 'assistant' | null>(null)
  const followUpSentRef     = useRef(false)

  // Bolha de boas-vindas após 4 s
  useEffect(() => {
    const t = setTimeout(() => setMostrarBolha(true), 4000)
    return () => clearTimeout(t)
  }, [])

  // Mensagem inicial ao abrir
  useEffect(() => {
    if (aberto && mensagens.length === 0) {
      setMensagens([{ id: '0', role: 'assistant', content: saudacao, timestamp: new Date() }])
    }
  }, [aberto, saudacao, mensagens.length])

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, enviando])

  // Foco no input ao abrir
  useEffect(() => {
    if (aberto && !minimizado) setTimeout(() => inputRef.current?.focus(), 300)
  }, [aberto, minimizado])

  // ── Timer de inatividade — follow-up automático após 30s sem resposta ────────

  const FOLLOWUP_MESSAGES = [
    'Ficou alguma dúvida sobre os modelos que indiquei? 😊 Se quiser, posso calcular o frete até você — é só me informar o CEP.',
    'Posso te ajudar com mais alguma coisa? Se já escolheu o modelo, me passa o CEP que calculo prazo e valor do frete.',
    'Precisa de mais informações para decidir? Estou aqui! Ou, se preferir, nossa equipe de vendas atende pelo WhatsApp: (18) 99747-4701 😊',
  ]

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    followUpSentRef.current = false
  }, [])

  const triggerFollowUp = useCallback(() => {
    if (
      lastMsgRoleRef.current !== 'assistant' ||
      followUpSentRef.current ||
      !aberto
    ) return
    followUpSentRef.current = true
    const msg = FOLLOWUP_MESSAGES[Math.floor(Math.random() * FOLLOWUP_MESSAGES.length)]
    setMensagens(prev => [
      ...prev,
      { id: `fu_${Date.now()}`, role: 'assistant', content: msg, timestamp: new Date() },
    ])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto])

  useEffect(() => {
    if (mensagens.length === 0) return
    const last = mensagens[mensagens.length - 1]
    lastMsgRoleRef.current = last.role as 'user' | 'assistant'
    if (last.role === 'assistant') {
      resetInactivityTimer()
      inactivityTimerRef.current = setTimeout(triggerFollowUp, 30000)
    } else {
      resetInactivityTimer()
    }
    return () => { if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current) }
  }, [mensagens, resetInactivityTimer, triggerFollowUp])

  useEffect(() => {
    if (!aberto) resetInactivityTimer()
  }, [aberto, resetInactivityTimer])

  async function chamarAPI(historico: { role: 'user' | 'assistant'; content: string }[]) {
    setEnviando(true)
    try {
      const res = await fetch('/api/agente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagens: historico, sessionId: sessionId.current }),
      })
      const data = await res.json()
      setMensagens((prev) => [...prev, {
        id: `${Date.now()}_r`,
        role: 'assistant',
        content: data.resposta || 'Desculpe, não consegui responder.',
        timestamp: new Date(),
      }])
    } catch {
      setMensagens((prev) => [...prev, {
        id: `${Date.now()}_err`,
        role: 'assistant',
        content: `Tive um problema técnico 😅 Fale com nossa equipe: [WhatsApp Vendas](https://wa.me/${whatsappVendas})`,
        timestamp: new Date(),
      }])
    } finally {
      setEnviando(false)
    }
  }

  const enviarMensagem = useCallback(async () => {
    if (!input.trim() || enviando) return
    const nova: Mensagem = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: new Date() }
    const novoHistorico = [...mensagens, nova].map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    setMensagens((prev) => [...prev, nova])
    setInput('')
    await chamarAPI(novoHistorico)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, enviando, mensagens])

  function handleAtalho(msg: string) {
    if (enviando) return
    const nova: Mensagem = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() }
    const novoHistorico = [...mensagens, nova].map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    setMensagens((prev) => [...prev, nova])
    chamarAPI(novoHistorico)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem() }
  }

  const gradHeader = `linear-gradient(135deg, ${corSecundaria}, ${corPrimaria})`

  return (
    <div className="flex flex-col items-end gap-3">

      {/* ── Chat expandido ──────────────────────────────────────────────────── */}
      {aberto && (
        <div
          className={`bg-white rounded-3xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ease-out w-[340px] sm:w-[370px] ${minimizado ? 'h-[60px]' : 'h-[530px]'}`}
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 cursor-pointer shrink-0"
            style={{ background: gradHeader }}
            onClick={() => setMinimizado((m) => !m)}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
                <LunaAvatar />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-none">{nome}</p>
              <p className="text-white/70 text-[11px] mt-0.5">Assistente Sixxis • Online</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setMinimizado((m) => !m) }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <ChevronDown size={14} className={`text-white transition-transform duration-200 ${minimizado ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setAberto(false) }}
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
                {mensagens.map((msg) => (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 overflow-hidden" style={{ background: gradHeader }}>
                        <LunaAvatar small />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                        msg.role === 'user'
                          ? 'text-white rounded-br-sm'
                          : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                      }`}
                      style={msg.role === 'user' ? { background: corPrimaria } : {}}
                    >
                      {msg.role === 'assistant'
                        ? <MarkdownMessage content={msg.content} corPrimaria={corPrimaria} />
                        : <p className="text-sm">{msg.content}</p>
                      }
                      <p className={`text-[9px] mt-1.5 ${msg.role === 'user' ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {enviando && (
                  <div className="flex gap-2.5 items-end">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: gradHeader }}>
                      <LunaAvatar small />
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                      <div className="flex gap-1">
                        {[0, 150, 300].map((delay) => (
                          <div key={delay} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Atalhos */}
              <div className="px-3 py-2 border-t border-gray-100 bg-white shrink-0">
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                  {ATALHOS.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => handleAtalho(a.msg)}
                      disabled={enviando}
                      className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:text-white text-gray-500 transition whitespace-nowrap bg-white disabled:opacity-50"
                      onMouseEnter={(e) => {
                        const el = e.currentTarget
                        el.style.borderColor = corPrimaria
                        el.style.backgroundColor = corPrimaria
                        el.style.color = 'white'
                      }}
                      onMouseLeave={(e) => {
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

              {/* Input */}
              <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                <div
                  className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 transition px-4 py-2.5"
                  onFocus={(e) => (e.currentTarget.style.borderColor = corPrimaria)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '')}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    disabled={enviando}
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none disabled:opacity-60"
                  />
                  <button
                    onClick={enviarMensagem}
                    disabled={!input.trim() || enviando}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 active:scale-95"
                    style={{ background: !input.trim() || enviando ? '#e5e7eb' : corPrimaria }}
                  >
                    {enviando
                      ? <Loader2 size={14} className="text-gray-400 animate-spin" />
                      : <Send size={14} className="text-white" />
                    }
                  </button>
                </div>
                <p className="text-center text-[9px] text-gray-300 mt-1.5">
                  {nome} — Assistente Sixxis • Powered by AI
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
            className="bg-white rounded-2xl rounded-br-sm shadow-xl border border-gray-100 px-4 py-3 max-w-[240px]"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
          >
            <p className="text-sm text-gray-700 font-medium leading-snug">
              Posso te ajudar a escolher o produto certo? 😊
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
        <button
          onClick={() => { setAberto(true); setMostrarBolha(false) }}
          className="relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-all duration-200 active:scale-95"
          style={{ background: gradHeader }}
          aria-label={`Abrir chat com ${nome}`}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
            <LunaAvatar />
          </div>
          <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}
    </div>
  )
}
