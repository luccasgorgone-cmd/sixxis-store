'use client'

import { useEffect, useState } from 'react'
import { Coins, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

interface Props {
  total: number
  onAplicar: (desconto: number) => void
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

export default function UsarCashback({ total, onAplicar }: Props) {
  const [saldo, setSaldo]         = useState<number | null>(null)
  const [loading, setLoading]     = useState(true)
  const [aberto, setAberto]       = useState(false)
  const [valorUsar, setValorUsar] = useState('')
  const [aplicado, setAplicado]   = useState(false)

  useEffect(() => {
    fetch('/api/cashback')
      .then(r => r.json())
      .then(d => setSaldo(d.saldo ?? 0))
      .catch(() => setSaldo(0))
      .finally(() => setLoading(false))
  }, [])

  if (loading || saldo === null || saldo <= 0) return null

  const maxUsar    = Math.min(saldo, total)
  const valorNum   = Math.min(Math.max(0, Number(valorUsar) || 0), maxUsar)

  function aplicar() {
    if (valorNum <= 0) return
    onAplicar(valorNum)
    setAplicado(true)
  }

  function remover() {
    onAplicar(0)
    setAplicado(false)
    setValorUsar('')
  }

  return (
    <div className="border border-[#3cbfb3]/30 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto(a => !a)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#f0fffe] hover:bg-[#e8f8f7] transition"
      >
        <div className="flex items-center gap-2">
          <Coins size={16} className="text-[#3cbfb3]" />
          <span className="text-sm font-semibold text-gray-800">Usar Cashback</span>
          <span className="text-xs bg-[#3cbfb3]/10 text-[#3cbfb3] font-bold px-2 py-0.5 rounded-full">
            R$ {fmt(saldo)} disponível
          </span>
        </div>
        {aberto ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {aberto && (
        <div className="px-4 py-4 bg-white border-t border-[#3cbfb3]/20">
          {aplicado ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700">Cashback aplicado!</p>
                <p className="text-xs text-gray-500">Desconto de R$ {fmt(valorNum)} no pedido</p>
              </div>
              <button
                type="button"
                onClick={remover}
                className="text-xs text-red-500 hover:text-red-700 font-semibold transition"
              >
                Remover
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-3">
                Use até <strong>R$ {fmt(maxUsar)}</strong> de cashback nesta compra.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={maxUsar}
                  value={valorUsar}
                  onChange={e => setValorUsar(e.target.value)}
                  placeholder={`Máx. R$ ${fmt(maxUsar)}`}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/30 focus:border-[#3cbfb3]"
                />
                <button
                  type="button"
                  onClick={() => setValorUsar(String(maxUsar.toFixed(2)))}
                  className="text-xs text-[#3cbfb3] hover:text-[#2a9d8f] font-semibold px-3 py-2 border border-[#3cbfb3]/30 rounded-xl hover:bg-[#f0fffe] transition"
                >
                  Usar tudo
                </button>
                <button
                  type="button"
                  onClick={aplicar}
                  disabled={valorNum <= 0}
                  className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-xs font-bold px-4 py-2 rounded-xl transition disabled:opacity-50"
                >
                  Aplicar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
