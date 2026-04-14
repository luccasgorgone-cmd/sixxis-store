'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCarrinho } from '@/hooks/useCarrinho'
import FormEndereco from '@/components/checkout/FormEndereco'
import FormPagamento from '@/components/checkout/FormPagamento'
import ResumoPedido from '@/components/checkout/ResumoPedido'
import CampoCupom from '@/components/checkout/CampoCupom'
import Link from 'next/link'
import { CheckCircle, Zap } from 'lucide-react'

type Etapa = 'endereco' | 'pagamento' | 'confirmacao'

const etapaLabels: Record<Etapa, string> = {
  endereco:    'Endereço',
  pagamento:   'Pagamento',
  confirmacao: 'Confirmação',
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const compraDireta = searchParams.get('compra_direta') === '1'

  const { itens, total, limparCarrinho } = useCarrinho()
  const [etapa, setEtapa] = useState<Etapa>('endereco')
  const [enderecoId, setEnderecoId] = useState<string | null>(null)
  const [frete, setFrete] = useState(0)
  const [pedidoId, setPedidoId] = useState<string | null>(null)
  const [cupomCodigo, setCupomCodigo] = useState<string | null>(null)
  const [desconto, setDesconto] = useState(0)

  // Quando compra_direta=1, o item foi adicionado antes do redirect.
  // Toleramos carrinho vazio durante a hidratação (localStorage ainda carregando).
  if (itens.length === 0 && etapa !== 'confirmacao' && !compraDireta) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-gray-500 mb-4">Adicione produtos ao carrinho antes de finalizar.</p>
        <Link href="/produtos" className="btn-primary inline-flex">Ver Produtos</Link>
      </main>
    )
  }

  const etapas: Etapa[] = ['endereco', 'pagamento', 'confirmacao']
  const totalFinal = Math.max(0, total + frete - desconto)

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] tracking-tight">
          {compraDireta ? 'Finalizar Compra' : 'Checkout'}
        </h1>
        {compraDireta && (
          <span className="inline-flex items-center gap-1.5 bg-[#e8f8f7] text-[#3cbfb3] text-xs font-bold px-3 py-1.5 rounded-full border border-[#3cbfb3]/30">
            <Zap size={12} />
            Compra Rápida
          </span>
        )}
      </div>

      {/* Progresso */}
      <div className="flex items-center gap-2 mb-8 sm:mb-10">
        {etapas.map((e, i) => (
          <div key={e} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  etapa === e
                    ? 'bg-[#3cbfb3] text-white'
                    : etapas.indexOf(etapa) > i
                      ? 'bg-[#2a9d8f] text-white'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-sm font-medium capitalize hidden sm:inline ${
                etapa === e ? 'text-[#3cbfb3]' : 'text-gray-400'
              }`}>
                {etapaLabels[e]}
              </span>
            </div>
            {i < 2 && (
              <div className={`w-8 sm:w-16 h-0.5 ${
                etapas.indexOf(etapa) > i ? 'bg-[#3cbfb3]' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Layout: flex-col em mobile, grid em md */}
      <div className="flex flex-col md:grid md:grid-cols-3 gap-6 sm:gap-8">
        <div className="md:col-span-2">
          {etapa === 'endereco' && (
            <FormEndereco
              onProximo={(id, valorFrete) => {
                setEnderecoId(id)
                setFrete(valorFrete)
                setEtapa('pagamento')
              }}
            />
          )}
          {etapa === 'pagamento' && enderecoId && (
            <FormPagamento
              enderecoId={enderecoId}
              frete={frete}
              cupomCodigo={cupomCodigo}
              desconto={desconto}
              onPedidoCriado={(id) => {
                setPedidoId(id)
                limparCarrinho()
                setEtapa('confirmacao')
              }}
            />
          )}
          {etapa === 'confirmacao' && (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-[#e8f8f7] flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-[#3cbfb3]" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#0a0a0a] mb-2">Pedido realizado!</h2>
              <p className="text-gray-500 text-sm mb-1">
                Seu pedido #{pedidoId?.slice(-8).toUpperCase()} foi confirmado.
              </p>
              <p className="text-gray-400 text-xs mb-8">Você receberá atualizações por e-mail.</p>
              <Link href="/pedidos" className="btn-primary inline-flex">Ver Meus Pedidos</Link>
            </div>
          )}
        </div>

        {etapa !== 'confirmacao' && (
          <aside className="space-y-4">
            {etapa === 'pagamento' && (
              <CampoCupom
                total={total + frete}
                onAplicar={(codigo, valor) => {
                  setCupomCodigo(codigo)
                  setDesconto(valor)
                }}
                onRemover={() => {
                  setCupomCodigo(null)
                  setDesconto(0)
                }}
              />
            )}
            <ResumoPedido
              itens={itens}
              total={totalFinal}
              frete={frete}
              desconto={desconto}
              cupomCodigo={cupomCodigo}
            />
          </aside>
        )}
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-72" />
          <div className="grid grid-cols-3 gap-8 mt-8">
            <div className="col-span-2 h-64 bg-gray-100 rounded-xl" />
            <div className="h-48 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </main>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
