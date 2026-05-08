'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Cta { slug: string; preco: string }

interface Mensagem {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isFollowup?: boolean
  cta?: Cta
}

interface Props {
  saudacao?:        string
  nome?:            string
  corPrimaria?:     string
  corSecundaria?:   string
  whatsappVendas?:  string
  whatsappSuporte?: string
}

// ── Follow-up guard ───────────────────────────────────────────────────────────

function podeIniciarFollowup(mensagens: Mensagem[]): boolean {
  // Regra 1: precisa ter pelo menos 2 mensagens (saudação + resposta do usuário)
  if (mensagens.length < 2) return false
  // Regra 2: deve existir pelo menos uma mensagem do usuário
  if (!mensagens.some(m => m.role === 'user')) return false
  // Regra 3: a última mensagem deve ser do assistente
  const ultima = mensagens[mensagens.length - 1]
  if (ultima?.role !== 'assistant') return false
  // Regra 4: deve existir uma mensagem de usuário ANTES da última resposta
  const temUserAntes = mensagens.slice(0, mensagens.length - 1).some(m => m.role === 'user')
  if (!temUserAntes) return false
  return true
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
      nodes.push(
        <strong key={m.index} className="font-bold text-gray-900">{m[1]}</strong>,
      )
    } else {
      const href = m[3], label = m[2]
      const isExternal = href.startsWith('http')
      if (isExternal) {
        nodes.push(
          <a key={m.index} href={href} target="_blank" rel="noopener noreferrer"
            className="font-semibold hover:underline inline-flex items-center gap-0.5"
            style={{ color: corPrimaria }}>
            {label}<ExternalLink size={10} />
          </a>,
        )
      } else {
        nodes.push(
          <Link key={m.index} href={href}
            className="font-semibold hover:underline" style={{ color: corPrimaria }}>
            {label}
          </Link>,
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
        items.push(
          <li key={i} className="text-gray-700 leading-relaxed">
            {parseInline(lines[i].replace(/^[-•]\s/, ''), corPrimaria)}
          </li>,
        )
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-0.5 my-1 pl-1">{items}</ul>,
      )
      continue
    }
    if (line.trim() === '') {
      elements.push(<div key={`sp-${i}`} className="h-1" />)
      i++; continue
    }
    elements.push(
      <p key={i} className="leading-relaxed">{parseInline(line, corPrimaria)}</p>,
    )
    i++
  }
  return <div className="text-sm space-y-1">{elements}</div>
}

// ── Avatar SVG da Luna ────────────────────────────────────────────────────────

function LunaFace({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Cabeça */}
      <circle cx="20" cy="14" r="7" fill="rgba(255,255,255,0.92)" />
      {/* Corpo */}
      <path d="M6 38c0-7.732 6.268-14 14-14s14 6.268 14 14"
        fill="rgba(255,255,255,0.75)" />
      {/* Olhos tiffany */}
      <circle cx="17" cy="13" r="1.5" fill="#3cbfb3" />
      <circle cx="23" cy="13" r="1.5" fill="#3cbfb3" />
      {/* Sorriso */}
      <path d="M16.5 17.5 Q20 20 23.5 17.5"
        stroke="#3cbfb3" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function LunaFaceSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="14" r="7" fill="rgba(255,255,255,0.92)" />
      <path d="M6 38c0-7.732 6.268-14 14-14s14 6.268 14 14"
        fill="rgba(255,255,255,0.75)" />
    </svg>
  )
}

// ── Chips de sugestão ─────────────────────────────────────────────────────────

const CHIPS = ['Climatizadores', 'Aspiradores', 'Preços', 'Frete']

// ── LunaChat ──────────────────────────────────────────────────────────────────

