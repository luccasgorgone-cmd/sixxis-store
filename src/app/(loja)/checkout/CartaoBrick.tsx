'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { initMercadoPago } from '@mercadopago/sdk-react'
import { Loader2, AlertCircle } from 'lucide-react'
import { MAX_PARCELAS_SEM_JUROS } from '@/lib/parcelamento'
import { capturarDeviceIdMp } from '@/lib/mp-device-id'

const Payment = dynamic(
  () => import('@mercadopago/sdk-react').then((m) => m.Payment),
  { ssr: false },
)

interface BricksFormData {
  payment_method_id?: string
  token?: string
  installments?: number
  issuer_id?: string
}

export interface CartaoTokenizado {
  token: string
  bandeiraId: string
  metodo: 'credit_card' | 'debit_card'
  parcelas: number
  issuerId?: string
  deviceId?: string
}

interface Props {
  publicKey: string
  valor: number // BRL desta perna (não centavos) — usado pro cálculo de parcelas exibido
  payerEmail: string
  payerCpf?: string
  label: string
  onToken: (dados: CartaoTokenizado) => void
}

// Tokeniza UM cartão via Brick, sem chamar nenhum endpoint de pagamento — quem
// chama decide o que fazer com o token (dois-cartões ou pix-mais-cartão).
// Mesma customização visual do CheckoutBricks.tsx (identidade Sixxis), mas
// restrita a cartão (sem Pix/boleto) já que a divisão de método é escolhida
// antes desta etapa.
export default function CartaoBrick({ publicKey, valor, payerEmail, payerCpf, label, onToken }: Props) {
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const initRef = useRef(false)

  useEffect(() => {
    if (!initRef.current) {
      initMercadoPago(publicKey, { locale: 'pt-BR' })
      initRef.current = true
    }
  }, [publicKey])

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#0f2e2b]">{label}</p>

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
              Validando cartão...
            </div>
          </div>
        )}

        <Payment
          initialization={{
            amount: valor,
            payer: {
              email: payerEmail,
              ...(payerCpf
                ? { identification: { type: 'CPF', number: payerCpf.replace(/\D/g, '') } }
                : {}),
            },
          }}
          customization={{
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              maxInstallments: MAX_PARCELAS_SEM_JUROS,
            },
            visual: {
              style: {
                theme: 'flat',
                customVariables: {
                  baseColor: '#3cbfb3',
                  baseColorFirstVariant: '#2a9d8f',
                  baseColorSecondVariant: '#e8f8f7',
                  textPrimaryColor: '#0f2e2b',
                  textSecondaryColor: '#6b7280',
                  inputBackgroundColor: '#ffffff',
                  formBackgroundColor: '#ffffff',
                  outlinePrimaryColor: '#3cbfb3',
                  outlineSecondaryColor: '#e5e7eb',
                  buttonTextColor: '#ffffff',
                  borderRadiusSmall: '8px',
                  borderRadiusMedium: '12px',
                  borderRadiusLarge: '16px',
                  borderRadiusFull: '9999px',
                  fontSizeMedium: '14px',
                },
              },
            },
          }}
          onSubmit={async ({ formData }: { formData: BricksFormData }) => {
            setErro(null)
            setCarregando(true)
            try {
              const pmId = formData.payment_method_id ?? ''
              if (!formData.token || !pmId) {
                throw new Error('Não foi possível validar o cartão')
              }
              const isDebit = /^deb|debit/i.test(pmId)
              onToken({
                token: formData.token,
                bandeiraId: pmId,
                metodo: isDebit ? 'debit_card' : 'credit_card',
                parcelas: formData.installments ?? 1,
                issuerId: formData.issuer_id,
                deviceId: capturarDeviceIdMp(),
              })
            } catch (e) {
              const err = e as { message?: string }
              setErro(err.message || 'Falha ao validar cartão')
            } finally {
              setCarregando(false)
            }
          }}
          onError={(err) => {
            console.error('[cartao-brick:error]', err)
            setErro('Erro ao validar dados do cartão')
          }}
        />
      </div>
    </div>
  )
}
