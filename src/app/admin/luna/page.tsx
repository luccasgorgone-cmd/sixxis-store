'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Bot, MessageSquare, Settings, BarChart3, Upload, Save,
  RefreshCw, Circle, X, User, ChevronRight,
  Clock, TrendingUp, Calendar, CheckCircle2, Info,
  ToggleLeft, ToggleRight, Sliders, Palette,
  AlertCircle, Image as ImageIcon, Trash2, ExternalLink,
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Config { [key: string]: string }

interface Metricas {
  totalConversas: number
  hoje: number
  aoVivo: number
  mediaMensagens: number
  mediaDuracaoMin: number
}

interface Conversa {
  id: string
  sessaoId: string
  status: string
  totalMensagens: number
  createdAt: string
  ultimaMensagem: string | null
  _count: { mensagens: number }
  mensagens: Array<{ id: string; conteudo: string; createdAt: string }>
}

interface ConversaDetalhe {
  id: string
  sessaoId: string
  status: string
  paginaOrigem: string | null
  createdAt: string
  mensagens: Array<{
    id: string; role: string; conteudo: string;
    latenciaMs: number | null; createdAt: string
  }>
}

const ABAS = [
  { id: 'dashboard', label: 'Dashboard',     icon: BarChart3 },
  { id: 'config',    label: 'Configurações', icon: Settings },
  { id: 'avatar',    label: 'Avatar',        icon: ImageIcon },
  { id: 'conversas', label: 'Conversas',     icon: MessageSquare },
]

