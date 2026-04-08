'use client'

import { useState } from 'react'
import axios from 'axios'
import { useCarrinho } from '@/hooks/useCarrinho'

interface Props {
  enderecoId:     string
  frete:          number
  cupomCodigo:    string | null
  desconto:       number
  onPedidoCriado: (pedidoId: string) => void
}

type FormaPagamento = 'pix' | 'cartao' | 'boleto'

export default function FormPagamento({ enderecoId, frete, cupomCodigo, desconto, onPedidoCriado }: Props) {
  const { itens } = useCarrinho()
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function finalizar() {
    setErro('')
    setCarregando(true)
    try {
      const { data: pedidoData } = await axios.post('/api/pedidos', {
        enderecoId,
        formaPagamento: forma,
        frete,
        itens: itens.map((i) => ({
          produtoId:    i.produtoId,
          quantidade:   i.quantidade,
          variacaoId:   i.variacaoId,
          variacaoNome: i.variacaoNome,
        })),
        cupomCodigo: cupomCodigo ?? undefined,
        desconto:    desconto ?? 0,
      })

      if (forma !== 'cartao') {
        const { data: pagData } = await axios.post('/api/pagamento', {
          pedidoId: pedidoData.pedido.id,
        })
        if (pagData.initPoint) {
          window.location.href = pagData.initPoint
          return
        }
      }

      onPedidoCriado(pedidoData.pedido.id)
    } catch {
      setErro('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const formas: { value: FormaPagamento; label: string; descricao: string; badge?: string }[] = [
    { value: 'pix',    label: 'PIX',             descricao: 'Aprovação instantânea', badge: '-3%' },
    { value: 'cartao', label: 'Cartão de Crédito', descricao: 'Em até 12x' },
    { value: 'boleto', label: 'Boleto Bancário',  descricao: 'Vencimento em 3 dias úteis' },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="section-title mb-6 text-xl">Forma de Pagamento</h2>
      <div className="space-y-3">
        {formas.map(({ value, label, descricao, badge }) => (
          <label
            key={value}
            className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition ${
              forma === value
                ? 'border-[#3cbfb3] bg-[#e8f8f7]'
                : 'border-gray-200 hover:border-[#3cbfb3] hover:bg-[#f8f9fa]'
            }`}
          >
            <input
              type="radio"
              name="pagamento"
              value={value}
              checked={forma === value}
              onChange={() => setForma(value)}
              className="accent-[#3cbfb3]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{label}</p>
                {badge && (
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{descricao}</p>
            </div>
          </label>
        ))}
      </div>

      {erro && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600">
          {erro}
        </div>
      )}

      <button
        onClick={finalizar}
        disabled={carregando}
        className="w-full btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {carregando ? 'Processando...' : 'Finalizar Pedido'}
      </button>
    </div>
  )
}
