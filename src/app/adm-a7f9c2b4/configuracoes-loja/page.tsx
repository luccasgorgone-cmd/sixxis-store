'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Save, RefreshCw, Settings, Check,
} from 'lucide-react'

type CampoTipo = 'cor' | 'texto' | 'numero' | 'url' | 'textarea'

interface ConfigMeta {
  label: string
  descricao?: string
  tipo: CampoTipo
  grupo: string
}

const CONFIG_LABELS: Record<string, ConfigMeta> = {
  // Aparência — cores
  cor_principal:            { label: 'Cor Principal (Tiffany)',  descricao: 'Cor primária da marca', tipo: 'cor', grupo: 'Aparência' },
  cor_header:               { label: 'Cor do Header',            tipo: 'cor', grupo: 'Aparência' },
  cor_textos:               { label: 'Cor dos Textos',           tipo: 'cor', grupo: 'Aparência' },
  cor_destaque:             { label: 'Cor de Destaque',          tipo: 'cor', grupo: 'Aparência' },
  cor_trustbar_fundo:       { label: 'Fundo da Trust Bar',       tipo: 'cor', grupo: 'Aparência' },
  cor_trustbar_icones:      { label: 'Ícones da Trust Bar',      tipo: 'cor', grupo: 'Aparência' },
  cor_badge_novo:           { label: 'Cor Badge "Novo"',         tipo: 'cor', grupo: 'Aparência' },
  cor_badge_esgotado:       { label: 'Cor Badge "Esgotado"',     tipo: 'cor', grupo: 'Aparência' },
  cor_stats_fundo:          { label: 'Fundo das Estatísticas',   tipo: 'cor', grupo: 'Aparência' },
  aparencia_cor_primaria:   { label: 'Aparência — Cor Primária',   descricao: 'Cor primária global (padrão: #3cbfb3)',   tipo: 'cor', grupo: 'Aparência' },
  aparencia_cor_secundaria: { label: 'Aparência — Cor Secundária', descricao: 'Cor secundária global (padrão: #1a4f4a)', tipo: 'cor', grupo: 'Aparência' },

  // Hero
  hero_titulo: { label: 'Título do Hero', tipo: 'texto', grupo: 'Hero/Banner Principal' },

  // Loja — informações
  loja_endereco:  { label: 'Endereço da Loja', tipo: 'textarea', grupo: 'Informações da Empresa' },
  loja_descricao: { label: 'Descrição da Loja', tipo: 'textarea', grupo: 'Informações da Empresa' },
  logo_url:       { label: 'URL do Logo',     tipo: 'url', grupo: 'Informações da Empresa' },

  // Por que Sixxis
  pq_sixxis_1_titulo: { label: 'Card 1 — Título',     tipo: 'texto',    grupo: 'Por que Sixxis?' },
  pq_sixxis_1_texto:  { label: 'Card 1 — Descrição',  tipo: 'textarea', grupo: 'Por que Sixxis?' },
  pq_sixxis_1_icone:  { label: 'Card 1 — Ícone',      tipo: 'texto',    grupo: 'Por que Sixxis?' },
  pq_sixxis_2_titulo: { label: 'Card 2 — Título',     tipo: 'texto',    grupo: 'Por que Sixxis?' },
  pq_sixxis_2_texto:  { label: 'Card 2 — Descrição',  tipo: 'textarea', grupo: 'Por que Sixxis?' },
  pq_sixxis_2_icone:  { label: 'Card 2 — Ícone',      tipo: 'texto',    grupo: 'Por que Sixxis?' },
  pq_sixxis_3_titulo: { label: 'Card 3 — Título',     tipo: 'texto',    grupo: 'Por que Sixxis?' },
  pq_sixxis_3_texto:  { label: 'Card 3 — Descrição',  tipo: 'textarea', grupo: 'Por que Sixxis?' },
  pq_sixxis_3_icone:  { label: 'Card 3 — Ícone',      tipo: 'texto',    grupo: 'Por que Sixxis?' },
  pq_sixxis_4_titulo: { label: 'Card 4 — Título',     tipo: 'texto',    grupo: 'Por que Sixxis?' },
  pq_sixxis_4_texto:  { label: 'Card 4 — Descrição',  tipo: 'textarea', grupo: 'Por que Sixxis?' },
  pq_sixxis_4_icone:  { label: 'Card 4 — Ícone',      tipo: 'texto',    grupo: 'Por que Sixxis?' },
}

function inferTipo(chave: string, valor: string): CampoTipo {
  const meta = CONFIG_LABELS[chave]
  if (meta) return meta.tipo
  if (/^#[0-9a-fA-F]{3,8}$/.test(valor.trim())) return 'cor'
  if (/^https?:\/\//i.test(valor.trim())) return 'url'
  if (!Number.isNaN(Number(valor)) && valor.trim() !== '') return 'numero'
  if (valor.length > 80) return 'textarea'
  return 'texto'
}

function inferGrupo(chave: string): string {
  const meta = CONFIG_LABELS[chave]
  if (meta) return meta.grupo
  if (chave.startsWith('cor_') || chave.startsWith('aparencia_')) return 'Aparência'
  if (chave.startsWith('hero_')) return 'Hero/Banner Principal'
  if (chave.startsWith('pq_sixxis_')) return 'Por que Sixxis?'
  if (chave.startsWith('loja_') || chave === 'logo_url') return 'Informações da Empresa'
  return 'Outros'
}

function humanizeKey(chave: string): string {
  return chave
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

interface ConfigItem {
  chave: string
  valor: string
  label: string
  descricao?: string
  tipo: CampoTipo
  grupo: string
}

function CampoCor({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const hex = /^#[0-9a-fA-F]{3,8}$/.test(valor.trim()) ? valor.trim() : '#000000'
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0"
        aria-label="Seletor de cor"
      />
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#3cbfb3"
        className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#3cbfb3] transition"
      />
      <div
        className="w-10 h-10 rounded-full border border-gray-200 shrink-0"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
    </div>
  )
}

function CampoEdicao({ item, valor, onChange }: {
  item: ConfigItem; valor: string; onChange: (v: string) => void
}) {
  if (item.tipo === 'cor') {
    return <CampoCor valor={valor} onChange={onChange} />
  }
  if (item.tipo === 'numero') {
    return (
      <input
        type="number"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3cbfb3] font-mono transition"
      />
    )
  }
  if (item.tipo === 'url') {
    return (
      <input
        type="url"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3cbfb3] transition"
      />
    )
  }
  if (item.tipo === 'textarea') {
    return (
      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3cbfb3] transition resize-y"
      />
    )
  }
  return (
    <input
      type="text"
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3cbfb3] transition"
    />
  )
}