const fmtData = (d: string) =>
  new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; dot: string; label: string }> = {
    ativa:       { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500 animate-pulse', label: 'Ativa' },
    encerrada:   { cls: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400',                  label: 'Encerrada' },
    transferida: { cls: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500',                  label: 'Transferida' },
    abandonada:  { cls: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-400',                label: 'Abandonada' },
  }
  const cfg = map[status] || map.encerrada
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function CampoConfig({
  chave, valor, tipo, onChange,
}: {
  chave: string
  valor: string
  tipo: string
  onChange: (v: string) => void
}) {
  if (tipo === 'boolean') {
    const ativo = valor === 'true'
    return (
      <button
        type="button"
        onClick={() => onChange(ativo ? 'false' : 'true')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
          ativo
            ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
            : 'bg-gray-50 border-gray-200 text-gray-500'
        }`}
      >
        {ativo ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
        {ativo ? 'Ativado' : 'Desativado'}
      </button>
    )
  }

  if (tipo === 'cor') {
    return (
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={valor || '#3cbfb3'}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg border-2 border-gray-200 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="w-32 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-mono
                     focus:outline-none focus:border-[#3cbfb3] transition"
        />
        <div
          className="w-10 h-10 rounded-xl border border-gray-200 shadow-inner"
          style={{ backgroundColor: valor || '#fff' }}
        />
      </div>
    )
  }

  if (tipo === 'textarea') {
    return (
      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={chave.includes('system_prompt') ? 12 : 4}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                   focus:outline-none focus:border-[#3cbfb3] transition resize-y font-mono leading-relaxed"
      />
    )
  }

  if (tipo === 'numero') {
    return (
      <input
        type="number"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-40 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-mono
                   focus:outline-none focus:border-[#3cbfb3] transition"
      />
    )
  }

  if (tipo === 'select' && chave === 'agente_modelo') {
    const modelos = [
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-6',
      'claude-opus-4-6',
      'claude-opus-4-7',
    ]
    return (
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm
                   focus:outline-none focus:border-[#3cbfb3] transition bg-white"
      >
        {modelos.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    )
  }

  return (
    <input
      type="text"
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm
                 focus:outline-none focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 transition"
    />
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function LunaAdminPage() {
  const [abaAtiva, setAbaAtiva] = useState('dashboard')
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [config, setConfig] = useState<Config>({})
  const [configEditada, setConfigEditada] = useState<Config>({})
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [totalConversas, setTotalConversas] = useState(0)
  const [paginasTotal, setPaginasTotal] = useState(1)
  const [conversaDetalhe, setConversaDetalhe] = useState<ConversaDetalhe | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [salvoOk, setSalvoOk] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [periodo, setPeriodo] = useState('7d')
  const [pagina, setPagina] = useState(1)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const carregarDashboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/luna?tipo=dashboard&periodo=${periodo}`)
      const data = await res.json()
      setMetricas(data.metricas)
      setConfig(data.config || {})
      setConfigEditada(data.config || {})
      if (data.config?.agente_avatar_url) setAvatarPreview(data.config.agente_avatar_url)
    } catch (e) { console.error(e) }
  }, [periodo])

  const carregarConversas = useCallback(async () => {
    const params = new URLSearchParams({
      tipo: 'conversas', periodo, pagina: String(pagina), limite: '20',
    })
    if (busca) params.set('busca', busca)
    if (filtroStatus) params.set('status', filtroStatus)
    const res = await fetch(`/api/admin/luna?${params}`)
    const data = await res.json()
    setConversas(data.conversas || [])
    setTotalConversas(data.total || 0)
    setPaginasTotal(data.paginas || 1)
  }, [periodo, pagina, busca, filtroStatus])

  const carregarDetalhe = async (id: string) => {
    const res = await fetch(`/api/admin/luna?tipo=conversa-detalhe&id=${id}`)
    const data = await res.json()
    setConversaDetalhe(data.conversa)
  }

  useEffect(() => {
    if (abaAtiva === 'dashboard' || abaAtiva === 'config' || abaAtiva === 'avatar') {
      carregarDashboard()
    }
    if (abaAtiva === 'conversas') carregarConversas()
  }, [abaAtiva, carregarDashboard, carregarConversas])

  useEffect(() => {
    if (!autoRefresh) return
    const iv = setInterval(() => {
      if (abaAtiva === 'dashboard') carregarDashboard()
      if (abaAtiva === 'conversas') carregarConversas()
    }, 30_000)
    return () => clearInterval(iv)
  }, [autoRefresh, abaAtiva, carregarDashboard, carregarConversas])

  const salvar = async () => {
    setSalvando(true)
    try {
      const configuracoes = Object.entries(configEditada).map(([chave, valor]) => ({ chave, valor }))
      await fetch('/api/admin/luna', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configuracoes }),
      })
      setConfig(configEditada)
      setSalvoOk(true)
      setTimeout(() => setSalvoOk(false), 3000)
    } catch (e) { console.error(e) }
    setSalvando(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setUploadError('Apenas PNG, JPG ou WebP são aceitos')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Arquivo muito grande. Máximo 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const res = await fetch('/api/admin/upload-luna-avatar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error || 'Erro no upload')
        setUploadingAvatar(false)
        return
      }
      setAvatarPreview(data.url)
      setConfigEditada((prev) => ({
        ...prev,
        agente_avatar_url: data.url,
        agente_avatar_tipo: 'imagem',
      }))
      setConfig((prev) => ({
        ...prev,
        agente_avatar_url: data.url,
        agente_avatar_tipo: 'imagem',
      }))
      setSalvoOk(true)
      setTimeout(() => setSalvoOk(false), 3000)
    } catch (e) {
      console.error(e)
      setUploadError('Erro inesperado no upload')
    }
    setUploadingAvatar(false)
  }

  const removerAvatarPersonalizado = async () => {
    setAvatarPreview('')
    const novaConfig = {
      ...configEditada,
      agente_avatar_url: '',
      agente_avatar_tipo: 'svg',
    }
    setConfigEditada(novaConfig)
    setConfig((prev) => ({ ...prev, agente_avatar_url: '', agente_avatar_tipo: 'svg' }))
    await fetch('/api/admin/luna', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        configuracoes: [
          { chave: 'agente_avatar_url',  valor: '' },
          { chave: 'agente_avatar_tipo', valor: 'svg' },
        ],
      }),
    })
  }

  const editarConfig = (chave: string, valor: string) =>
    setConfigEditada((prev) => ({ ...prev, [chave]: valor }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)' }}
          >
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Agente Luna</h1>
            <p className="text-sm text-gray-400 mt-0.5">Configurações, atendimentos e performance</p>
          </div>
          {metricas && metricas.aoVivo > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700">{metricas.aoVivo} ao vivo</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh((a) => !a)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              autoRefresh ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <Circle
              size={8}
              className={autoRefresh ? 'fill-emerald-500 animate-pulse' : 'fill-gray-400'}
            />
            {autoRefresh ? 'Ao vivo' : 'Pausado'}
          </button>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3cbfb3] bg-white"
          >
            <option value="1d">Hoje</option>
            <option value="7d">7 dias</option>
            <option value="30d">30 dias</option>
            <option value="90d">90 dias</option>
          </select>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100/80 rounded-2xl p-1.5">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                        transition-all flex-1 justify-center ${
                          abaAtiva === aba.id
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
          >
            <aba.icon size={15} />
            {aba.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {abaAtiva === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Circle,        label: 'Ao vivo agora',     valor: metricas?.aoVivo ?? 0,            cor: '#10b981', bg: '#f0fff8', pulse: true },
              { icon: Calendar,      label: 'Atendimentos hoje', valor: metricas?.hoje ?? 0,              cor: '#3b82f6', bg: '#eff6ff' },
              { icon: TrendingUp,    label: `Período (${periodo === '1d' ? 'hoje' : periodo})`, valor: metricas?.totalConversas ?? 0, cor: '#3cbfb3', bg: '#e8f8f7' },
              { icon: MessageSquare, label: 'Média de mensagens',valor: `${metricas?.mediaMensagens ?? 0} msgs`, cor: '#a855f7', bg: '#faf5ff' },
            ].map((m, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: m.bg }}
                >
                  <m.icon
                    size={18}
                    style={{ color: m.cor }}
                    className={m.pulse && metricas && metricas.aoVivo > 0 ? 'animate-pulse' : ''}
                  />
                </div>
                <p className="text-2xl font-black" style={{ color: m.cor }}>{m.valor}</p>
                <p className="text-xs text-gray-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Status da Luna */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
              <Bot size={16} style={{ color: '#3cbfb3' }} /> Status atual da Luna
            </h2>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="relative">
                {config.agente_avatar_url && config.agente_avatar_tipo === 'imagem' ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-[#3cbfb3]/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={config.agente_avatar_url} alt="Luna" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #1a5a52, #0a2820)' }}
                  >
                    <Bot size={28} className="text-[#3cbfb3]" />
                  </div>
                )}
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    config.agente_ativo === 'true' ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}
                />
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg">{config.agente_nome || 'Luna'}</p>
                <p className="text-sm text-gray-500">{config.agente_status || 'Online agora'}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      config.agente_ativo === 'true'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {config.agente_ativo === 'true' ? '✓ Ativo' : '✗ Inativo'}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{config.agente_modelo}</span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-400">Horário de atendimento</p>
                <p className="font-bold text-gray-700">
                  {config.agente_horario_inicio || '08:00'} — {config.agente_horario_fim || '20:00'}
                </p>
              </div>
            </div>
          </div>

          {/* Conversas recentes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="font-black text-gray-900 text-sm">Conversas recentes</p>
              <button
                onClick={() => setAbaAtiva('conversas')}
                className="text-xs text-[#3cbfb3] font-semibold hover:underline"
              >
                Ver todas →
              </button>
            </div>
            <ConversasLista
              periodo={periodo}
              limite={5}
              onSelect={async (id) => {
                await carregarDetalhe(id)
                setAbaAtiva('conversas')
              }}
            />
          </div>
        </div>
      )}

      {/* Configurações */}
      {abaAtiva === 'config' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex-wrap gap-3">
            <p className="text-sm text-gray-500">Edite as configurações abaixo e salve ao final</p>
            <button
              onClick={salvar}
              disabled={salvando}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm
                         transition-all hover:shadow-md disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}
            >
              {salvando ? <RefreshCw size={15} className="animate-spin" /> : salvoOk ? <CheckCircle2 size={15} /> : <Save size={15} />}
              {salvando ? 'Salvando...' : salvoOk ? 'Salvo!' : 'Salvar configurações'}
            </button>
          </div>

          {[
            {
              titulo: 'Identidade',
              icone: Bot,
              campos: ['agente_nome', 'agente_status', 'agente_saudacao', 'agente_placeholder'],
            },
            {
              titulo: 'Comportamento da IA',
              icone: Sliders,
              campos: ['agente_modelo', 'agente_temperatura', 'agente_max_tokens', 'agente_system_prompt'],
            },
            {
              titulo: 'Aparência',
              icone: Palette,
              campos: ['agente_cor_primaria', 'agente_cor_fundo'],
            },
            {
              titulo: 'Horários e disponibilidade',
              icone: Clock,
              campos: ['agente_ativo', 'agente_horario_inicio', 'agente_horario_fim', 'agente_msg_fora_horario'],
            },
            {
              titulo: 'Integrações',
              icone: ExternalLink,
              campos: ['agente_whatsapp_fallback', 'agente_delay_resposta'],
            },
          ].map((grupo) => {
            const labelMap: Record<string, string> = {
              agente_nome: 'Nome da agente',
              agente_status: 'Texto de status',
              agente_saudacao: 'Saudação inicial',
              agente_placeholder: 'Placeholder do chat',
              agente_modelo: 'Modelo de IA',
              agente_temperatura: 'Temperatura (0-1)',
              agente_max_tokens: 'Máx. tokens por resposta',
              agente_system_prompt: 'System Prompt (comportamento)',
              agente_cor_primaria: 'Cor primária',
              agente_cor_fundo: 'Cor de fundo do botão',
              agente_ativo: 'Chat ativo no site',
              agente_horario_inicio: 'Início do atendimento',
              agente_horario_fim: 'Fim do atendimento',
              agente_msg_fora_horario: 'Mensagem fora do horário',
              agente_whatsapp_fallback: 'WhatsApp de fallback (só números)',
              agente_delay_resposta: 'Delay de resposta (ms)',
            }
            const descMap: Record<string, string> = {
              agente_nome: 'Nome exibido no chat e no balloon',
              agente_saudacao: 'Use Enter para quebrar linha. Aparece ao abrir o chat.',
              agente_system_prompt: 'Instruções de comportamento enviadas para a IA a cada conversa.',
              agente_temperatura: '0 = mais preciso | 1 = mais criativo. Recomendado: 0.7',
              agente_delay_resposta: 'Milissegundos de espera antes de mostrar resposta (humaniza). Ex: 800',
            }
            const tipoMap: Record<string, string> = {
              agente_ativo: 'boolean',
              agente_temperatura: 'numero',
              agente_max_tokens: 'numero',
              agente_delay_resposta: 'numero',
              agente_cor_primaria: 'cor',
              agente_cor_fundo: 'cor',
              agente_saudacao: 'textarea',
              agente_msg_fora_horario: 'textarea',
              agente_system_prompt: 'textarea',
              agente_modelo: 'select',
            }

            return (
              <div
                key={grupo.titulo}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                  <grupo.icone size={16} style={{ color: '#3cbfb3' }} />
                  <p className="font-black text-gray-900">{grupo.titulo}</p>
                </div>
                <div className="p-5 space-y-5">
                  {grupo.campos.map((chave) => {
                    const valor = configEditada[chave] ?? ''
                    const label = labelMap[chave] || chave
                    const descricao = descMap[chave] || ''
                    const tipo = tipoMap[chave] || 'texto'
                    return (
                      <div key={chave}>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <label className="text-sm font-bold text-gray-800">{label}</label>
                          <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded-md">
                            {chave}
                          </span>
                        </div>
                        {descricao && (
                          <p className="text-xs text-gray-400 mb-2 flex items-start gap-1.5">
                            <Info size={11} className="mt-0.5 shrink-0" />
                            {descricao}
                          </p>
                        )}
                        <CampoConfig
                          chave={chave}
                          valor={valor}
                          tipo={tipo}
                          onChange={(v) => editarConfig(chave, v)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <button
            onClick={salvar}
            disabled={salvando}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                       font-black text-sm shadow-md transition-all hover:shadow-lg disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}
          >
            {salvando ? <RefreshCw size={16} className="animate-spin" /> : salvoOk ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {salvando ? 'Salvando...' : salvoOk ? '✓ Salvo com sucesso!' : 'Salvar todas as configurações'}
          </button>
        </div>
      )}

      {/* Avatar */}
      {abaAtiva === 'avatar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div>
                <h2 className="text-base font-black text-gray-900">Avatar personalizado</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Faça upload de uma imagem para usar como avatar da Luna.
                  Recomendado: quadrado, mínimo 200×200px, fundo transparente.
                </p>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center
                           cursor-pointer hover:border-[#3cbfb3] hover:bg-[#f0fffe] transition-all group"
              >
                {avatarPreview && configEditada.agente_avatar_tipo === 'imagem' ? (
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#3cbfb3]/30 shadow-lg"
                    />
                    <p className="text-sm font-semibold text-[#3cbfb3]">Clique para trocar a imagem</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: '#e8f8f7' }}
                    >
                      <Upload size={28} style={{ color: '#3cbfb3' }} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-700">Clique para selecionar</p>
                      <p className="text-xs text-gray-400 mt-0.5">PNG, JPG ou WebP · Máximo 5MB</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />

              {uploadError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleUpload}
                  disabled={uploadingAvatar}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                             font-black text-sm transition-all hover:shadow-md disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)',
                    color: '#0f2e2b',
                  }}
                >
                  {uploadingAvatar ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
                  {uploadingAvatar ? 'Enviando...' : 'Enviar avatar'}
                </button>

                {config.agente_avatar_url && (
                  <button
                    onClick={removerAvatarPersonalizado}
                    className="px-4 py-3 rounded-xl border-2 border-red-200 text-red-600
                               hover:bg-red-50 transition-all font-semibold text-sm flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Remover
                  </button>
                )}
              </div>

              {salvoOk && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <p className="text-sm font-semibold text-emerald-700">Avatar salvo com sucesso!</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="text-base font-black text-gray-900">Preview</h2>

              <div
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ backgroundColor: configEditada.agente_cor_fundo || '#0f2e2b' }}
              >
                <div className="relative">
                  {config.agente_avatar_url && configEditada.agente_avatar_tipo === 'imagem' ? (
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#3cbfb3]/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={config.agente_avatar_url}
                        alt="Luna"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #1a5a52, #0a2820)' }}
                    >
                      <Bot size={24} className="text-[#3cbfb3]" />
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-gray-800 bg-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-white">{configEditada.agente_nome || 'Luna'}</p>
                  <p className="text-xs text-white/60">{configEditada.agente_status || 'Online agora'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Tipo de avatar
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'svg',    label: 'SVG Animado', desc: 'Avatar padrão da Luna com animações' },
                    { id: 'imagem', label: 'Foto PNG',    desc: 'Sua imagem personalizada enviada' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => editarConfig('agente_avatar_tipo', t.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        configEditada.agente_avatar_tipo === t.id
                          ? 'border-[#3cbfb3] bg-[#f0fffe]'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <p className="text-sm font-bold text-gray-800">{t.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
                  <Info size={11} className="mt-0.5 shrink-0" />
                  Lembre-se de clicar em “Salvar configurações” na aba Configurações após alterar o tipo.
                </p>
              </div>

              {config.agente_avatar_url && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-500 mb-1">URL do avatar atual</p>
                  <p className="text-xs text-gray-400 font-mono break-all">{config.agente_avatar_url}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conversas */}
      {abaAtiva === 'conversas' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
            <input
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
              placeholder="Buscar nas conversas..."
              className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:border-[#3cbfb3] transition"
            />
            <select
              value={filtroStatus}
              onChange={(e) => { setFiltroStatus(e.target.value); setPagina(1) }}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#3cbfb3]"
            >
              <option value="">Todos os status</option>
              <option value="ativa">Ativas</option>
              <option value="encerrada">Encerradas</option>
              <option value="transferida">Transferidas</option>
              <option value="abandonada">Abandonadas</option>
            </select>
            <button
              onClick={carregarConversas}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition"
            >
              <RefreshCw size={14} /> Atualizar
            </button>
            <p className="self-center text-sm text-gray-400 ml-auto">
              {totalConversas} conversas encontradas
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {conversas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <MessageSquare size={48} className="mb-3 opacity-50" />
                <p className="text-sm">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {conversas.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => carregarDetalhe(conv.sessaoId)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/80 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#e8f8f7' }}
                    >
                      <MessageSquare size={16} style={{ color: '#3cbfb3' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-bold text-gray-900 truncate">Visitante</p>
                        <StatusBadge status={conv.status} />
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {conv.mensagens?.[0]?.conteudo?.substring(0, 80) || 'Sem mensagens'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[10px] text-gray-400">{fmtData(conv.createdAt)}</span>
                        <span className="text-[10px] text-gray-400">
                          {conv._count?.mensagens || 0} mensagens
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {paginasTotal > 1 && (
              <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  ← Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Página {pagina} de {paginasTotal}
                </span>
                <button
                  onClick={() => setPagina((p) => Math.min(paginasTotal, p + 1))}
                  disabled={pagina === paginasTotal}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  Próxima →
                </button>
              </div>
            )}
          </div>

          {conversaDetalhe && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setConversaDetalhe(null)}
              />
              <div className="relative w-full max-w-lg bg-white h-full flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="font-black text-gray-900">Visitante</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtData(conversaDetalhe.createdAt)} · {conversaDetalhe.mensagens.length} mensagens
                    </p>
                  </div>
                  <button
                    onClick={() => setConversaDetalhe(null)}
                    className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                  >
                    <X size={16} />
                  </button>
                </div>

                {conversaDetalhe.paginaOrigem && (
                  <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-[10px] text-gray-400 font-mono break-all">
                      {conversaDetalhe.paginaOrigem.replace(/https?:\/\/[^/]+/, '')}
                    </p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {conversaDetalhe.mensagens.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === 'assistant' ? 'bg-[#3cbfb3]' : 'bg-gray-200'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <Bot size={12} className="text-white" />
                        ) : (
                          <User size={12} className="text-gray-600" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                          msg.role === 'assistant'
                            ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
                            : 'bg-[#3cbfb3] text-white rounded-tr-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line leading-relaxed">{msg.conteudo}</p>
                        <div
                          className={`flex items-center gap-2 text-[9px] mt-1 ${
                            msg.role === 'assistant' ? 'text-gray-400' : 'text-white/70'
                          }`}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          {msg.latenciaMs && msg.role === 'assistant' && (
                            <span>· {msg.latenciaMs}ms</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ConversasLista({
  periodo, limite, onSelect,
}: {
  periodo: string
  limite: number
  onSelect: (id: string) => void
}) {
  const [conversas, setConversas] = useState<Conversa[]>([])

  useEffect(() => {
    fetch(`/api/admin/luna?tipo=conversas&periodo=${periodo}&limite=${limite}`)
      .then((r) => r.json())
      .then((d) => setConversas(d.conversas || []))
  }, [periodo, limite])

  if (conversas.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-400">Nenhuma conversa ainda</div>
  }

  return (
    <div className="divide-y divide-gray-50">
      {conversas.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.sessaoId)}
          className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#e8f8f7' }}
          >
            <MessageSquare size={13} style={{ color: '#3cbfb3' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              Visitante · {conv._count?.mensagens || 0} msgs
            </p>
            <p className="text-xs text-gray-400 truncate">
              {conv.mensagens?.[0]?.conteudo?.substring(0, 60) || ''}
            </p>
          </div>
          <span className="text-[10px] text-gray-400 shrink-0">
            {new Date(conv.createdAt).toLocaleDateString('pt-BR')}
          </span>
        </button>
      ))}
    </div>
  )
}
