'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingCart, CreditCard, User, Save, RefreshCw,
  ChevronRight, Settings, Info, Check,
  ToggleLeft, ToggleRight, Hash, Type, Code,
} from 'lucide-react'

const GRUPOS = [
  { id: 'carrinho', label: 'Carrinho',    icon: ShoppingCart, cor: '#3cbfb3' },
  { id: 'checkout', label: 'Checkout',    icon: CreditCard,   cor: '#a855f7' },
  { id: 'conta',    label: 'Minha Conta', icon: User,         cor: '#3b82f6' },
  { id: 'geral',    label: 'Geral',       icon: Settings,     cor: '#6b7280' },
]

interface ConfigItem {
  id: string
  chave: string
  valor: string
  tipo: string
  grupo: string
  label: string | null
  descricao: string | null
}

function TipoIcon({ tipo }: { tipo: string }) {
  if (tipo === 'boolean') return <ToggleLeft size={14} className="text-green-500" />
  if (tipo === 'numero')  return <Hash size={14} className="text-blue-500" />
  if (tipo === 'json')    return <Code size={14} className="text-purple-500" />
  return <Type size={14} className="text-gray-400" />
}

function CampoEdicao({ config, valor, onChange }: {
  config: ConfigItem; valor: string; onChange: (v: string) => void
}) {
  if (config.tipo === 'boolean') {
    const ativo = valor === 'true'
    return (
      <button
        onClick={() => onChange(ativo ? 'false' : 'true')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
          ativo ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'
        }`}
      >
        {ativo ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
        {ativo ? 'Ativado' : 'Desativado'}
      </button>
    )
  }
  if (config.tipo === 'numero') {
    return (
      <input type="number" value={valor} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3cbfb3] font-mono transition" />
    )
  }
  if (config.tipo === 'json') {
    return (
      <textarea value={valor} onChange={e => onChange(e.target.value)} rows={8} spellCheck={false}
        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3cbfb3] font-mono transition resize-y" />
    )
  }
  if (valor.length > 80) {
    return (
      <textarea value={valor} onChange={e => onChange(e.target.value)} rows={3}
        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3cbfb3] transition resize-none" />
    )
  }
  return (
    <input type="text" value={valor} onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3cbfb3] transition" />
  )
}

export default function ConfiguracoesLojaPage() {
  const [grupoAtivo, setGrupoAtivo] = useState('geral')
  const [configs, setConfigs]       = useState<ConfigItem[]>([])
  const [valores, setValores]       = useState<Record<string, string>>({})
  const [salvando, setSalvando]     = useState(false)
  const [savedKeys, setSavedKeys]   = useState<Set<string>>(new Set())
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca]           = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/admin/configuracoes')
      const data: Record<string, string> = await res.json()
      const items: ConfigItem[] = Object.entries(data).map(([chave, valor]) => ({
        id: chave, chave, valor: String(valor),
        tipo: typeof valor === 'boolean' ? 'boolean' : (isNaN(Number(valor)) ? 'texto' : 'texto'),
        grupo: 'geral', label: chave, descricao: null,
      }))
      setConfigs(items)
      setValores(Object.fromEntries(items.map(c => [c.chave, c.valor])))
    } catch (e) { console.error(e) }
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const salvarTudo = async () => {
    setSalvando(true)
    try {
      await fetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores),
      })
      setSavedKeys(new Set(Object.keys(valores)))
      setTimeout(() => setSavedKeys(new Set()), 3000)
    } catch (e) { console.error(e) }
    setSalvando(false)
  }

  const configsFiltradas = configs.filter(c =>
    !busca || (c.label || c.chave).toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#e8f8f7' }}>
              <Settings size={20} style={{ color: '#3cbfb3' }} />
            </div>
            Configurações da Loja
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Edite textos, valores e comportamentos da loja
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={carregar}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-all">
            <RefreshCw size={13} /> Recarregar
          </button>
          <button onClick={salvarTudo} disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:shadow-md disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}>
            {salvando ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {salvando ? 'Salvando...' : 'Salvar tudo'}
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar configuração..."
          className="w-full text-sm focus:outline-none text-gray-700 placeholder:text-gray-400" />
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 rounded-full border-2 border-[#3cbfb3] border-t-transparent animate-spin" />
        </div>
      ) : configsFiltradas.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Nenhuma configuração encontrada</div>
      ) : (
        <div className="space-y-3">
          {configsFiltradas.map(config => {
            const valorAtual = valores[config.chave] ?? config.valor
            const foiSalvo = savedKeys.has(config.chave)
            return (
              <div key={config.chave}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${foiSalvo ? 'border-emerald-300' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-black text-gray-900">{config.label || config.chave}</p>
                      {foiSalvo && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <Check size={10} /> Salvo
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-300 font-mono">{config.chave}</p>
                  </div>
                </div>
                <CampoEdicao config={config} valor={valorAtual}
                  onChange={v => setValores(prev => ({ ...prev, [config.chave]: v }))} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
