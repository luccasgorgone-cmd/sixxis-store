'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Save, RefreshCw, Settings, Check, ChevronDown, Search,
  Store, Palette, LayoutTemplate, Bot, Globe, ExternalLink, Lock, Info,
} from 'lucide-react'
import { ADMIN_BASE } from '@/lib/admin-path'

// ─────────────────────────────────────────────────────────────────────────────
// Configurações da Loja — saneada e organizada (sem o despejão plano).
//
// Fonte ÚNICA por domínio (resolve as sobreposições):
//  • Cores/aparência → Editor Visual (tem preview ao vivo). Aqui é só leitura.
//  • Conteúdo da Home (hero/trust/pq/newsletter) → Editor Visual.
//  • Agente Luna (agente_*) → aba Luna.
//  • Identidade, SEO, redes e contato → editáveis aqui (fonte única destes).
//
// Só mostramos chaves CABEADAS (mudar o valor muda a loja). Chaves mortas
// (stat_*, anuncio_*, txt_*, font_*, hero_* no storefront, aparencia_cor_*,
// whatsapp_banner_*, cashback_*) ficaram de fora — ver relatório no PR.
// ─────────────────────────────────────────────────────────────────────────────

type CampoTipo = 'texto' | 'textarea' | 'url' | 'toggle'

interface Campo {
  chave: string
  label: string
  tipo: CampoTipo
  descricao?: string
  placeholder?: string
}

type Secao =
  | { id: string; titulo: string; icon: typeof Store; tipo: 'form'; intro?: string; campos: Campo[] }
  | { id: string; titulo: string; icon: typeof Store; tipo: 'cores'; intro?: string }
  | { id: string; titulo: string; icon: typeof Store; tipo: 'atalho'; intro: string; linkLabel: string; href: string; itens: string[] }

const SECOES: Secao[] = [
  {
    id: 'identidade',
    titulo: 'Identidade da Loja',
    icon: Store,
    tipo: 'form',
    intro: 'Dados oficiais da empresa, logos e fonte. Fonte única destes valores.',
    campos: [
      { chave: 'loja_nome',       label: 'Nome da loja',            tipo: 'texto' },
      { chave: 'loja_descricao',  label: 'Descrição',               tipo: 'textarea' },
      { chave: 'loja_cnpj',       label: 'CNPJ',                    tipo: 'texto' },
      { chave: 'loja_email',      label: 'E-mail de contato',       tipo: 'texto' },
      { chave: 'loja_telefone',   label: 'Telefone',                tipo: 'texto' },
      { chave: 'loja_endereco',   label: 'Endereço',                tipo: 'textarea' },
      { chave: 'loja_horario',    label: 'Horário de atendimento',  tipo: 'texto', placeholder: 'Seg–Sex 8h às 18h' },
      { chave: 'logo_url',        label: 'Logo (URL)',              tipo: 'url', descricao: 'Cabeado: header e metadados.' },
      { chave: 'logo_rodape_url', label: 'Logo do rodapé (URL)',    tipo: 'url', descricao: 'Cabeado: rodapé (cai pro logo principal se vazio).' },
      { chave: 'favicon_url',     label: 'Favicon (URL)',           tipo: 'url', descricao: 'Cabeado: ícone da aba.' },
      { chave: 'fonte_principal', label: 'Fonte principal',         tipo: 'texto', placeholder: 'Inter', descricao: 'Cabeado. Opções: Inter, Poppins.' },
    ],
  },
  {
    id: 'aparencia',
    titulo: 'Aparência & Cores',
    icon: Palette,
    tipo: 'cores',
    intro: 'As cores da loja são editadas no Editor Visual (com preview ao vivo). Aqui é só leitura.',
  },
  {
    id: 'home',
    titulo: 'Conteúdo da Home',
    icon: LayoutTemplate,
    tipo: 'atalho',
    intro: 'Hero, trust bar, "Por que Sixxis", ofertas e newsletter são editados no Editor Visual, com preview ao vivo — fonte única.',
    linkLabel: 'Abrir Editor Visual',
    href: `${ADMIN_BASE}/editor-visual`,
    itens: ['Banner / Hero', 'Trust bar', 'Por que Sixxis?', 'Ofertas relâmpago', 'Newsletter', 'Banners duplos'],
  },
  {
    id: 'luna',
    titulo: 'Agente Luna',
    icon: Bot,
    tipo: 'atalho',
    intro: 'A configuração da Luna (persona, modelo, horários, follow-ups, WhatsApp) fica na aba Luna — fonte única.',
    linkLabel: 'Abrir aba Luna',
    href: `${ADMIN_BASE}/luna`,
    itens: ['Persona & avatar', 'Modelo & temperatura', 'Horário de atendimento', 'Follow-ups', 'WhatsApp fallback'],
  },
  {
    id: 'seo-contato',
    titulo: 'SEO, Redes & Contato',
    icon: Globe,
    tipo: 'form',
    intro: 'Metadados de busca, links de redes sociais, WhatsApp e disponibilidade da loja.',
    campos: [
      { chave: 'seo_title',              label: 'Meta título (SEO)',       tipo: 'texto',    descricao: 'Cabeado: <title> e Open Graph. Vazio = padrão da loja.' },
      { chave: 'seo_description',        label: 'Meta descrição (SEO)',    tipo: 'textarea', descricao: 'Cabeado: meta description e Open Graph.' },
      { chave: 'social_whatsapp',        label: 'WhatsApp comercial',      tipo: 'texto',    placeholder: '5518997474701', descricao: 'Cabeado: botões do rodapé.' },
      { chave: 'social_whatsapp_suporte',label: 'WhatsApp suporte',        tipo: 'texto',    placeholder: '5511934102621', descricao: 'Cabeado: rodapé.' },
      { chave: 'social_instagram',       label: 'Instagram (URL)',         tipo: 'url',      placeholder: 'https://instagram.com/sixxisoficial', descricao: 'Cabeado: ícone do rodapé.' },
      { chave: 'social_facebook',        label: 'Facebook (URL)',          tipo: 'url',      descricao: 'Cabeado: ícone do rodapé.' },
      { chave: 'rodape_tagline',         label: 'Slogan do rodapé',        tipo: 'texto',    placeholder: 'Qualidade e inovação...', descricao: 'Cabeado: texto sob o logo do rodapé.' },
      { chave: 'loja_aberta',            label: 'Loja aberta',             tipo: 'toggle',   descricao: 'Desligue para exibir um aviso de loja temporariamente fechada no topo da loja.' },
    ],
  },
]