const GRUPO_ORDEM = [
  'Aparência',
  'Hero/Banner Principal',
  'Por que Sixxis?',
  'Informações da Empresa',
  'Outros',
]

const DEFAULT_VALORES: Record<string, string> = {
  aparencia_cor_primaria:   '#3cbfb3',
  aparencia_cor_secundaria: '#1a4f4a',
}

export default function ConfiguracoesLojaPage() {
  const [items, setItems]       = useState<ConfigItem[]>([])
  const [valores, setValores]   = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      // ?publica=1 retorna apenas o allowlist de chaves seguras para edição.
      // Secrets (api_key, tokens, hashes) são filtradas no servidor.
      const res = await fetch('/api/admin/configuracoes?publica=1')
      const data: Record<string, string> = await res.json()
      const novos: ConfigItem[] = Object.entries(data).map(([chave, v]) => {
        const raw = String(v ?? '')
        const valor = raw.trim() === '' ? (DEFAULT_VALORES[chave] ?? '') : raw
        const meta = CONFIG_LABELS[chave]
        return {
          chave,
          valor,
          label: meta?.label ?? humanizeKey(chave),
          descricao: meta?.descricao,
          tipo: meta?.tipo ?? inferTipo(chave, valor),
          grupo: meta?.grupo ?? inferGrupo(chave),
        }
      })
      novos.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
      setItems(novos)
      setValores(Object.fromEntries(novos.map((c) => [c.chave, c.valor])))
    } catch (e) {
      console.error(e)
    }
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const salvarTudo = async () => {
    setSalvando(true)
    try {
      await fetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: valores }),
      })
      setSavedKeys(new Set(Object.keys(valores)))
      setTimeout(() => setSavedKeys(new Set()), 3000)
    } catch (e) {
      console.error(e)
    }
    setSalvando(false)
  }

  const q = busca.trim().toLowerCase()
  const itensFiltrados = items.filter((c) =>
    !q ||
    c.label.toLowerCase().includes(q) ||
    c.chave.toLowerCase().includes(q) ||
    c.grupo.toLowerCase().includes(q)
  )

  const grupos: Record<string, ConfigItem[]> = {}
  itensFiltrados.forEach((c) => {
    if (!grupos[c.grupo]) grupos[c.grupo] = []
    grupos[c.grupo].push(c)
  })
  const gruposOrdenados = Object.keys(grupos).sort((a, b) => {
    const ia = GRUPO_ORDEM.indexOf(a); const ib = GRUPO_ORDEM.indexOf(b)
    const ra = ia === -1 ? GRUPO_ORDEM.length : ia
    const rb = ib === -1 ? GRUPO_ORDEM.length : ib
    if (ra !== rb) return ra - rb
    return a.localeCompare(b, 'pt-BR')
  })

  return (
    <div className="space-y-6 pb-8 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#e8f8f7' }}>
              <Settings size={20} style={{ color: '#3cbfb3' }} />
            </div>
            Configurações da Loja
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Edite textos, cores e comportamentos da loja.
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
            onClick={salvarTudo}
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:shadow-md disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}
          >
            {salvando ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {salvando ? 'Salvando...' : 'Salvar tudo'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, chave ou grupo..."
          className="w-full text-sm focus:outline-none text-gray-700 placeholder:text-gray-400"
        />
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 rounded-full border-2 border-[#3cbfb3] border-t-transparent animate-spin" />
        </div>
      ) : itensFiltrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Nenhuma configuração encontrada</div>
      ) : (
        <div className="space-y-8">
          {gruposOrdenados.map((grupo) => (
            <section key={grupo}>
              <h2 className="text-lg font-bold text-[#0f2e2b] mb-4 pb-2 border-b border-gray-200">
                {grupo}
              </h2>
              <div className="space-y-4">
                {grupos[grupo].map((item) => {
                  const valorAtual = valores[item.chave] ?? item.valor
                  const foiSalvo = savedKeys.has(item.chave)
                  return (
                    <div
                      key={item.chave}
                      className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${foiSalvo ? 'border-emerald-300' : 'border-gray-100'}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-bold text-gray-900">{item.label}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{item.chave}</span>
                            {foiSalvo && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <Check size={10} /> Salvo
                              </span>
                            )}
                          </div>
                          {item.descricao && (
                            <p className="text-xs text-gray-500">{item.descricao}</p>
                          )}
                        </div>
                      </div>
                      <CampoEdicao
                        item={item}
                        valor={valorAtual}
                        onChange={(v) => setValores((prev) => ({ ...prev, [item.chave]: v }))}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
