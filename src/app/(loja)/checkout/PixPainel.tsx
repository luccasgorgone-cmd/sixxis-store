'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Copy, Check, Loader2, Clock } from 'lucide-react'

interface Props {
  qrBase64: string
  copiaECola: string
  pgtoId: string
  expiraEm: string | null
  onPago: () => void
  // Polling customizado, opcional. Ausente → comportamento original (consulta
  // /api/checkout/status/[pagamentoId], que marca o Pedido inteiro como pago).
  // Usado pelo checkout multi-método, onde essa consulta padrão seria errada:
  // a perna Pix aprovar sozinha não pode fechar o pedido (falta a perna cartão).
  pollStatus?: () => Promise<'approved' | 'rejected' | 'cancelled' | 'pending'>
  // Chamado quando o QR expira (ou o pagamento é recusado/cancelado) e o
  // cliente pede pra tentar de novo. Sem isso, a tela ficava travada num QR
  // morto sem nenhum jeito de continuar a compra.
  onExpirar: () => void
}

const POLL_MS = 4000

export default function PixPainel({
  qrBase64,
  copiaECola,
  pgtoId,
  expiraEm,
  onPago,
  pollStatus,
  onExpirar,
}: Props) {
  const [copiado, setCopiado] = useState(false)
  const [statusInfo, setStatusInfo] = useState<string>('Aguardando pagamento...')
  const [naoConcluido, setNaoConcluido] = useState(false)
  const [tempoRestante, setTempoRestante] = useState<number>(() => {
    if (expiraEm) {
      const ms = new Date(expiraEm).getTime() - Date.now()
      return Math.max(0, Math.floor(ms / 1000))
    }
    return 15 * 60
  })

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        let status: string | undefined
        if (pollStatus) {
          status = await pollStatus()
        } else {
          const r = await fetch(`/api/checkout/status/${pgtoId}`, {
            credentials: 'include',
          })
          if (!r.ok) return
          const d = (await r.json()) as { status?: string }
          status = d.status
        }
        if (cancelled) return
        if (status === 'approved') {
          onPago()
        } else if (status === 'rejected' || status === 'cancelled') {
          setStatusInfo('Pagamento não foi concluído.')
          setNaoConcluido(true)
        }
      } catch {
        // ignore
      }
    }

    const tick = setInterval(check, POLL_MS)
    check()

    return () => {
      cancelled = true
      clearInterval(tick)
    }
  }, [pgtoId, onPago, pollStatus])

  useEffect(() => {
    const t = setInterval(() => {
      setTempoRestante((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const min = Math.floor(tempoRestante / 60)
  const seg = String(tempoRestante % 60).padStart(2, '0')
  const expirou = tempoRestante <= 0

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <h2 className="font-extrabold text-gray-900 mb-0.5">Pague com PIX</h2>
        <p className="text-xs text-gray-400">
          Escaneie o QR Code com o app do seu banco ou copie o código.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="border border-gray-100 rounded-2xl p-3 bg-white">
          <Image
            src={`data:image/png;base64,${qrBase64}`}
            alt="QR Code PIX"
            width={240}
            height={240}
            className="block"
            unoptimized
          />
        </div>

        <div className="w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            PIX copia e cola
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={copiaECola}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono bg-gray-50 text-gray-600"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(copiaECola)
                setCopiado(true)
                setTimeout(() => setCopiado(false), 2000)
              }}
              className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-semibold rounded-xl px-4 py-2.5 text-xs flex items-center gap-1.5 transition shrink-0"
            >
              {copiado ? <Check size={13} /> : <Copy size={13} />}
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 text-xs font-semibold ${
            expirou ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Clock size={12} />
          {expirou
            ? 'Tempo expirado — gere um novo PIX'
            : `Expira em ${min}:${seg}`}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#3cbfb3]">
          {!expirou && !naoConcluido && <Loader2 size={12} className="animate-spin" />}
          {statusInfo}
        </div>

        {(expirou || naoConcluido) && (
          <button
            type="button"
            onClick={onExpirar}
            className="w-full bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold py-3 rounded-xl text-sm transition"
          >
            Gerar novo Pix ou trocar de método
          </button>
        )}
      </div>

      <div className="bg-[#e8f8f7] border border-[#3cbfb3]/20 rounded-xl px-4 py-3 text-xs text-gray-600 leading-relaxed">
        Após o pagamento, esta tela atualiza automaticamente. Você também
        receberá um e-mail de confirmação.
      </div>
    </div>
  )
}