// Cores read-only mostradas na seção Aparência (espelha as CSS vars do layout).
const CORES_PREVIEW: { chave: string; label: string; fallback: string }[] = [
  { chave: 'cor_principal',      label: 'Principal',        fallback: '#3cbfb3' },
  { chave: 'cor_principal_dark', label: 'Principal (dark)', fallback: '#2a9d8f' },
  { chave: 'cor_destaque',       label: 'Destaque',         fallback: '#f59e0b' },
  { chave: 'cor_header',         label: 'Header',           fallback: '#1a4f4a' },
  { chave: 'cor_botoes',         label: 'Botões',           fallback: '#3cbfb3' },
  { chave: 'bg_footer_cor',      label: 'Rodapé',           fallback: '#111827' },
]

const TODAS_EDITAVEIS = SECOES.flatMap((s) => (s.tipo === 'form' ? s.campos.map((c) => c.chave) : []))

function CampoEdicao({ campo, valor, onChange }: { campo: Campo; valor: string; onChange: (v: string) => void }) {
  if (campo.tipo === 'toggle') {
    const on = valor !== 'false' && valor !== '' // default ligado
    return (
      <button
        type="button"
        onClick={() => onChange(on ? 'false' : 'true')}
        className={`relative w-12 h-6 rounded-full transition-colors ${on ? 'bg-[#3cbfb3]' : 'bg-gray-300'}`}
        aria-pressed={on}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? 'left-6' : 'left-0.5'}`} />
      </button>
    )
  }
  if (campo.tipo === 'textarea') {
    return (
      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={campo.placeholder}
        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3cbfb3] transition resize-y"
      />
    )
  }
  return (
    <input
      type={campo.tipo === 'url' ? 'url' : 'text'}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={campo.placeholder}
      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3cbfb3] transition"
    />
  )
}

export default function ConfiguracoesLojaPage() {
  const [valores, setValores]   = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo]       = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca]       = useState('')
  const [abertas, setAbertas]   = useState<Record<string, boolean>>({ identidade: true })

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/admin/configuracoes?publica=1', { cache: 'no-store' })
      const data: Record<string, string> = await res.json()
      setValores(data ?? {})
    } catch (e) {
      console.error(e)
    }
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const salvar = async () => {
    setSalvando(true)
    try {
      // Salva só as chaves editáveis desta tela (não toca em cor_*/agente_*/home).
      const payload: Record<string, string> = {}
      for (const chave of TODAS_EDITAVEIS) if (valores[chave] !== undefined) payload[chave] = valores[chave]
      await fetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: payload }),
      })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
    } catch (e) {
      console.error(e)
    }
    setSalvando(false)
  }

  const set = (chave: string, v: string) => setValores((p) => ({ ...p, [chave]: v }))

  const q = busca.trim().toLowerCase()
  // Filtra campos por busca; seções com match abrem automaticamente.
  const secoesVisiveis = useMemo(() => {
    if (!q) return SECOES.map((s) => ({ secao: s, campos: s.tipo === 'form' ? s.campos : [] }))
    return SECOES
      .map((s) => {
        const tituloMatch = s.titulo.toLowerCase().includes(q)
        if (s.tipo === 'form') {
          const campos = s.campos.filter(
            (c) => tituloMatch || c.label.toLowerCase().includes(q) || c.chave.toLowerCase().includes(q),
          )
          return campos.length > 0 ? { secao: s, campos } : null
        }
        return tituloMatch ? { secao: s, campos: [] } : null
      })
      .filter(Boolean) as { secao: Secao; campos: Campo[] }[]
  }, [q])

  const isAberta = (id: string) => (q ? true : !!abertas[id])
  const toggle = (id: string) => setAbertas((p) => ({ ...p, [id]: !p[id] }))

  return (
    <div className="space-y-5 pb-10 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#e8f8f7' }}>
              <Settings size={20} style={{ color: '#3cbfb3' }} />
            </div>
            Configurações da Loja
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Identidade, SEO e contato. Cores e conteúdo da home ficam no Editor Visual; a Luna na aba Luna.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={carregar}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-all"
          >
            <RefreshCw size={13} /> Recarregar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:shadow-md disabled:opacity-60"
            style={{ background: salvo ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}
          >
            {salvando ? <RefreshCw size={16} className="animate-spin" /> : salvo ? <Check size={16} /> : <Save size={16} />}
            {salvando ? 'Salvando...' : salvo ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-2">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar configuração..."
          className="w-full text-sm focus:outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
        />
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 rounded-full border-2 border-[#3cbfb3] border-t-transparent animate-spin" />
        </div>
      ) : secoesVisiveis.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Nenhuma configuração encontrada</div>
      ) : (
        <div className="space-y-4">
          {secoesVisiveis.map(({ secao, campos }) => {
            const Icon = secao.icon
            const aberta = isAberta(secao.id)
            return (
              <section key={secao.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(secao.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/60 transition"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#e8f8f7' }}>
                    <Icon size={17} style={{ color: '#3cbfb3' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-black text-gray-900">{secao.titulo}</h2>
                    {secao.intro && <p className="text-xs text-gray-400 truncate">{secao.intro}</p>}
                  </div>
                  <ChevronDown size={18} className={`text-gray-300 transition-transform ${aberta ? 'rotate-180' : ''}`} />
                </button>

                {aberta && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-50">
                    {/* ── Form ── */}
                    {secao.tipo === 'form' && (
                      <div className="space-y-4 mt-4">
                        {campos.map((campo) => (
                          <div key={campo.chave}>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-sm font-bold text-gray-800">{campo.label}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{campo.chave}</span>
                            </div>
                            {campo.descricao && <p className="text-xs text-gray-500 mb-2">{campo.descricao}</p>}
                            <CampoEdicao campo={campo} valor={valores[campo.chave] ?? ''} onChange={(v) => set(campo.chave, v)} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Cores (read-only + link Editor Visual) ── */}
                    {secao.tipo === 'cores' && (
                      <div className="mt-4 space-y-4">
                        <div className="flex items-start gap-2 text-xs text-gray-500 bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2.5">
                          <Lock size={13} className="text-amber-500 shrink-0 mt-0.5" />
                          <span>Somente leitura. Edite as cores no <strong>Editor Visual</strong>, que tem preview ao vivo e é a fonte única.</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {CORES_PREVIEW.map((c) => {
                            const v = valores[c.chave] || c.fallback
                            return (
                              <div key={c.chave} className="flex items-center gap-2.5 border border-gray-100 rounded-xl px-3 py-2.5">
                                <span className="w-8 h-8 rounded-lg border border-gray-200 shrink-0" style={{ backgroundColor: v }} />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-700 truncate">{c.label}</p>
                                  <p className="text-[11px] text-gray-400 font-mono">{v}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <a
                          href={`${ADMIN_BASE}/editor-visual`}
                          className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl bg-[#3cbfb3] text-[#0f2e2b] hover:bg-[#2a9d8f] transition"
                        >
                          <Palette size={15} /> Editar cores no Editor Visual <ExternalLink size={13} />
                        </a>
                      </div>
                    )}

                    {/* ── Atalho (home / luna) ── */}
                    {secao.tipo === 'atalho' && (
                      <div className="mt-4 space-y-4">
                        <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50/50 border border-blue-100 rounded-xl px-3 py-2.5">
                          <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
                          <span>{secao.intro}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {secao.itens.map((it) => (
                            <span key={it} className="text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">{it}</span>
                          ))}
                        </div>
                        <a
                          href={secao.href}
                          className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl bg-[#3cbfb3] text-[#0f2e2b] hover:bg-[#2a9d8f] transition"
                        >
                          {secao.linkLabel} <ExternalLink size={13} />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
