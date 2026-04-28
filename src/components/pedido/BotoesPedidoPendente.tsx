'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, X, Loader2, AlertCircle } from 'lucide-react'

interface Props {
  pedidoId: string
  podeCancelar: boolean   // false após janela de 48h
}

export default function BotoesPedidoPendente({ pedidoId, podeCancelar }: Props) {
  const router = useRouter()
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [erro, setErro] = useState('')

  async function cancelar() {
    setCancelando(true)
    setErro('')
    try {
      const r = await fetch(`/api/pedidos/${pedidoId}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: 'cliente solicitou cancelamento' }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro ao cancelar')
      router.refresh()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao cancelar')
    } finally {
      setCancelando(false)
      setConfirmandoCancelar(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-start gap-2 mb-3">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-900">Aguardando pagamento</p>
          <p className="text-xs text-amber-800 mt-0.5">
            {podeCancelar
              ? 'Você pode finalizar agora ou cancelar nas próximas 48h após criação.'
              : 'A janela de cancelamento (48h) expirou. Finalize o pagamento ou aguarde a expiração automática.'}
          </p>
        </div>
      </div>

      {erro && (
        <p className="text-xs text-red-600 mb-3">{erro}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <a
          href={`/checkout/retomar/${pedidoId}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#3cbfb3] hover:bg-[#2a9d8f] transition shadow-sm"
        >
          <CreditCard size={14} /> Pagar agora
        </a>
        {podeCancelar && (
          <button
            type="button"
            onClick={() => setConfirmandoCancelar(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-700 border border-red-200 bg-white hover:bg-red-50 transition"
          >
            <X size={14} /> Cancelar pedido
          </button>
        )}
      </div>

      {confirmandoCancelar && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">Cancelar pedido?</h3>
            <p className="text-sm text-gray-600 mb-5">
              Esta ação não pode ser desfeita. O estoque será devolvido e o cupom (se houver) será liberado.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoCancelar(false)}
                disabled={cancelando}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={cancelar}
                disabled={cancelando}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelando ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                {cancelando ? 'Cancelando…' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
