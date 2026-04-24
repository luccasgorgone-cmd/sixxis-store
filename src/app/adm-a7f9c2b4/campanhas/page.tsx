'use client'

import { useEffect, useMemo, useState } from 'react'
import { Mail, MessageSquare, Send, Check, X, Plus, Target, Calendar, ArrowLeft, ArrowRight, Save, Users, Rocket, Trash2, Copy, Tag as TagIcon } from 'lucide-react'

type CampanhaTipo = 'promocional' | 'sazonal' | 'recuperacao' | 'aniversario' | 'lancamento' | 'reengajamento'
type PublicoKind = 'todos' | 'nivel' | 'compraDias' | 'semCompraDias' | 'aniversariantes' | 'segmento'

interface Publico {
  kind: PublicoKind
  nivel?: string
  dias?: number
  segmento?: string
}
interface Canais { email: boolean; whatsapp: boolean }

interface Campanha {
  id: string
  nome: string
  tipo: string
  status: string
  canais?: Canais | null
  totalAlvo?: number
  totalEnviados?: number
  totalDestinatarios?: number
  totalAbertos?: number
  totalCliques?: number
  createdAt: string
  _count?: { destinatarios?: number }
}

const TIPOS: { value: CampanhaTipo; label: string }[] = [
  { value: 'promocional',    label: 'Promocional' },
  { value: 'sazonal',        label: 'Sazonal' },
  { value: 'recuperacao',    label: 'Recuperação de carrinho' },
  { value: 'aniversario',    label: 'Aniversário' },
  { value: 'lancamento',     label: 'Lançamento' },
  { value: 'reengajamento',  label: 'Reengajamento' },
]

const STATUS_COR: Record<string, { label: string; cor: string; bg: string }> = {
  rascunho:  { label: 'Rascunho', cor: '#6b7280', bg: '#f3f4f6' },
  RASCUNHO:  { label: 'Rascunho', cor: '#6b7280', bg: '#f3f4f6' },
  agendada:  { label: 'Agendada', cor: '#f59e0b', bg: '#fef3c7' },
  AGENDADA:  { label: 'Agendada', cor: '#f59e0b', bg: '#fef3c7' },
  enviando:  { label: 'Enviando', cor: '#3b82f6', bg: '#dbeafe' },
  ENVIANDO:  { label: 'Enviando', cor: '#3b82f6', bg: '#dbeafe' },
  enviada:   { label: 'Enviada',  cor: '#059669', bg: '#d1fae5' },
  ENVIADA:   { label: 'Enviada',  cor: '#059669', bg: '#d1fae5' },
}

const PROGRESS_LABELS = ['Criar', 'Canais', 'Revisão']

