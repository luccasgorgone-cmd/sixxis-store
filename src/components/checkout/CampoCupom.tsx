'use client'

import { useState } from 'react'
import { Tag, X, Check, Loader2 } from 'lucide-react'

interface Props {
  total:     number
  onAplicar: (codigo: string, desconto: number) => void
  onRemover: () => void
}

export default function CampoCupom({ total, onAplicar, onRemover }: Props) {
  const [codigo, setCodigo] = useState('')
  const [aplicado, setAplicado] = useState<{ codigo: string; desconto: number } | null>(null)
  const [validando, setValidando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleAplicar() {
    if (!codigo.trim()) { setErro('Digite um código'); return }
    setErro('')
    setValidando(true)

    const r = await fetch('/api/cupons/validar', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ codigo: codigo.trim(), total }),
    })

    const d = await r.json()
    setValidando(false)

    if (d.valido) {
      setAplicado({ codigo: d.codigo, desconto: d.desconto })
      onAplicar(d.codigo, d.desconto)
    } else {
      setErro(d.erro ?? 'Cupom inválido')
    }
  }

  function handleRemover() {
    setAplicado(null)
    setCodigo('')
    setErro('')
    onRemover()
  }

  if (aplicado) {
    return (
      <div className="bg-[#e8f8f7] border border-[#3cbfb3]/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#3cbfb3]" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Cupom aplicado</p>
              <p className="text-xs font-mono text-[#3cbfb3] font-bold">{aplicado.codigo}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-green-600">
              -{aplicado.desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <button onClick={handleRemover} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 ml-auto mt-0.5 transition">
              <X className="w-3 h-3" /> Remover
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-gray-400" />
        <p className="text-sm font-semibold text-gray-700">Cupom de desconto</p>
      </div>
      <div className="flex gap-2">
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleAplicar()}
          placeholder="CÓDIGO"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-base sm:text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
        />
        <button
          onClick={handleAplicar}
          disabled={validando}
          className="bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition"
        >
          {validando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
        </button>
      </div>
      {erro && <p className="text-xs text-red-500 mt-2">{erro}</p>}
    </div>
  )
}
