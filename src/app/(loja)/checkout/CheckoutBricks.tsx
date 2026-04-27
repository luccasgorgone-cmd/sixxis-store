'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { initMercadoPago } from '@mercadopago/sdk-react'
import { Loader2, AlertCircle } from 'lucide-react'
import PixPainel from './PixPainel'

const Payment = dynamic(
  () => import('@mercadopago/sdk-react').then((m) => m.Payment),
  { ssr: false },
)

interface Props {
  pedidoId: string
  valor: number // em BRL (não centavos)
  payerEmail: string
  payerNome?: string
  payerCpf?: string
  onSucesso: () => void
}

interface PixState {
  qr: string
  copy: string
  pgtoId: string
  expiraEm: string | null
}

interface BricksFormData {
  payment_method_id?: string
  token?: string
  installments?: number
  issuer_id?: string
  payer?: {
    email?: string
    identification?: { type?: string; number?: string }
  }
}

export default function CheckoutBricks({
  pedidoId,
  valor,
  payerEmail,
  payerNome,
  payerCpf,
  onSucesso,
}: Props) {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [pix, setPix] = useState<PixState | null>(null)
  const initRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/checkout/config')
      .then((r) => r.json())
      .then((d: { publicKey?: string; enabled?: boolean }) => {
        if (cancelled) return
        if (!d.enabled || !d.publicKey) {
          setErro('Pagamentos temporariamente indisponíveis. Tente novamente em alguns minutos.')
          return
        }
        if (!initRef.current) {
          initMercadoPago(d.publicKey, { locale: 'pt-BR' })
          initRef.current = true
        }
        setPublicKey(d.publicKey)
      })
      .catch(() => {
        if (!cancelled) setErro('Falha ao iniciar pagamento')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (pix) {
    return (
      <PixPainel
        qrBase64={pix.qr}
        copiaECola={pix.copy}
        pgtoId={pix.pgtoId}
        expiraEm={pix.expiraEm}
        onPago={onSucesso}
      />
    )
  }

  if (erro && !publicKey) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex gap-3 items-start">
        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700">{erro}</p>
        </div>
      </div>
    )
  }

  if (!publicKey) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 flex items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 size={14} className="animate-spin text-[#3cbfb3]" />
        Carregando formas de pagamento...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {erro && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex gap-2 text-xs text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          {erro}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-1 sm:p-4 shadow-sm relative">
        {carregando && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0f2e2b]">
              <Loader2 size={16} className="animate-spin text-[#3cbfb3]" />
              Processando pagamento...
            </div>
          </div>
        )}

        <Payment
          initialization={{
            amount: valor,
            payer: {
              email: payerEmail,
              ...(payerCpf
                ? {
                    identification: {
                      type: 'CPF',
                      number: payerCpf.replace(/\D/g, ''),
                    },
                  }
                : {}),
            },
          }}
          customization={{
            paymentMethods: {
              creditCard: 'all',
              bankTransfer: ['pix'],
              maxInstallments: 12,
            },
            visual: {
              style: { theme: 'default' },
            },
          }}
          onSubmit={async ({ formData }: { formData: BricksFormData }) => {
            setErro(null)
            setCarregando(true)
            try {
              const isPix = formData.payment_method_id === 'pix'
              const isCard =
                !isPix &&
                Boolean(formData.token) &&
                Boolean(formData.payment_method_id)

              const body = isPix
                ? {
                    pedidoId,
                    metodo: 'pix' as const,
                    payerEmail: formData.payer?.email ?? payerEmail,
                    payerNome,
                    payerCpf:
                      formData.payer?.identification?.number ?? payerCpf,
                  }
                : isCard
                  ? {
                      pedidoId,
                      metodo: 'credit_card' as const,
                      cardToken: formData.token,
                      parcelas: formData.installments ?? 1,
                      issuerId: formData.issuer_id,
                      paymentMethodId: formData.payment_method_id,
                      payerEmail: formData.payer?.email ?? payerEmail,
                      payerNome,
                      payerCpf:
                        formData.payer?.identification?.number ?? payerCpf,
                    }
                  : null

              if (!body) {
                throw new Error('Forma de pagamento não suportada')
              }

              const resp = await fetch('/api/checkout/criar-pagamento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'include',
              })
              const data = await resp.json()
              if (!resp.ok) {
                throw new Error(data.error || 'Erro ao processar pagamento')
              }

              if (data.qrCodeBase64) {
                setPix({
                  qr: data.qrCodeBase64,
                  copy: data.qrCodeCopiaECola,
                  pgtoId: data.pagamentoId,
                  expiraEm: data.pixExpiraEm ?? null,
                })
              } else if (data.status === 'approved') {
                onSucesso()
              } else if (data.status === 'in_process' || data.status === 'pending') {
                setErro(
                  'Pagamento em análise. Você receberá um e-mail assim que for aprovado.',
                )
              } else if (data.status === 'rejected') {
                setErro(
                  'Pagamento recusado. Verifique os dados do cartão ou tente outro método.',
                )
              } else {
                setErro('Pagamento em processamento. Aguarde a confirmação.')
              }
            } catch (e) {
              const err = e as { message?: string }
              setErro(err.message || 'Falha ao processar pagamento')
            } finally {
              setCarregando(false)
            }
          }}
          onError={(err) => {
            console.error('[bricks:error]', err)
            setErro('Erro ao validar dados de pagamento')
          }}
        />
      </div>
    </div>
  )
}