export default function CampanhasPage() {
  const [modo, setModo] = useState<'lista' | 'wizard'>('lista')
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const [loading, setLoading] = useState(true)

  async function carregar() {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (filtroStatus) p.set('status', filtroStatus)
      const r = await fetch(`/api/admin/campanhas?${p}`)
      if (!r.ok) throw new Error('Erro ' + r.status)
      const d = await r.json().catch(() => ({ campanhas: [] }))
      setCampanhas(Array.isArray(d.campanhas) ? d.campanhas : [])
    } catch (err) {
      console.error('[campanhas] fetch falhou:', err)
      setCampanhas([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { carregar() }, [filtroStatus]) // eslint-disable-line

  async function excluir(id: string) {
    if (!confirm('Excluir esta campanha?')) return
    await fetch(`/api/admin/campanhas/${id}`, { method: 'DELETE' })
    carregar()
  }

  if (modo === 'wizard') return <Wizard onFinish={() => { setModo('lista'); carregar() }} onCancel={() => setModo('lista')} />

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f2e2b' }}>Campanhas</h1>
          <p className="text-sm text-gray-500">Crie, agende e acompanhe suas campanhas</p>
        </div>
        <button
          onClick={() => setModo('wizard')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}
        >
          <Plus size={16} /> Nova campanha
        </button>
      </div>

      {/* Filtro status */}
      <div className="flex gap-2 flex-wrap">
        {(['', 'rascunho', 'agendada', 'enviada'] as const).map(s => (
          <button
            key={s || 'todos'}
            onClick={() => setFiltroStatus(s)}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition"
            style={filtroStatus === s
              ? { background: '#0f2e2b', color: '#ffffff' }
              : { background: '#f3f4f6', color: '#6b7280' }}
          >
            {s === '' ? 'Todos' : STATUS_COR[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Nome</th>
                <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Tipo</th>
                <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Canais</th>
                <th className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Alvo</th>
                <th className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Enviados</th>
                <th className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Abertura</th>
                <th className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Cliques</th>
                <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">Carregando...</td></tr>
              ) : campanhas.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-gray-400">
                  <Target size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm mb-3">Nenhuma campanha cadastrada.</p>
                  <button onClick={() => setModo('wizard')} className="text-[#3cbfb3] text-sm font-bold hover:underline">
                    Criar a primeira
                  </button>
                </td></tr>
              ) : campanhas.map(c => {
                const st = STATUS_COR[c.status] ?? STATUS_COR.rascunho
                const alvo = c.totalAlvo || c.totalDestinatarios || c._count?.destinatarios || 0
                const enviados = c.totalEnviados || 0
                const aberturaPc = enviados ? Math.round(((c.totalAbertos || 0) / enviados) * 100) : 0
                const cliquesPc  = enviados ? Math.round(((c.totalCliques || 0) / enviados) * 100) : 0
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">{c.nome}</p>
                      <p className="text-[11px] text-gray-400">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.tipo}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {c.canais?.email && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700"><Mail size={10} /> Email</span>}
                        {c.canais?.whatsapp && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700"><MessageSquare size={10} /> WhatsApp</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 font-bold">{alvo}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{enviados}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{aberturaPc}%</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{cliquesPc}%</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: st.cor, background: st.bg }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => excluir(c.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// WIZARD
// ════════════════════════════════════════════════════════════
function Wizard({ onFinish, onCancel }: { onFinish: () => void; onCancel: () => void }) {
  const [passo, setPasso] = useState(1)

  // Passo 1
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<CampanhaTipo>('promocional')
  const [publico, setPublico] = useState<Publico>({ kind: 'todos' })
  const [tituloCopy, setTituloCopy] = useState('')
  const [corpoCopy, setCorpoCopy] = useState('')
  const [ctaTexto, setCtaTexto] = useState('Ver oferta')
  const [ctaUrl, setCtaUrl] = useState('')
  const [produtoId, setProdutoId] = useState<string>('')
  const [cupomId, setCupomId] = useState<string>('')
  const [enviarAgora, setEnviarAgora] = useState(true)
  const [dataAgendamento, setDataAgendamento] = useState('')

  // Passo 2
  const [canais, setCanais] = useState<Canais>({ email: true, whatsapp: false })
  const [emailAssunto, setEmailAssunto] = useState('')
  const [whatsappTexto, setWhatsappTexto] = useState('')

  // Dados auxiliares
  const [produtos, setProdutos] = useState<{ id: string; nome: string; slug: string }[]>([])
  const [cupons, setCupons] = useState<{ id: string; codigo: string }[]>([])
  const [totalAlvo, setTotalAlvo] = useState<number | null>(null)
  const [carregandoAlvo, setCarregandoAlvo] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetch('/api/admin/produtos?ativo=true').then(r => r.json()).then((d: { produtos?: { id: string; nome: string; slug: string }[] }) => {
      setProdutos(d.produtos ?? [])
    }).catch(() => {})
    fetch('/api/admin/cupons').then(r => r.json()).then((d: unknown) => {
      const arr = Array.isArray(d) ? d : ((d as { cupons?: { id: string; codigo: string }[] }).cupons ?? [])
      setCupons(arr as { id: string; codigo: string }[])
    }).catch(() => {})
  }, [])

  const tituloChars = tituloCopy.length
  const whatsappChars = whatsappTexto.length

  const podeAvancar1 = nome.trim() && tituloCopy.trim() && corpoCopy.trim() && (enviarAgora || dataAgendamento)
  const podeAvancar2 = canais.email || canais.whatsapp

  // Estimar alcance quando chegar ao passo 3
  useEffect(() => {
    if (passo !== 3) return
    setCarregandoAlvo(true)
    fetch('/api/admin/campanhas/estimativa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publico }),
    })
      .then(r => r.json())
      .then((d: { total: number }) => setTotalAlvo(d.total ?? 0))
      .catch(() => setTotalAlvo(0))
      .finally(() => setCarregandoAlvo(false))
  }, [passo, publico])

  async function salvar(enviar: boolean) {
    setSalvando(true)
    const payload = {
      nome,
      tipo,
      publicoAlvo: publico,
      tituloCopy,
      corpoCopy,
      ctaTexto,
      ctaUrl,
      produtoDestaqueId: produtoId || null,
      cupomId: cupomId || null,
      canais,
      emailAssunto,
      whatsappTexto,
      dataAgendamento: enviarAgora ? null : new Date(dataAgendamento).toISOString(),
      status: enviar ? (enviarAgora ? 'enviando' : 'agendada') : 'rascunho',
      // Legado (manter compat com POST existente)
      assunto: emailAssunto || tituloCopy,
      mensagem: corpoCopy || tituloCopy,
      agendadoPara: enviarAgora ? null : new Date(dataAgendamento).toISOString(),
    }
    await fetch('/api/admin/campanhas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSalvando(false)
    onFinish()
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f2e2b' }}>Nova campanha</h1>
          <p className="text-sm text-gray-500">Passo {passo} de 3 — {PROGRESS_LABELS[passo - 1]}</p>
        </div>
        <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition" title="Cancelar">
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {PROGRESS_LABELS.map((l, i) => {
          const step = i + 1
          const ativo = step <= passo
          return (
            <div key={l} className="flex-1 flex items-center gap-2">
              <div
                className="flex-1 h-2 rounded-full transition-all"
                style={{ background: ativo ? '#3cbfb3' : '#e5e7eb' }}
              />
              <span
                className="text-xs font-bold whitespace-nowrap"
                style={{ color: ativo ? '#0f2e2b' : '#9ca3af' }}
              >
                {step} — {l}
              </span>
            </div>
          )
        })}
      </div>

      {/* Passo 1 — Criar */}
      {passo === 1 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">Nome da campanha *</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Black Friday 2026" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none" />
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">Tipo *</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as CampanhaTipo)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none bg-white">
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">Público-alvo *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={publico.kind}
                onChange={e => setPublico({ kind: e.target.value as PublicoKind })}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
              >
                <option value="todos">Todos os clientes</option>
                <option value="nivel">Por nível de fidelidade</option>
                <option value="compraDias">Com pedido nos últimos X dias</option>
                <option value="semCompraDias">Sem compra há X dias</option>
                <option value="aniversariantes">Aniversariantes do mês</option>
                <option value="segmento">Segmento customizado</option>
              </select>

              {publico.kind === 'nivel' && (
                <select value={publico.nivel ?? ''} onChange={e => setPublico(p => ({ ...p, nivel: e.target.value }))} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                  <option value="">Selecione o nível</option>
                  {['cristal', 'topazio', 'safira', 'diamante', 'esmeralda'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              )}
              {(publico.kind === 'compraDias' || publico.kind === 'semCompraDias') && (
                <input type="number" value={publico.dias ?? 30} onChange={e => setPublico(p => ({ ...p, dias: Number(e.target.value) || 30 }))} placeholder="Dias" className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
              )}
              {publico.kind === 'segmento' && (
                <input type="text" value={publico.segmento ?? ''} onChange={e => setPublico(p => ({ ...p, segmento: e.target.value }))} placeholder="Tag / nome do segmento" className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide">Título da campanha *</label>
              <span className="text-[11px] font-mono" style={{ color: tituloChars > 80 ? '#ef4444' : '#9ca3af' }}>{tituloChars}/80</span>
            </div>
            <textarea
              value={tituloCopy}
              maxLength={80}
              onChange={e => setTituloCopy(e.target.value)}
              rows={2}
              placeholder="Black Friday: até 50% OFF em climatizadores"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">Corpo da mensagem *</label>
            <textarea value={corpoCopy} onChange={e => setCorpoCopy(e.target.value)} rows={4} placeholder="Texto que vai aparecer na campanha..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none resize-y" />
            {corpoCopy && (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Preview</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{corpoCopy}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">CTA texto</label>
              <input type="text" value={ctaTexto} onChange={e => setCtaTexto(e.target.value)} placeholder="Comprar agora" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">CTA URL</label>
              <input type="url" value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={!!produtoId} onChange={e => { if (!e.target.checked) setProdutoId('') }} className="accent-[#3cbfb3]" />
                <span className="text-xs font-extrabold text-gray-600 uppercase">Vincular produto destaque</span>
              </label>
              <select value={produtoId} onChange={e => setProdutoId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                <option value="">Sem produto vinculado</option>
                {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={!!cupomId} onChange={e => { if (!e.target.checked) setCupomId('') }} className="accent-[#3cbfb3]" />
                <span className="text-xs font-extrabold text-gray-600 uppercase">Vincular cupom</span>
              </label>
              <select value={cupomId} onChange={e => setCupomId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                <option value="">Sem cupom vinculado</option>
                {cupons.map(c => <option key={c.id} value={c.id}>{c.codigo}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">Agendamento</label>
            <div className="flex flex-wrap gap-3 items-center">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={enviarAgora} onChange={e => setEnviarAgora(e.target.checked)} className="accent-[#3cbfb3]" />
                <span className="text-sm font-semibold text-gray-700">Enviar agora</span>
              </label>
              {!enviarAgora && (
                <input type="datetime-local" value={dataAgendamento} onChange={e => setDataAgendamento(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              disabled={!podeAvancar1}
              onClick={() => setPasso(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}
            >
              Continuar <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Passo 2 — Canais */}
      {passo === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card Email */}
            <div
              className="bg-white border-2 rounded-2xl shadow-sm p-5 space-y-4 transition"
              style={{ borderColor: canais.email ? '#3cbfb3' : '#e5e7eb' }}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={canais.email} onChange={e => setCanais(c => ({ ...c, email: e.target.checked }))} className="w-5 h-5 accent-[#3cbfb3]" />
                <Mail size={20} style={{ color: '#3cbfb3' }} />
                <span className="font-black text-lg" style={{ color: '#0f2e2b' }}>Email</span>
              </label>

              {canais.email && (
                <>
                  <div>
                    <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">Assunto personalizado</label>
                    <input type="text" value={emailAssunto} onChange={e => setEmailAssunto(e.target.value)} placeholder={`Ex: {{nome}}, ${tituloCopy.slice(0, 40)}`} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                    <p className="text-[10px] text-gray-400 mt-1">Vars: {'{{nome}}'}, {'{{desconto}}'}, {'{{produto}}'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-gray-600 uppercase tracking-wide block mb-1.5">Preview do email</p>
                    <iframe
                      srcDoc={renderEmailPreview({ titulo: tituloCopy, corpo: corpoCopy, cta: ctaTexto, ctaUrl })}
                      className="w-full h-[360px] rounded-xl border border-gray-200 bg-white"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Card WhatsApp */}
            <div
              className="bg-white border-2 rounded-2xl shadow-sm p-5 space-y-4 transition"
              style={{ borderColor: canais.whatsapp ? '#22c55e' : '#e5e7eb' }}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={canais.whatsapp} onChange={e => setCanais(c => ({ ...c, whatsapp: e.target.checked }))} className="w-5 h-5 accent-green-500" />
                <MessageSquare size={20} className="text-green-500" />
                <span className="font-black text-lg" style={{ color: '#0f2e2b' }}>WhatsApp</span>
              </label>

              {canais.whatsapp && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-extrabold text-gray-600 uppercase tracking-wide">Mensagem</label>
                      <span className="text-[11px] font-mono" style={{ color: whatsappChars > 1024 ? '#ef4444' : '#9ca3af' }}>{whatsappChars}/1024</span>
                    </div>
                    <textarea
                      value={whatsappTexto}
                      maxLength={1024}
                      onChange={e => setWhatsappTexto(e.target.value)}
                      rows={5}
                      placeholder={tituloCopy + '\n\n' + corpoCopy}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono resize-y"
                    />
                  </div>
                  {/* Mock WhatsApp */}
                  <div className="rounded-2xl bg-[#e5ddd5] p-4">
                    <div className="max-w-[85%] bg-[#d9fdd3] rounded-xl rounded-tr-sm px-3 py-2 shadow-sm ml-auto">
                      <p className="text-[13px] text-gray-800 whitespace-pre-wrap">{whatsappTexto || 'Sua mensagem aparecerá aqui...'}</p>
                      <p className="text-[10px] text-gray-500 text-right mt-1">agora ✓✓</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setPasso(1)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              <ArrowLeft size={14} /> Voltar
            </button>
            <button
              disabled={!podeAvancar2}
              onClick={() => setPasso(3)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}
            >
              Continuar <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Passo 3 — Revisão */}
      {passo === 3 && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users size={18} style={{ color: '#3cbfb3' }} />
              <p className="font-black" style={{ color: '#0f2e2b' }}>Estimativa de alcance</p>
            </div>
            <p className="text-lg">
              {carregandoAlvo
                ? 'Calculando...'
                : <>Esta campanha será enviada para <strong style={{ color: '#3cbfb3' }}>{totalAlvo ?? 0}</strong> clientes</>
              }
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-3">
            <p className="font-black" style={{ color: '#0f2e2b' }}>Resumo</p>
            <Linha label="Nome" valor={nome} />
            <Linha label="Tipo" valor={TIPOS.find(t => t.value === tipo)?.label ?? tipo} />
            <Linha label="Público" valor={publicoResumo(publico)} />
            <Linha label="Título" valor={tituloCopy} />
            <Linha label="CTA" valor={ctaTexto ? `${ctaTexto} → ${ctaUrl || '—'}` : '—'} />
            <Linha label="Produto" valor={produtos.find(p => p.id === produtoId)?.nome ?? '—'} />
            <Linha label="Cupom" valor={cupons.find(c => c.id === cupomId)?.codigo ?? '—'} />
            <Linha label="Canais" valor={[canais.email && 'Email', canais.whatsapp && 'WhatsApp'].filter(Boolean).join(' + ') || '—'} />
            <Linha label="Agendamento" valor={enviarAgora ? 'Enviar agora' : `Agendada: ${new Date(dataAgendamento).toLocaleString('pt-BR')}`} />
          </div>

          <div className="flex justify-between pt-2 flex-wrap gap-3">
            <button onClick={() => setPasso(2)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              <ArrowLeft size={14} /> Voltar
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => salvar(false)}
                disabled={salvando}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                <Save size={14} /> Salvar como rascunho
              </button>
              <button
                onClick={() => salvar(true)}
                disabled={salvando}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition hover:shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}
              >
                <Rocket size={14} /> {enviarAgora ? 'Enviar agora' : 'Agendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-start gap-3 py-1 border-b border-gray-50 last:border-b-0">
      <span className="text-xs font-bold text-gray-500 uppercase w-28 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 flex-1">{valor || '—'}</span>
    </div>
  )
}

function publicoResumo(p: Publico) {
  switch (p.kind) {
    case 'todos':           return 'Todos os clientes'
    case 'nivel':           return `Nível: ${p.nivel ?? '—'}`
    case 'compraDias':      return `Com pedido nos últimos ${p.dias ?? 30} dias`
    case 'semCompraDias':   return `Sem compra há ${p.dias ?? 30} dias`
    case 'aniversariantes': return 'Aniversariantes do mês'
    case 'segmento':        return `Segmento: ${p.segmento ?? '—'}`
    default:                return '—'
  }
}

function renderEmailPreview({ titulo, corpo, cta, ctaUrl }: { titulo: string; corpo: string; cta: string; ctaUrl: string }) {
  const escape = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;font-family:-apple-system,Segoe UI,Arial,sans-serif;background:#f0f2f5;padding:16px;}.c{max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);}.h{background:#0f2e2b;padding:24px;text-align:center;color:#fff;}.hero{background:#1a4f4a;padding:28px 24px;color:#fff;}.b{padding:28px 24px;color:#1f2937;line-height:1.6;font-size:14px;}.btn{display:inline-block;padding:12px 24px;background:#3cbfb3;color:#fff;border-radius:10px;text-decoration:none;font-weight:800;}.f{background:#111827;padding:18px;text-align:center;color:#9ca3af;font-size:11px;}</style></head><body><div class="c"><div class="h"><strong>SIXXIS</strong></div><div class="hero"><h2 style="margin:0;font-size:22px;font-weight:900;">${escape(titulo || 'Título da campanha')}</h2></div><div class="b"><p style="white-space:pre-wrap;margin:0 0 16px;">${escape(corpo || 'Corpo da mensagem...')}</p><div style="text-align:center;"><a class="btn" href="${escape(ctaUrl || '#')}">${escape(cta || 'Comprar agora')}</a></div></div><div class="f">&copy; ${new Date().getFullYear()} Sixxis Store</div></div></body></html>`
}
