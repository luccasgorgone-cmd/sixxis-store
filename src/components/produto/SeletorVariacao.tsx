'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCarrinho } from '@/hooks/useCarrinho'

interface Variacao {
  id:      string
  nome:    string
  sku:     string
  preco:   number | null
  estoque: number
  ativo:   boolean
}

interface Produto {
  id:               string
  nome:             string
  preco:            number
  precoPromocional: number | null
  estoque:          number
}

interface Props {
  produto:   Produto
  variacoes: Variacao[]
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function SeletorVariacao({ produto, variacoes }: Props) {
  const { adicionarItem } = useCarrinho()
  const [selecionada, setSelecionada] = useState<Variacao | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [adicionado, setAdicionado] = useState(false)

  const precoBase    = produto.precoPromocional ?? produto.preco
  const precoAtual   = selecionada?.preco ?? precoBase
  const precoAtVista = precoAtual * 0.97
  const parcelamento = precoAtual / 12
  const estoqueAtual = selecionada?.estoque ?? 0

  const variacoesAtivas = variacoes.filter((v) => v.ativo)

  function handleSelecionar(v: Variacao) {
    setSelecionada(v)
    setQuantidade(1)
  }

  function handleAdicionar() {
    if (!selecionada) return
    adicionarItem({
      produtoId:    produto.id,
      nome:         produto.nome,
      preco:        precoAtual,
      quantidade,
      variacaoId:   selecionada.id,
      variacaoNome: selecionada.nome,
    })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  return (
    <div>
      {/* Seletor de variações */}
      <p className="text-sm font-semibold text-gray-700 mb-3">Selecione a variação:</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {variacoesAtivas.map((v) => {
          const semEstoque  = v.estoque === 0
          const isSelecionada = selecionada?.id === v.id
          return (
            <button
              key={v.id}
              type="button"
              disabled={semEstoque}
              onClick={() => handleSelecionar(v)}
              className={`px-5 py-3 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                isSelecionada
                  ? 'bg-[#3cbfb3] border-[#3cbfb3] text-white shadow-md'
                  : semEstoque
                    ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:border-[#3cbfb3] hover:text-[#3cbfb3] hover:bg-[#e8f8f7]'
              }`}
            >
              {v.nome}
              {semEstoque && <span className="ml-1 text-[10px]">(esgotado)</span>}
            </button>
          )
        })}
      </div>

      {/* Preço atualizado pela variação */}
      {selecionada && (
        <div className="mb-5 space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold text-[#3cbfb3]">R$ {fmt(precoAtual)}</p>
          <p className="text-sm text-[#2a9d8f] font-medium">
            R$ {fmt(precoAtVista)} à vista no PIX (-3%)
          </p>
          <p className="text-sm text-gray-500">
            ou 12x de R$ {fmt(parcelamento)} no cartão
          </p>
        </div>
      )}

      {/* Aviso se não selecionou */}
      {!selecionada && (
        <p className="text-sm text-amber-600 font-medium mb-4">
          ⚡ Selecione a variação para continuar
        </p>
      )}

      {/* SKU da variação */}
      {selecionada?.sku && (
        <p className="text-xs font-mono text-gray-400 mb-4">SKU: {selecionada.sku}</p>
      )}

      {/* Botão adicionar */}
      {selecionada && estoqueAtual > 0 ? (
        <>
          {/* Quantidade + botão: column no mobile, row no desktop */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Seletor de quantidade */}
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 text-gray-600 font-bold transition text-lg"
              >
                −
              </button>
              <span className="px-4 font-semibold text-sm min-w-[2.5rem] text-center">{quantidade}</span>
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.min(estoqueAtual, q + 1))}
                className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 text-gray-600 font-bold transition text-lg"
              >
                +
              </button>
            </div>

            {/* Botão — full-width em mobile, auto em desktop */}
            <button
              type="button"
              onClick={handleAdicionar}
              className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 px-6 rounded-xl font-bold text-sm transition-all duration-200 ${
                adicionado
                  ? 'bg-green-500 text-white scale-95'
                  : 'bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {adicionado ? <Check size={18} /> : <ShoppingCart size={18} />}
              {adicionado ? 'Adicionado!' : 'Adicionar ao Carrinho'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {estoqueAtual} {estoqueAtual === 1 ? 'unidade disponível' : 'unidades disponíveis'}
          </p>
        </>
      ) : selecionada && estoqueAtual === 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-500 font-medium text-sm">Variação fora de estoque</p>
        </div>
      ) : (
        /* Não selecionou ainda — botão desabilitado, full-width no mobile */
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm bg-gray-200 text-gray-400 cursor-not-allowed"
        >
          <ShoppingCart size={18} />
          Adicionar ao Carrinho
        </button>
      )}
    </div>
  )
}
