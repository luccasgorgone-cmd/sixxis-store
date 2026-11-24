'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCarrinho } from '@/hooks/useCarrinho'
import { MAX_PARCELAS_SEM_JUROS, valorParcela } from '@/lib/parcelamento'
import { precoPix, DESCONTO_PIX_PCT } from '@/lib/preco-pix'

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
  const precoAtVista = precoPix(precoAtual)
  const parcelamento = valorParcela(precoAtual)
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
      <p className="text-sm font-semibold text-sx-text mb-3">Selecione a variação:</p>
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
                  ? 'bg-sx-accent border-sx-accent text-[#032E28] shadow-md'
                  : semEstoque
                    ? 'border-sx-line text-sx-subtle line-through cursor-not-allowed'
                    : 'border-sx-line text-sx-text hover:border-sx-accent hover:text-sx-accent-text hover:bg-sx-accent/10'
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
          <p className="text-3xl sm:text-4xl font-extrabold text-sx-accent-text">R$ {fmt(precoAtual)}</p>
          <p className="text-sm text-sx-accent-text font-medium">
            R$ {fmt(precoAtVista)} à vista no PIX (-{DESCONTO_PIX_PCT}%)
          </p>
          <p className="text-sm text-sx-muted">
            ou {MAX_PARCELAS_SEM_JUROS}x de R$ {fmt(parcelamento)} sem juros no cartão
          </p>
        </div>
      )}

      {/* Aviso se não selecionou */}
      {!selecionada && (
        <p className="text-sm text-amber-600 font-medium mb-4">
          Selecione a variação para continuar
        </p>
      )}

      {/* SKU da variação */}
      {selecionada?.sku && (
        <p className="text-xs font-mono text-sx-subtle mb-4">SKU: {selecionada.sku}</p>
      )}

      {/* Botão adicionar */}
      {selecionada && estoqueAtual > 0 ? (
        <>
          {/* Quantidade + botão: column no mobile, row no desktop */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Seletor de quantidade */}
            <div className="flex items-center border border-sx-line rounded-xl overflow-hidden self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center hover:bg-white/10 text-sx-text font-bold transition text-lg"
              >
                −
              </button>
              <span className="px-4 font-semibold text-sm min-w-[2.5rem] text-center">{quantidade}</span>
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.min(estoqueAtual, q + 1))}
                className="w-11 h-11 flex items-center justify-center hover:bg-white/10 text-sx-text font-bold transition text-lg"
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
                  ? 'bg-green-500 text-sx-ink scale-95'
                  : 'bg-sx-accent hover:bg-sx-accent-hover text-[#032E28] hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {adicionado ? <Check size={18} /> : <ShoppingCart size={18} />}
              {adicionado ? 'Adicionado!' : 'Adicionar ao Carrinho'}
            </button>
          </div>
          <p className="text-xs text-sx-subtle mt-3">
            {estoqueAtual} {estoqueAtual === 1 ? 'unidade disponível' : 'unidades disponíveis'}
          </p>
        </>
      ) : selecionada && estoqueAtual === 0 ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-600 font-medium text-sm">Variação fora de estoque</p>
        </div>
      ) : (
        /* Não selecionou ainda — botão desabilitado, full-width no mobile */
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm bg-sx-raised text-sx-subtle cursor-not-allowed"
        >
          <ShoppingCart size={18} />
          Adicionar ao Carrinho
        </button>
      )}
    </div>
  )
}
