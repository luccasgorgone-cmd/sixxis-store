'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, MessageSquare, Send, Clock, CheckCircle, AlertCircle, PauseCircle, Edit2, Trash2, Eye, Copy, Users, Calendar, RefreshCcw, Target, Save } from 'lucide-react'

// Suppress unused import warnings
void Clock; void CheckCircle; void AlertCircle; void PauseCircle; void Edit2;

const STATUS_CONFIG: Record<string, { label: string; cor: string; bg: string }> = {
  RASCUNHO:  { label: 'Rascunho',  cor: '#6b7280', bg: '#f3f4f6' },
  AGENDADA:  { label: 'Agendada',  cor: '#f59e0b', bg: '#fef3c7' },
  ENVIANDO:  { label: 'Enviando',  cor: '#3b82f6', bg: '#dbeafe' },
  ENVIADA:   { label: 'Enviada',   cor: '#059669', bg: '#d1fae5' },
  PAUSADA:   { label: 'Pausada',   cor: '#d97706', bg: '#fef3c7' },
  CANCELADA: { label: 'Cancelada', cor: '#dc2626', bg: '#fee2e2' },
}

export default function CampanhasPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [campanhas, setCampanhas] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<'TODOS'|'EMAIL'|'WHATSAPP'>('TODOS')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modalTipo, setModalTipo] = useState<'EMAIL'|'WHATSAPP'|null>(null)

  async function carregar() {
    setLoading(true)
    const p = new URLSearchParams()
    if (filtroTipo !== 'TODOS') p.set('tipo', filtroTipo)
    if (filtroStatus) p.set('status', filtroStatus)
    const res = await fetch(`/api/admin/campanhas?${p}`)
    const data = await res.json()
    setCampanhas(data.campanhas || [])
    setStats(data.stats || {})
    setLoading(false)
  }

  useEffect(() => { carregar() }, [filtroTipo, filtroStatus]) // eslint-disable-line

  async function excluir(id: string) {
    if (!confirm('Excluir esta campanha?')) return
    await fetch(`/api/admin/campanhas/${id}`, { method: 'DELETE' })
    carregar()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function duplicar(c: any) {
    await fetch('/api/admin/campanhas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: c.tipo, nome: `${c.nome} (cópia)`, assunto: c.assunto, mensagem: c.mensagem }),
    })
    carregar()
  }

  const statsTotal = (stats.RASCUNHO||0)+(stats.AGENDADA||0)+(stats.ENVIANDO||0)+(stats.ENVIADA||0)+(stats.PAUSADA||0)+(stats.CANCELADA||0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Target size={22} className="text-[#3cbfb3]"/>Campanhas & Comunicação
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">E-mails e WhatsApp para segmentos específicos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setModalTipo('EMAIL')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#3cbfb3] text-[#3cbfb3] font-semibold text-sm hover:bg-[#3cbfb3]/10 transition-all">
            <Mail size={15}/>Nova campanha Email
          </button>
          <button onClick={() => setModalTipo('WHATSAPP')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{ backgroundColor: '#25D366', color: 'white' }}>
            <MessageSquare size={15}/>Nova WhatsApp
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', valor: statsTotal, cor: '#3cbfb3', key: '' },
          { label: 'Rascunhos', valor: stats.RASCUNHO||0, cor: '#6b7280', key: 'RASCUNHO' },
          { label: 'Agendadas', valor: stats.AGENDADA||0, cor: '#f59e0b', key: 'AGENDADA' },
          { label: 'Enviando', valor: stats.ENVIANDO||0, cor: '#3b82f6', key: 'ENVIANDO' },
          { label: 'Enviadas', valor: stats.ENVIADA||0, cor: '#059669', key: 'ENVIADA' },
        ].map((s, i) => (
          <button key={i} onClick={() => setFiltroStatus(s.key)}
            className={`bg-white rounded-2xl border p-4 text-center hover:shadow-md transition-all ${filtroStatus === s.key && (i>0||!filtroStatus) ? 'border-[#3cbfb3] shadow-sm' : 'border-gray-100'}`}>
            <p className="text-2xl font-black" style={{ color: s.cor }}>{s.valor}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* FILTROS */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
          {(['TODOS','EMAIL','WHATSAPP'] as const).map(f => (
            <button key={f} onClick={() => setFiltroTipo(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${filtroTipo===f ? 'bg-[#3cbfb3] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              {f === 'TODOS' ? 'Todos' : f === 'EMAIL' ? '✉ E-mail' : '💬 WhatsApp'}
            </button>
          ))}
        </div>
        <button onClick={carregar} className="w-9 h-9 border border-gray-200 rounded-xl bg-white flex items-center justify-center text-gray-400 hover:text-[#3cbfb3] transition-all">
          <RefreshCcw size={15}/>
        </button>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          {['Campanha','Tipo','Destinatários','Agendamento','Status','Ações'].map(h => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_,i) => <div key={i} className="h-14 animate-pulse bg-gray-50 rounded-xl"/>)}
          </div>
        ) : campanhas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Target size={36} className="text-gray-200 mb-3"/>
            <p className="text-base font-semibold text-gray-400 mb-1">Nenhuma campanha criada</p>
            <p className="text-sm text-gray-300 mb-4">Crie sua primeira campanha</p>
            <div className="flex gap-2">
              <button onClick={() => setModalTipo('EMAIL')} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm" style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b' }}>
                <Mail size={14}/>Nova Email
              </button>
              <button onClick={() => setModalTipo('WHATSAPP')} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm" style={{ backgroundColor: '#25D366', color: 'white' }}>
                <MessageSquare size={14}/>Nova WhatsApp
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {campanhas.map(c => {
              const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.RASCUNHO
              const taxa = c.totalDestinatarios > 0 ? Math.round((c.totalEnviados/c.totalDestinatarios)*100) : 0
              return (
                <div key={c.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.tipo==='EMAIL'?'bg-blue-50':'bg-green-50'}`}>
                        {c.tipo==='EMAIL'?<Mail size={13} className="text-blue-500"/>:<MessageSquare size={13} className="text-green-500"/>}
                      </div>
                      <p className="text-sm font-bold text-gray-900 truncate">{c.nome}</p>
                    </div>
                    {c.assunto && <p className="text-xs text-gray-400 mt-0.5 ml-9 truncate">{c.assunto}</p>}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${c.tipo==='EMAIL'?'bg-blue-50 text-blue-600':'bg-green-50 text-green-600'}`}>
                    {c.tipo==='EMAIL'?'E-mail':'WhatsApp'}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{c.totalDestinatarios}</p>
                    {c.totalEnviados > 0 && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#3cbfb3]" style={{ width:`${taxa}%` }}/>
                        </div>
                        <span className="text-[10px] text-gray-400">{taxa}%</span>
                      </div>
                    )}
                  </div>
                  <div>
                    {c.agendadoPara ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{new Date(c.agendadoPara).toLocaleDateString('pt-BR')}</p>
                        <p className="text-[10px] text-gray-400">{new Date(c.agendadoPara).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}h</p>
                      </div>
                    ) : <span className="text-xs text-gray-400">Imediato</span>}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.cor }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.cor }}/>
                    {st.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Link href={`/admin/campanhas/${c.id}`} className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-[#3cbfb3] transition-all" title="Ver"><Eye size={14}/></Link>
                    <button onClick={() => duplicar(c)} className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-[#3cbfb3] transition-all" title="Duplicar"><Copy size={14}/></button>
                    {c.status==='RASCUNHO' && (
                      <button onClick={() => excluir(c.id)} className="w-9 h-9 rounded-xl border border-red-100 bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 transition-all" title="Excluir"><Trash2 size={14}/></button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalTipo && (
        <ModalNovaCampanha tipo={modalTipo} onClose={() => setModalTipo(null)} onSalvo={() => { setModalTipo(null); carregar() }}/>
      )}
    </div>
  )
}

// ── MODAL DE NOVA CAMPANHA ─────────────────────────────────────

const SEGMENTOS = [
  { id: 'todos', label: 'Todos os clientes', desc: 'Todos cadastrados' },
  { id: 'comCompras', label: 'Com compras', desc: 'Fizeram pelo menos 1 pedido' },
  { id: 'semCompras', label: 'Sem compras', desc: 'Nunca compraram' },
  { id: 'cristal',   label: 'Nível Cristal',   desc: 'R$0–R$999' },
  { id: 'topazio',   label: 'Nível Topázio',   desc: 'R$1.000–R$2.999' },
  { id: 'safira',    label: 'Nível Safira',    desc: 'R$3.000–R$7.999' },
  { id: 'diamante',  label: 'Nível Diamante',  desc: 'R$8.000–R$14.999' },
  { id: 'esmeralda', label: 'Nível Esmeralda', desc: 'R$15.000+' },
  { id: 'recentes', label: 'Últimos 30 dias', desc: 'Compraram recentemente' },
]

function ModalNovaCampanha({ tipo, onClose, onSalvo }: { tipo: 'EMAIL'|'WHATSAPP'; onClose: () => void; onSalvo: () => void }) {
  const [etapa, setEtapa] = useState<0|1|2|3>(0)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [segmento, setSegmento] = useState('')
  const [totalSeg, setTotalSeg] = useState(0)
  const [nome, setNome] = useState('')
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [tipoEnvio, setTipoEnvio] = useState<'imediato'|'agendado'>('imediato')
  const [dataAg, setDataAg] = useState('')
  const [horaAg, setHoraAg] = useState('09:00')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [numerosWa, setNumerosWa] = useState<any[]>([])
  const [waId, setWaId] = useState('')

  useEffect(() => {
    if (tipo === 'WHATSAPP') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetch('/api/admin/whatsapp').then(r=>r.json()).then((d: any) => {
        setNumerosWa(d.numeros||[])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = d.numeros?.find((n: any) => n.ehPadrao)
        if (p) setWaId(p.id)
      })
    }
  }, [tipo])

  useEffect(() => {
    if (!segmento || segmento === 'manual') return
    const filtros: Record<string, Record<string, string>> = {
      comCompras: { comCompras: 'true' }, semCompras: { semCompras: 'true' },
      cristal: { nivel: 'Cristal' }, topazio: { nivel: 'Topázio' }, safira: { nivel: 'Safira' },
      diamante: { nivel: 'Diamante' }, esmeralda: { nivel: 'Esmeralda' }, recentes: { ultimaCompraDias: '30' }, todos: {},
    }
    const p = new URLSearchParams({ limit: '1', ...filtros[segmento] })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetch(`/api/admin/clientes?${p}`).then(r=>r.json()).then((d: any) => setTotalSeg(d.total||0))
  }, [segmento])

  async function salvar(disparar = false) {
    if (!nome.trim()) { setErro('Nome obrigatório'); return }
    if (!mensagem.trim()) { setErro('Mensagem obrigatória'); return }
    if (tipo === 'EMAIL' && !assunto.trim()) { setErro('Assunto obrigatório'); return }
    if (!segmento) { setErro('Selecione os destinatários'); return }
    setSalvando(true); setErro('')
    try {
      const agendadoPara = tipoEnvio==='agendado' && dataAg ? new Date(`${dataAg}T${horaAg}:00`).toISOString() : null
      const filtros: Record<string,Record<string,string>> = {
        comCompras:{comCompras:'true'},semCompras:{semCompras:'true'},
        cristal:{nivel:'Cristal'},topazio:{nivel:'Topázio'},safira:{nivel:'Safira'},
        diamante:{nivel:'Diamante'},esmeralda:{nivel:'Esmeralda'},recentes:{ultimaCompraDias:'30'},todos:{},
      }
      const res = await fetch('/api/admin/campanhas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, nome, assunto: tipo==='EMAIL'?assunto:undefined, mensagem, agendadoPara, filtroSegmento: filtros[segmento]||{}, whatsappNumeroId: tipo==='WHATSAPP'?waId:undefined }),
      })
      if (!res.ok) { const d = await res.json(); setErro(d.error||'Erro'); return }
      const criada = await res.json()
      if (disparar && tipoEnvio==='imediato') {
        await fetch(`/api/admin/campanhas/${criada.id}/enviar`, { method: 'POST' })
      }
      onSalvo()
    } catch { setErro('Erro de rede') }
    finally { setSalvando(false) }
  }

  const ETAPAS = ['Destinatários','Conteúdo','Agendamento','Revisão']
  const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition"
  const lbl = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5"

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tipo==='EMAIL'?'bg-blue-50':'bg-green-50'}`}>
              {tipo==='EMAIL'?<Mail size={20} className="text-blue-500"/>:<MessageSquare size={20} className="text-green-500"/>}
            </div>
            <h2 className="text-base font-black text-gray-900">Nova campanha {tipo==='EMAIL'?'E-mail':'WhatsApp'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Steps */}
        <div className="flex px-6 py-3 bg-gray-50/50 border-b border-gray-100 gap-2">
          {ETAPAS.map((e, i) => (
            <div key={i} className="flex items-center flex-1">
              <button onClick={() => setEtapa(i as 0|1|2|3)} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i===etapa?'bg-[#3cbfb3] text-white ring-4 ring-[#3cbfb3]/20':i<etapa?'bg-[#3cbfb3] text-white':'bg-gray-200 text-gray-500'}`}>
                  {i<etapa?'✓':i+1}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${i===etapa?'text-[#3cbfb3]':'text-gray-400'}`}>{e}</span>
              </button>
              {i<3 && <div className={`flex-1 h-px mx-1 ${i<etapa?'bg-[#3cbfb3]':'bg-gray-200'}`}/>}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {erro && <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3"><p className="text-sm text-red-600">{erro}</p></div>}

          {etapa === 0 && (
            <div className="space-y-4">
              <label className={lbl}>Segmento</label>
              <div className="grid grid-cols-2 gap-2">
                {SEGMENTOS.map(s => (
                  <button key={s.id} onClick={() => setSegmento(s.id)}
                    className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all ${segmento===s.id?'border-[#3cbfb3] bg-[#3cbfb3]/5':'border-gray-100 hover:border-gray-300'}`}>
                    <div>
                      <p className={`text-sm font-semibold ${segmento===s.id?'text-[#3cbfb3]':'text-gray-700'}`}>{s.label}</p>
                      <p className="text-[10px] text-gray-400">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              {segmento && segmento!=='manual' && (
                <div className="bg-[#3cbfb3]/8 rounded-xl p-3 border border-[#3cbfb3]/20">
                  <p className="text-sm font-bold text-gray-900"><Users size={14} className="inline mr-1 text-[#3cbfb3]"/>{totalSeg} clientes neste segmento</p>
                </div>
              )}
            </div>
          )}

          {etapa === 1 && (
            <div className="space-y-4">
              <div><label className={lbl}>Nome interno *</label><input value={nome} onChange={e=>setNome(e.target.value)} className={inp} placeholder="Ex: Promoção Verão 2026"/></div>
              {tipo==='EMAIL' && <div><label className={lbl}>Assunto *</label><input value={assunto} onChange={e=>setAssunto(e.target.value)} className={inp} placeholder="Ex: 🌊 Chegou o verão! 30% OFF"/></div>}
              {tipo==='WHATSAPP' && numerosWa.length>0 && (
                <div>
                  <label className={lbl}>Número de envio</label>
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {numerosWa.filter((n: any) => n.ativo).map((n: any) => (
                      <label key={n.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${waId===n.id?'border-green-400 bg-green-50':'border-gray-100 hover:border-gray-200'}`}>
                        <input type="radio" className="hidden" checked={waId===n.id} onChange={()=>setWaId(n.id)}/>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${waId===n.id?'border-green-500':'border-gray-300'}`}>
                          {waId===n.id && <div className="w-2 h-2 rounded-full bg-green-500"/>}
                        </div>
                        <div><p className="text-sm font-bold text-gray-900">{n.nome}</p><p className="text-xs text-gray-400">+{n.numero}</p></div>
                        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${n.status==='CONECTADO'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{n.status==='CONECTADO'?'● Conectado':'○ '+n.status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={lbl}>Mensagem *</label>
                  <div className="flex gap-1.5">
                    {['{{nome}}','{{email}}'].map(v=>(
                      <button key={v} onClick={()=>setMensagem(p=>p+v)} className="text-[10px] font-bold text-[#3cbfb3] bg-[#3cbfb3]/10 px-2 py-0.5 rounded-full hover:bg-[#3cbfb3]/20 transition">{v}</button>
                    ))}
                  </div>
                </div>
                <textarea value={mensagem} onChange={e=>setMensagem(e.target.value)} rows={tipo==='EMAIL'?10:6}
                  className={`${inp} resize-none font-mono text-xs`}
                  placeholder={tipo==='EMAIL'?`<div>Olá, {{nome}}!</div>\n\n...`:`Olá, {{nome}}! 👋\n\n...`}/>
              </div>
            </div>
          )}

          {etapa === 2 && (
            <div className="space-y-4">
              <label className={lbl}>Quando enviar?</label>
              <div className="grid grid-cols-2 gap-3">
                {[{id:'imediato',label:'Envio imediato',desc:'Enviado ao confirmar'},{id:'agendado',label:'Agendar',desc:'Defina data e hora'}].map(op=>(
                  <button key={op.id} onClick={()=>setTipoEnvio(op.id as 'imediato'|'agendado')}
                    className={`flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all ${tipoEnvio===op.id?'border-[#3cbfb3] bg-[#3cbfb3]/5':'border-gray-100 hover:border-gray-300'}`}>
                    <p className={`text-sm font-bold ${tipoEnvio===op.id?'text-[#3cbfb3]':'text-gray-900'}`}>{op.label}</p>
                    <p className="text-xs text-gray-400">{op.desc}</p>
                  </button>
                ))}
              </div>
              {tipoEnvio==='agendado' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={lbl}>Data</label><input type="date" value={dataAg} min={new Date().toISOString().split('T')[0]} onChange={e=>setDataAg(e.target.value)} className={inp}/></div>
                  <div><label className={lbl}>Horário</label><input type="time" value={horaAg} onChange={e=>setHoraAg(e.target.value)} className={inp}/></div>
                </div>
              )}
            </div>
          )}

          {etapa === 3 && (
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
              {[
                {label:'Campanha',valor:nome||'—'},{label:'Tipo',valor:tipo},{label:'Segmento',valor:SEGMENTOS.find(s=>s.id===segmento)?.label||segmento},
                {label:'Destinatários',valor:`${totalSeg} pessoas`},{label:'Envio',valor:tipoEnvio==='imediato'?'Imediatamente':dataAg?`${dataAg} às ${horaAg}`:'—'},
              ].map((item,i)=>(
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-1"><p className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</p><p className="text-sm font-semibold text-gray-900">{item.valor}</p></div>
                </div>
              ))}
              {totalSeg===0 && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3"><p className="text-sm text-amber-700">⚠ Nenhum destinatário encontrado</p></div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">Cancelar</button>
          <div className="flex gap-2">
            {etapa>0 && <button onClick={()=>setEtapa(e=>Math.max(0,e-1) as 0|1|2|3)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">← Voltar</button>}
            {etapa<3 ? (
              <button onClick={()=>setEtapa(e=>Math.min(3,e+1) as 0|1|2|3)} className="px-5 py-2.5 rounded-xl font-bold text-sm" style={{backgroundColor:'#3cbfb3',color:'#0f2e2b'}}>Continuar →</button>
            ) : (
              <>
                <button onClick={()=>salvar(false)} disabled={salvando} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#3cbfb3] text-[#3cbfb3] font-bold text-sm hover:bg-[#3cbfb3]/10 transition disabled:opacity-60">
                  <Save size={14}/>Salvar rascunho
                </button>
                <button onClick={()=>salvar(true)} disabled={salvando||totalSeg===0} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{backgroundColor:tipoEnvio==='imediato'?'#3cbfb3':'#7c3aed',color:'white'}}>
                  {salvando?<><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>Enviando...</>
                    :tipoEnvio==='imediato'?<><Send size={14}/>Enviar agora</>:<><Calendar size={14}/>Agendar</>}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