export default function LunaChat({
  saudacao       = 'Olá! Sou a Luna, da Sixxis. Estou aqui para te ajudar com o que precisar — seja uma dúvida sobre nossos produtos, seu pedido ou qualquer informação. Como posso ajudar?',
  nome           = 'Luna',
  whatsappVendas = '5518997474701',
}: Props) {
  const [aberto,       setAberto]       = useState(false)
  const [mensagens,    setMensagens]    = useState<Mensagem[]>([])
  const [input,        setInput]        = useState('')
  const [enviando,     setEnviando]     = useState(false)
  const [mostrarBolha, setMostrarBolha] = useState(false)
  const [fechado,      setFechado]      = useState(false)

  const messagesEndRef     = useRef<HTMLDivElement>(null)
  const textareaRef        = useRef<HTMLTextAreaElement>(null)
  const sessaoIdRef        = useRef<string>(`luna_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const followUpSentRef    = useRef(false)

  // Recuperar sessaoId persistido entre aberturas do chat na mesma visita
  useEffect(() => {
    if (typeof window === 'undefined') return
    const persistido = sessionStorage.getItem('luna_sessao_id')
    if (persistido) sessaoIdRef.current = persistido
    else sessionStorage.setItem('luna_sessao_id', sessaoIdRef.current)
  }, [])

  // Bolha de boas-vindas após 4 s
  useEffect(() => {
    if (fechado) return
    const t = setTimeout(() => setMostrarBolha(true), 4000)
    return () => clearTimeout(t)
  }, [fechado])

  // Mensagem inicial ao abrir
  useEffect(() => {
    if (aberto && mensagens.length === 0) {
      setMensagens([{
        id: '0',
        role: 'assistant',
        content: saudacao,
        timestamp: new Date(),
      }])
    }
  }, [aberto, saudacao, mensagens.length])

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, enviando])

  // Foco no input ao abrir
  useEffect(() => {
    if (aberto) setTimeout(() => textareaRef.current?.focus(), 300)
  }, [aberto])

  // Limpar timers ao fechar/desmontar
  useEffect(() => {
    if (!aberto && inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
  }, [aberto])

  useEffect(() => {
    return () => { if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current) }
  }, [])

  // ── Follow-up automático — SÓ após conversa real ───────────────────────────

  const FOLLOWUP_MESSAGES = [
    'Ficou alguma dúvida sobre os modelos que indiquei? 😊 Se quiser, posso calcular o frete até você — é só me informar o CEP.',
    'Posso te ajudar com mais alguma coisa? Se já escolheu o modelo, me passa o CEP que calculo prazo e valor do frete.',
    'Precisa de mais informações para decidir? Estou aqui! Ou, se preferir, nossa equipe de vendas atende pelo WhatsApp: (18) 99747-4701 😊',
  ]

  const triggerFollowUp = useCallback((msgs: Mensagem[]) => {
    if (!aberto) return
    const msg = FOLLOWUP_MESSAGES[Math.floor(Math.random() * FOLLOWUP_MESSAGES.length)]
    setMensagens(prev => [
      ...prev,
      { id: `fu_${Date.now()}`, role: 'assistant', content: msg, timestamp: new Date(), isFollowup: true },
    ])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto])

  useEffect(() => {
    if (mensagens.length === 0) return
    const last = mensagens[mensagens.length - 1]

    // Limpar timer anterior sempre
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)

    if (last.role === 'assistant') {
      // Verificação obrigatória — não inicia após saudação
      if (!podeIniciarFollowup(mensagens)) {
        console.log('[Luna] Saudação inicial — follow-up NÃO iniciado')
        return
      }
      if (followUpSentRef.current) return
      followUpSentRef.current = false

      inactivityTimerRef.current = setTimeout(() => {
        followUpSentRef.current = true
        triggerFollowUp(mensagens)
      }, 30_000)
    } else {
      // Usuário digitou — resetar para nova rodada
      followUpSentRef.current = false
    }

    return () => { if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current) }
  }, [mensagens, triggerFollowUp])

  // ── Lógica de envio ─────────────────────────────────────────────────────────

  async function chamarAPI(historico: { role: 'user' | 'assistant'; content: string }[]) {
    setEnviando(true)
    try {
      const res = await fetch('/api/agente', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          mensagens: historico,
          sessaoId: sessaoIdRef.current,
          paginaOrigem: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      })
      const data = await res.json()
      if (data.sessaoId && typeof window !== 'undefined') {
        sessaoIdRef.current = data.sessaoId
        sessionStorage.setItem('luna_sessao_id', data.sessaoId)
      }
      setMensagens(prev => [
        ...prev,
        {
          id:        `${Date.now()}_r`,
          role:      'assistant',
          content:   data.resposta || 'Desculpe, não consegui responder.',
          timestamp: new Date(),
          ...(data.cta ? { cta: data.cta } : {}),
        },
      ])
    } catch {
      setMensagens(prev => [
        ...prev,
        {
          id:        `${Date.now()}_err`,
          role:      'assistant',
          content:   `Tive um problema técnico 😅 Fale com nossa equipe: [WhatsApp Vendas](https://wa.me/${whatsappVendas})`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setEnviando(false)
    }
  }

  const enviarMensagem = useCallback(async (texto?: string) => {
    const msg = (texto ?? input).trim()
    if (!msg || enviando) return
    const nova: Mensagem = {
      id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date(),
    }
    const historico = [...mensagens, nova].map(m => ({ role: m.role, content: m.content }))
    setMensagens(prev => [...prev, nova])
    setInput('')
    await chamarAPI(historico)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, enviando, mensagens])

  function fecharTudo() {
    setAberto(false)
    setMostrarBolha(false)
    setFechado(true)
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
  }

  if (fechado) return null

  return (
    <div className="fixed bottom-4 left-3 sm:bottom-6 sm:left-6 z-[999] flex flex-col items-start gap-2 sm:gap-3">

      {/* ── Janela do chat ─────────────────────────────────────────────────────── */}
      {aberto && (
        <div
          className="bg-white flex flex-col overflow-hidden rounded-2xl"
          style={{
            width: 'min(380px, calc(100vw - 24px))',
            height: 'min(580px, 85vh)',
            boxShadow: '0 30px 80px rgba(15,46,43,0.30), 0 10px 30px rgba(0,0,0,0.15)',
            animation: 'luna-open 0.28s ease both',
          }}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div
            className="shrink-0 flex items-center justify-between px-4 py-4"
            style={{ background: 'linear-gradient(135deg, #0b2220 0%, #0f2e2b 50%, #1a4f4a 100%)' }}
          >
            <div className="flex items-center gap-3">
              {/* Avatar no header */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20 flex items-center justify-center"
                  style={{ background: 'linear-gradient(145deg, #1a4f4a, #3cbfb3)' }}>
                  <LunaFace size={24} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0f2e2b]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-black text-sm leading-none tracking-wide">{nome}</p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full
                                   bg-[#3cbfb3]/25 text-[#3cbfb3] leading-none uppercase tracking-wider">
                    IA
                  </span>
                </div>
                <p className="text-white/55 text-[10px] mt-0.5 leading-none">
                  Consultora Sixxis · Online agora
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setAberto(false)}
                className="w-8 h-8 rounded-xl text-white/40 hover:text-white hover:bg-white/10
                           flex items-center justify-center transition-all"
                aria-label="Minimizar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button
                onClick={fecharTudo}
                className="w-8 h-8 rounded-xl text-white/40 hover:text-white hover:bg-white/10
                           flex items-center justify-center transition-all"
                aria-label="Fechar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Faixa "Resposta em menos de 1 minuto" */}
          <div
            className="shrink-0 flex items-center justify-center gap-1.5 py-1.5 px-4"
            style={{ backgroundColor: 'rgba(60,191,179,0.07)', borderBottom: '1px solid rgba(60,191,179,0.1)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[9px] text-[#3cbfb3]/80 font-semibold">
              Resposta em menos de 1 minuto
            </p>
          </div>

          {/* ── Área de mensagens ───────────────────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            style={{ backgroundColor: '#f7f9fb' }}
          >
            {mensagens.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar da Luna nas mensagens */}
                {msg.role === 'assistant' && (
                  <div
                    className="w-7 h-7 rounded-full shrink-0 overflow-hidden mt-auto mb-1 flex items-center justify-center"
                    style={{ background: 'linear-gradient(145deg, #0f2e2b, #3cbfb3)' }}
                  >
                    <LunaFaceSmall />
                  </div>
                )}

                <div className={`max-w-[78%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Label follow-up */}
                  {msg.isFollowup && (
                    <span className="text-[9px] text-[#3cbfb3]/70 font-bold uppercase tracking-widest mb-1 px-1">
                      ⏱ Acompanhamento
                    </span>
                  )}

                  <div className={[
                    'px-4 py-3 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-[#3cbfb3] text-[#0f2e2b] rounded-2xl rounded-tr-sm font-medium shadow-sm'
                      : msg.isFollowup
                        ? 'bg-white text-gray-700 rounded-2xl rounded-tl-sm border-2 border-[#3cbfb3]/20 shadow-sm'
                        : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100',
                  ].join(' ')}>
                    {msg.role === 'assistant' ? (
                      <MarkdownMessage content={msg.content} corPrimaria="#3cbfb3" />
                    ) : (
                      <p>{msg.content}</p>
                    )}

                    {/* CTA de produto */}
                    {msg.cta && (
                      <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
                        <a
                          href={`/produtos/${msg.cta.slug}`}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                                     font-black text-sm text-[#0f2e2b]"
                          style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)' }}
                        >
                          Comprar Agora — {msg.cta.preco}
                        </a>
                        <a
                          href={`/produtos/${msg.cta.slug}`}
                          className="flex items-center justify-center w-full py-1.5 text-xs
                                     text-[#3cbfb3] hover:underline"
                        >
                          Ver detalhes completos →
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[9px] text-gray-400 mt-0.5 px-1">
                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {enviando && (
              <div className="flex gap-2.5">
                <div
                  className="w-7 h-7 rounded-full shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ background: 'linear-gradient(145deg, #0f2e2b, #3cbfb3)' }}
                >
                  <LunaFaceSmall />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-1.5">
                  {[0, 1, 2].map(n => (
                    <div
                      key={n}
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: '#3cbfb3',
                        animation: `luna-bounce 1.3s ease-in-out ${n * 0.18}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ──────────────────────────────────────────────────────────── */}
          <div
            className="shrink-0 p-3 bg-white"
            style={{ borderTop: '1px solid #f0f0f0' }}
          >
            {/* Chips de sugestão — só na saudação */}
            {mensagens.length === 1 && !enviando && (
              <div className="flex gap-1.5 flex-wrap mb-2.5">
                {CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => enviarMensagem(chip)}
                    className="text-xs px-3 py-1.5 rounded-full border border-[#3cbfb3]/30
                               text-[#3cbfb3] hover:bg-[#3cbfb3]/10 transition-colors font-medium"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div
              className="flex items-end gap-2 bg-gray-50 rounded-2xl px-3.5 py-2.5"
              style={{ border: '1.5px solid #e8e8e8' }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem() }
                }}
                rows={1}
                placeholder="Digite sua mensagem..."
                disabled={enviando}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400
                           focus:outline-none resize-none"
                style={{ fontSize: '16px', maxHeight: '80px' }}
              />
              <button
                onClick={() => enviarMensagem()}
                disabled={!input.trim() || enviando}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                           transition-all duration-200"
                style={{
                  background: input.trim() && !enviando
                    ? 'linear-gradient(135deg, #3cbfb3, #2a9d8f)'
                    : '#e5e7eb',
                  color: input.trim() && !enviando ? '#0f2e2b' : '#9ca3af',
                }}
              >
                {enviando ? (
                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                  </svg>
                )}
              </button>
            </div>

            <p className="text-[9px] text-gray-300 text-center mt-1.5 select-none">
              {nome} · Assistente Sixxis · Powered by AI
            </p>
          </div>
        </div>
      )}

      {/* ── Balão de boas-vindas ──────────────────────────────────────────────── */}
      {!aberto && mostrarBolha && (
        <div
          className="relative bg-white rounded-2xl rounded-br-sm shadow-2xl px-3 py-2.5 sm:px-4 sm:py-3.5
                     max-w-[180px] sm:max-w-[230px] cursor-pointer border border-gray-100/80 hover:shadow-xl
                     transition-shadow"
          style={{ boxShadow: '0 12px 40px rgba(15,46,43,0.15)' }}
          onClick={() => { setAberto(true); setMostrarBolha(false) }}
        >
          {/* Fechar balão */}
          <button
            onClick={e => { e.stopPropagation(); setMostrarBolha(false) }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-600/80
                       text-white text-[11px] font-bold flex items-center justify-center
                       hover:bg-red-500 transition-colors shadow-sm"
          >
            ×
          </button>

          <div className="flex items-start gap-2.5">
            <div
              className="w-6 h-6 rounded-full shrink-0 overflow-hidden mt-0.5 flex items-center justify-center"
              style={{ background: 'linear-gradient(145deg, #0f2e2b, #3cbfb3)' }}
            >
              <LunaFaceSmall />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs text-gray-800 font-medium leading-snug">
                Olá! Estou disponível para te ajudar.
              </p>
              <p className="text-[9px] sm:text-[10px] text-[#3cbfb3] font-semibold mt-1">
                Luna · Sixxis
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Botão flutuante ───────────────────────────────────────────────────── */}
      {!aberto && (
        <div className="relative group/luna-avatar">
          {/* Badge ONLINE */}
          <div className="absolute -top-0.5 -right-0.5 z-20 flex items-center gap-0.5
                          bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5
                          rounded-full shadow-md leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>Luna</span>
          </div>

          <button
            onClick={() => { setAberto(true); setMostrarBolha(false) }}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl overflow-hidden
                       transition-all duration-300 hover:scale-110 active:scale-95
                       ring-2 ring-white/30 hover:ring-[#3cbfb3]/60"
            style={{
              background: 'linear-gradient(145deg, #0f2e2b 0%, #1a4f4a 45%, #3cbfb3 100%)',
              boxShadow: '0 8px 25px rgba(60,191,179,0.4), 0 4px 12px rgba(15,46,43,0.5)',
            }}
            aria-label={`Abrir chat com ${nome}`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="sm:hidden"><LunaFace size={28} /></span>
              <span className="hidden sm:block"><LunaFace size={34} /></span>
            </div>
            {/* Brilho interno */}
            <div className="absolute top-0 left-0 w-full h-1/2 rounded-t-full bg-white/10" />
          </button>
        </div>
      )}
    </div>
  )
}
