'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { initMercadoPago } from '@mercadopago/sdk-react'
import { Loader2, AlertCircle } from 'lucide-react'
import PixPainel from './PixPainel'
import { MAX_PARCELAS_SEM_JUROS } from '@/lib/parcelamento'
import { capturarDeviceIdMp } from '@/lib/mp-device-id'

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
  onMetodoSelecionado?: (metodo: string) => void
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
  onMetodoSelecionado,
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
        onExpirar={() => setPix(null)}
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
              debitCard: 'all',
              bankTransfer: ['pix'],
              // boleto (ticket) intencionalmente NÃO habilitado.
              // Limita as parcelas ao "sem juros" (fonte única). "Sem juros até N"
              // depende da configuração da CONTA Mercado Pago (a loja absorve os
              // juros) — este código só LIMITA/EXIBE, não altera quem paga.
              maxInstallments: MAX_PARCELAS_SEM_JUROS,
            },
            visual: {
              // 'flat' + customVariables na identidade Sixxis (tiffany #3cbfb3,
              // cantos arredondados como o rounded-xl/2xl da loja, fundos claros).
              // Só estética — métodos/parcelas seguem inalterados.
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
          onSubmit={({ formData }: { formData: BricksFormData }) =>
            // O Brick só libera o botão/formulário pra uma nova tentativa se
            // esta Promise for REJEITADA numa falha — resolver sempre (mesmo
            // em recusa) trava o cliente no mesmo cartão pra sempre, mesmo
            // trocando os dados. Documentado pela própria MP:
            // https://github.com/mercadopago/sdk-react/discussions/137
            new Promise<void>((resolve, reject) => {
              ;(async () => {
                setErro(null)
                setCarregando(true)
                try {
                  const pmId = formData.payment_method_id ?? ''
                  const isPix = pmId === 'pix'
                  const isCard = !isPix && Boolean(formData.token) && Boolean(pmId)
                  // Débito: payment_method_id do MP começa com "deb" (debvisa, debmaster, debelo…).
                  const isDebit = isCard && /^deb|debit/i.test(pmId)
                  const metodoCartao = isDebit ? ('debit_card' as const) : ('credit_card' as const)

                  if (onMetodoSelecionado) {
                    onMetodoSelecionado(isPix ? 'pix' : isCard ? metodoCartao : (pmId || 'unknown'))
                  }

                  const deviceId = capturarDeviceIdMp()

                  const body = isPix
                    ? {
                        pedidoId,
                        metodo: 'pix' as const,
                        payerEmail: formData.payer?.email ?? payerEmail,
                        payerNome,
                        payerCpf:
                          formData.payer?.identification?.number ?? payerCpf,
                        deviceId,
                      }
                    : isCard
                      ? {
                          pedidoId,
                          metodo: metodoCartao,
                          cardToken: formData.token,
                          parcelas: formData.installments ?? 1,
                          issuerId: formData.issuer_id,
                          paymentMethodId: formData.payment_method_id,
                          payerEmail: formData.payer?.email ?? payerEmail,
                          payerNome,
                          payerCpf:
                            formData.payer?.identification?.number ?? payerCpf,
                          deviceId,
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
                    resolve()
                  } else if (data.status === 'approved') {
                    onSucesso()
                    resolve()
                  } else if (data.status === 'in_process' || data.status === 'pending') {
                    setErro(
                      'Pagamento em análise. Você receberá um e-mail assim que for aprovado, ou pode tentar outro método agora.',
                    )
                    reject(new Error(data.status))
                  } else if (data.status === 'rejected') {
                    setErro(
                      'Pagamento recusado pela operadora do cartão. Isso costuma ser uma avaliação de segurança do banco/operadora — não é um erro nos dados digitados. Tente novamente em alguns minutos, use outro cartão ou pague com Pix.',
                    )
                    reject(new Error('rejected'))
                  } else {
                    setErro('Pagamento em processamento. Aguarde a confirmação.')
                    reject(new Error(data.status || 'unknown'))
                  }
                } catch (e) {
                  const err = e as { message?: string }
                  setErro(err.message || 'Falha ao processar pagamento')
                  reject(e)
                } finally {
                  setCarregando(false)
                }
              })()
            })
          }
          onError={(err) => {
            console.error('[bricks:error]', err)
            setErro('Erro ao validar dados de pagamento')
          }}
        />
      </div>
    </div>
  )
}
