'use client'

import { useEffect, useState } from 'react'
import { Coins } from 'lucide-react'
import { useCarrinho } from '@/hooks/useCarrinho'

// Cashback aplicável = no máx. 10% do subtotal de produtos (espelha o servidor,
// que recapa no POST /api/pedidos). Nunca usa cashback PENDENTE — só o saldo
// disponível (/api/cashback.saldo).
const TETO_USO = 0.10

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Props {
  // Subtotal de PRODUTOS (sem frete) — base do teto de 10%.
  subtotalProdutos: number
  // Reporta ao pai o valor de cashback efetivamente aplicável (0 quando desligado).
  onValor?: (v: number) => void
  compact?: boolean
}

export default function UsarCashback({ subtotalProdutos, onValor, compact }: Props) {
  const [saldo, setSaldo] = useState<number | null>(null)
  const ativo = useCarrinho((s) => s.usarCashback)
  const setAtivo = useCarrinho((s) => s.setUsarCashback)

  useEffect(() => {
    let cancel = false
    fetch('/api/cashback')
      .then((r) => r.json())
      .then((d) => { if (!cancel) setSaldo(Number(d.saldo) || 0) })
      .catch(() => { if (!cancel) setSaldo(0) })
    return () => { cancel = true }
  }, [])

  const teto = parseFloat((Math.max(0, subtotalProdutos) * TETO_USO).toFixed(2))
  const aplicavel = Math.min(saldo ?? 0, teto)
  const temSaldo = (saldo ?? 0) > 0
  const valor = ativo && temSaldo ? aplicavel : 0

  // Mantém o pai (total/checkout) sincronizado com o valor efetivo.
  useEffect(() => {
    onValor?.(valor)
  }, [valor, onValor])

  // Carregando: não renderiza nada (evita flicker) — o valor já foi reportado (0).
  if (saldo === null) return null

  // Sem saldo disponível: mensagem sutil, sem toggle.
  if (!temSaldo) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
        <Coins size={15} className="text-gray-300 shrink-0" />
        <p className="text-xs text-gray-400">
          Você ainda não tem cashback disponível para usar.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#3cbfb3]/30 bg-[#f0fffe] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#3cbfb3]/10 flex items-center justify-center shrink-0">
            <Coins size={16} className="text-[#3cbfb3]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-tight">Usar meu cashback</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Disponível: <span className="font-bold text-[#0f9488]">R$ {fmt(saldo ?? 0)}</span>
            </p>
          </div>
        </div>

        {/* Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={ativo}
          aria-label="Usar meu cashback"
          onClick={() => setAtivo(!ativo)}
          className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200 ${
            ativo ? 'bg-[#3cbfb3]' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
              ativo ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {ativo && (
        <div className="mt-2.5 pt-2.5 border-t border-[#3cbfb3]/20">
          {aplicavel > 0 ? (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Aplicado nesta compra{!compact && ' (até 10% dos produtos)'}
              </span>
              <span className="font-bold text-[#0f9488]">− R$ {fmt(aplicavel)}</span>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Sem valor aplicável para este subtotal.</p>
          )}
        </div>
      )}
    </div>
  )
}
