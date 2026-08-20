'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, CreditCard, QrCode, ArrowLeft } from 'lucide-react'
import PixPainel from './PixPainel'
import CartaoBrick, { type CartaoTokenizado } from './CartaoBrick'

function moeda(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Props {
  pedidoId: string
  valor: number // BRL, total do pedido
  payerEmail: string
  payerCpf?: string
  onSucesso: () => void
  onMetodoSelecionado?: (metodo: string) => void
  onVoltar: () => void
}

type Modo = 'escolha' | 'dois_cartoes' | 'pix_cartao'

export default function CheckoutMultiMetodo({
  pedidoId,
  valor,
  payerEmail,
  payerCpf,
  onSucesso,
  onMetodoSelecionado,
  onVoltar,
}: Props) {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [erroConfig, setErroConfig] = useState<string | null>(null)
  const [modo, setModo] = useState<Modo>('escolha')

  useEffect(() => {
    let cancelled = false
    fetch('/api/checkout/config')
      .then((r) => r.json())
      .then((d: { publicKey?: string; enabled?: boolean }) => {
        if (cancelled) return
        if (!d.enabled || !d.publicKey) {
          setErroConfig('Pagamentos temporariamente indisponíveis. Tente novamente em alguns minutos.')
          return
        }
        setPublicKey(d.publicKey)
      })
      .catch(() => {
        if (!cancelled) setErroConfig('Falha ao iniciar pagamento')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (erroConfig && !publicKey) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex gap-3 items-start">
        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm font-semibold text-red-700">{erroConfig}</p>
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

  const voltarEscolha = () => setModo('escolha')

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={modo === 'escolha' ? onVoltar : voltarEscolha}
        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
      >
        <ArrowLeft size={12} />
        {modo === 'escolha' ? 'Voltar pro pagamento normal' : 'Escolher outra divisão'}
      </button>

      {modo === 'escolha' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-[#0f2e2b]">Como você quer dividir o pagamento?</p>
          <button
            type="button"
            onClick={() => {
              onMetodoSelecionado?.('multi_dois_cartoes')
              setModo('dois_cartoes')
            }}
            className="w-full flex items-center gap-3 border border-gray-200 hover:border-[#3cbfb3] rounded-xl px-4 py-3 text-left transition"
          >
            <CreditCard size={18} className="text-[#3cbfb3] shrink-0" />
            <span>
              <span className="block text-sm font-semibold text-[#0f2e2b]">2 cartões</span>
              <span className="block text-xs text-gray-500">Divida o total entre 2 cartões de crédito ou débito</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onMetodoSelecionado?.('multi_pix_cartao')
              setModo('pix_cartao')
            }}
            className="w-full flex items-center gap-3 border border-gray-200 hover:border-[#3cbfb3] rounded-xl px-4 py-3 text-left transition"
          >
            <QrCode size={18} className="text-[#3cbfb3] shrink-0" />
            <span>
              <span className="block text-sm font-semibold text-[#0f2e2b]">Pix + cartão</span>
              <span className="block text-xs text-gray-500">Pague parte no Pix e o restante no cartão</span>
            </span>
          </button>
        </div>
      )}

      {modo === 'dois_cartoes' && (
        <FluxoDoisCartoes
          pedidoId={pedidoId}
          publicKey={publicKey}
          valor={valor}
          payerEmail={payerEmail}
          payerCpf={payerCpf}
          onSucesso={onSucesso}
        />
      )}

      {modo === 'pix_cartao' && (
        <FluxoPixMaisCartao
          pedidoId={pedidoId}
          publicKey={publicKey}
          valor={valor}
          payerEmail={payerEmail}
          payerCpf={payerCpf}
          onSucesso={onSucesso}
        />
      )}
    </div>
  )
}

// ─── Fluxo: 2 cartões ────────────────────────────────────────────────────────

function FluxoDoisCartoes({
  pedidoId,
  publicKey,
  valor,
  payerEmail,
  payerCpf,
  onSucesso,
}: {
  pedidoId: string
  publicKey: string
  valor: number
  payerEmail: string
  payerCpf?: string
  onSucesso: () => void
}) {
  const totalCentavos = Math.round(valor * 100)
  const [subEtapa, setSubEtapa] = useState<'valor' | 'cartaoA' | 'cartaoB' | 'enviando'>('valor')
  const [valorAInput, setValorAInput] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [cartaoA, setCartaoA] = useState<CartaoTokenizado | null>(null)

  const valorACentavos = Math.round((Number(valorAInput.replace(',', '.')) || 0) * 100)
  const valorBCentavos = totalCentavos - valorACentavos
  const splitValido = valorACentavos > 0 && valorBCentavos > 0

  async function enviar(cartaoB: CartaoTokenizado) {
    if (!cartaoA) return
    setSubEtapa('enviando')
    setErro(null)
    try {
      const resp = await fetch('/api/checkout/multi-metodo/dois-cartoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pedidoId,
          payerEmail,
          cartaoA: { token: cartaoA.token, bandeiraId: cartaoA.bandeiraId, parcelas: cartaoA.parcelas, valorCentavos: valorACentavos },
          cartaoB: { token: cartaoB.token, bandeiraId: cartaoB.bandeiraId, parcelas: cartaoB.parcelas, valorCentavos: valorBCentavos },
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Pagamento não aprovado')
      onSucesso()
    } catch (e) {
      const err = e as { message?: string }
      setErro(err.message || 'Falha ao processar os 2 cartões')
      setSubEtapa('cartaoB')
    }
  }

  if (subEtapa === 'valor') {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <p className="text-sm font-semibold text-[#0f2e2b]">Quanto vai no 1º cartão?</p>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Valor no Cartão 1 (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={valorAInput}
            onChange={(e) => setValorAInput(e.target.value)}
            placeholder="0,00"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
        <p className="text-xs text-gray-500">
          Cartão 2 fica com <strong className="text-[#0f2e2b]">R$ {moeda(Math.max(valorBCentavos, 0) / 100)}</strong> — total R$ {moeda(valor)}
        </p>
        {!splitValido && valorAInput !== '' && (
          <p className="text-xs text-red-600">O valor do Cartão 1 precisa ser maior que 0 e menor que o total.</p>
        )}
        <button
          type="button"
          disabled={!splitValido}
          onClick={() => setSubEtapa('cartaoA')}
          className="w-full bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition"
        >
          Continuar
        </button>
      </div>
    )
  }

  if (subEtapa === 'cartaoA') {
    return (
      <CartaoBrick
        publicKey={publicKey}
        valor={valorACentavos / 100}
        payerEmail={payerEmail}
        payerCpf={payerCpf}
        label={`Cartão 1 de 2 — R$ ${moeda(valorACentavos / 100)}`}
        onToken={(dados) => {
          setCartaoA(dados)
          setSubEtapa('cartaoB')
        }}
      />
    )
  }

  return (
    <div className="space-y-3">
      {erro && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex gap-2 text-xs text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          {erro}
        </div>
      )}
      {subEtapa === 'enviando' ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin text-[#3cbfb3]" />
          Processando os 2 cartões...
        </div>
      ) : (
        <CartaoBrick
          publicKey={publicKey}
          valor={valorBCentavos / 100}
          payerEmail={payerEmail}
          payerCpf={payerCpf}
          label={`Cartão 2 de 2 — R$ ${moeda(valorBCentavos / 100)}`}
          onToken={enviar}
        />
      )}
    </div>
  )
}

// ─── Fluxo: Pix + cartão ─────────────────────────────────────────────────────

function FluxoPixMaisCartao({
  pedidoId,
  publicKey,
  valor,
  payerEmail,
  payerCpf,
  onSucesso,
}: {
  pedidoId: string
  publicKey: string
  valor: number
  payerEmail: string
  payerCpf?: string
  onSucesso: () => void
}) {
  const totalCentavos = Math.round(valor * 100)
  const [subEtapa, setSubEtapa] = useState<
    'valor' | 'iniciando' | 'aguardando_pix' | 'cartao_restante' | 'enviando' | 'falhou'
  >('valor')
  const [valorPixInput, setValorPixInput] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [pix, setPix] = useState<{ qr: string; copy: string; expiraEm: string | null } | null>(null)
  const [valorRestanteCentavos, setValorRestanteCentavos] = useState(0)

  const valorPixCentavos = Math.round((Number(valorPixInput.replace(',', '.')) || 0) * 100)
  const splitValido = valorPixCentavos > 0 && valorPixCentavos < totalCentavos

  async function iniciarPix() {
    setSubEtapa('iniciando')
    setErro(null)
    try {
      const resp = await fetch('/api/checkout/multi-metodo/pix-mais-cartao/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pedidoId, payerEmail, valorPixCentavos }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Não foi possível gerar o Pix')
      setPix({ qr: data.qrCodeBase64, copy: data.qrCodeCopiaECola, expiraEm: null })
      setValorRestanteCentavos(data.valorRestanteCentavos ?? totalCentavos - valorPixCentavos)
      setSubEtapa('aguardando_pix')
    } catch (e) {
      const err = e as { message?: string }
      setErro(err.message || 'Falha ao gerar o Pix')
      setSubEtapa('valor')
    }
  }

  async function pollMultiMetodoStatus(): Promise<'approved' | 'rejected' | 'cancelled' | 'pending'> {
    const r = await fetch(`/api/checkout/multi-metodo/status/${pedidoId}`, { credentials: 'include' })
    if (!r.ok) return 'pending'
    const d = (await r.json()) as { multiMetodoStatus?: string | null }
    if (d.multiMetodoStatus === 'aguardando_pagamento_restante') return 'approved'
    if (d.multiMetodoStatus === 'falhou' || d.multiMetodoStatus === 'cancelado') return 'rejected'
    return 'pending'
  }

  async function completarComCartao(cartao: CartaoTokenizado) {
    setSubEtapa('enviando')
    setErro(null)
    try {
      const resp = await fetch('/api/checkout/multi-metodo/pix-mais-cartao/completar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pedidoId,
          cardToken: cartao.token,
          bandeiraId: cartao.bandeiraId,
          parcelas: cartao.parcelas,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Pagamento do restante não aprovado')
      onSucesso()
    } catch (e) {
      const err = e as { message?: string }
      setErro(err.message || 'Falha ao cobrar o restante no cartão')
      setSubEtapa('cartao_restante')
    }
  }

  if (subEtapa === 'valor' || subEtapa === 'iniciando') {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <p className="text-sm font-semibold text-[#0f2e2b]">Quanto você quer pagar no Pix?</p>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Valor no Pix (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={valorPixInput}
            onChange={(e) => setValorPixInput(e.target.value)}
            placeholder="0,00"
            disabled={subEtapa === 'iniciando'}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
        <p className="text-xs text-gray-500">
          Restante no cartão: <strong className="text-[#0f2e2b]">R$ {moeda(Math.max(totalCentavos - valorPixCentavos, 0) / 100)}</strong> — total R$ {moeda(valor)}
        </p>
        {!splitValido && valorPixInput !== '' && (
          <p className="text-xs text-red-600">O valor do Pix precisa ser maior que 0 e menor que o total.</p>
        )}
        {erro && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex gap-2 text-xs text-red-600">
            <AlertCircle size={14} className="shrink-0" />
            {erro}
          </div>
        )}
        <button
          type="button"
          disabled={!splitValido || subEtapa === 'iniciando'}
          onClick={iniciarPix}
          className="w-full bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
        >
          {subEtapa === 'iniciando' && <Loader2 size={14} className="animate-spin" />}
          Gerar Pix
        </button>
      </div>
    )
  }

  if (subEtapa === 'aguardando_pix' && pix) {
    return (
      <PixPainel
        qrBase64={pix.qr}
        copiaECola={pix.copy}
        pgtoId={pedidoId}
        expiraEm={pix.expiraEm}
        pollStatus={pollMultiMetodoStatus}
        onPago={() => setSubEtapa('cartao_restante')}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-[#e8f8f7] border border-[#3cbfb3]/20 rounded-xl px-4 py-3 text-xs text-gray-600">
        Pix confirmado! Falta cobrar <strong className="text-[#0f2e2b]">R$ {moeda(valorRestanteCentavos / 100)}</strong> no cartão.
      </div>
      {erro && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex gap-2 text-xs text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          {erro}
        </div>
      )}
      {subEtapa === 'enviando' ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin text-[#3cbfb3]" />
          Cobrando o cartão...
        </div>
      ) : (
        <CartaoBrick
          publicKey={publicKey}
          valor={valorRestanteCentavos / 100}
          payerEmail={payerEmail}
          payerCpf={payerCpf}
          label={`Restante — R$ ${moeda(valorRestanteCentavos / 100)}`}
          onToken={completarComCartao}
        />
      )}
    </div>
  )
}
