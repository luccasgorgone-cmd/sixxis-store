'use client'

import { useState } from 'react'
import { ShoppingCart, Check, ShoppingBag } from 'lucide-react'
import { useCarrinho } from '@/hooks/useCarrinho'
import { useRouter } from 'next/navigation'

interface Variacao {
  id: string
  nome: string
  sku: string
  preco: number | null
  estoque: number
  ativo: boolean
}

interface Props {
  produto: {
    id: string
    nome: string
    slug: string
    sku: string | null
    preco: number
    precoPromocional: number | null
    estoque: number
    temVariacoes: boolean
  }
  variacoes: Variacao[]
  taxaJuros: number
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calcPMT(pv: number, taxa: number, n: number) {
  if (taxa === 0) return pv / n
  return pv * (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1)
}

function inferirTipoVariacao(nomes: string[]): string {
  if (!nomes.length) return 'Variação'
  const joined = nomes.join(' ')
  if (/\d+\s*v\b|bivolt/i.test(joined))                                              return 'Voltagem'
  const cores = ['preto','branco','azul','vermelho','verde','amarelo','rosa',
                 'cinza','laranja','roxo','marrom','bege','prata','dourado','grafite']
  if (cores.some(c => joined.toLowerCase().includes(c)))                             return 'Cor'
  if (/\b(pp|p|m|g{1,2}|xg|xxg|xs|s|l|xl{1,2}|xxl)\b/i.test(joined))              return 'Tamanho'
  if (/\b\d+(cm|mm|ml|l|kg|g|w|hz|gb|tb|pol)\b/i.test(joined))                     return 'Capacidade'
  return 'Variação'
}

export default function BlocoPrecoProduto({ produto, variacoes, taxaJuros }: Props) {
  const router = useRouter()
  const { adicionarItem } = useCarrinho()
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<Variacao | null>(null)
  const [adicionando, setAdicionando] = useState(false)
  const [adicionado, setAdicionado] = useState(false)

  const precoBase = produto.precoPromocional ?? produto.preco
  const precoAtual = variacaoSelecionada?.preco ?? precoBase
  const precoOriginal = produto.preco
  const desconto = precoOriginal > precoAtual
    ? Math.round(((precoOriginal - precoAtual) / precoOriginal) * 100)
    : 0
  const precoAtVista = precoAtual * 0.97
  const taxa = taxaJuros / 100
  const estoqueAtual = variacaoSelecionada
    ? variacaoSelecionada.estoque
    : produto.estoque
  const esgotado = estoqueAtual === 0
  const variacoesAtivas = variacoes.filter(v => v.ativo)

  function handleAddToCart() {
    if (produto.temVariacoes && !variacaoSelecionada) return
    setAdicionando(true)
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: precoAtual,
      quantidade: 1,
      ...(variacaoSelecionada && {
        variacaoId: variacaoSelecionada.id,
        variacaoNome: variacaoSelecionada.nome,
      }),
    })
    setAdicionado(true)
    setAdicionando(false)
    setTimeout(() => setAdicionado(false), 2500)
  }

  function handleBuyNow() {
    if (produto.temVariacoes && !variacaoSelecionada) return
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: precoAtual,
      quantidade: 1,
      ...(variacaoSelecionada && {
        variacaoId: variacaoSelecionada.id,
        variacaoNome: variacaoSelecionada.nome,
      }),
    })
    router.push(`/checkout?compra_direta=1&produto=${produto.id}`)
  }

  return (
    <div>
      {/* SKU + estoque */}
      <div className="flex items-center gap-2 mb-2">
        {produto.sku && (
          <span className="text-gray-400 text-xs font-mono">SKU: {produto.sku}</span>
        )}
        {esgotado ? (
          <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full border border-red-200">
            Esgotado
          </span>
        ) : (
          <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200">
            ✓ Em estoque
          </span>
        )}
      </div>

      {/* Variações */}
      {variacoesAtivas.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-bold text-gray-700 mb-2">{inferirTipoVariacao(variacoesAtivas.map(v => v.nome))}:</p>
          <div className="flex flex-wrap gap-2">
            {variacoesAtivas.map(v => (
              <button
                key={v.id}
                onClick={() => setVariacaoSelecionada(v)}
                disabled={v.estoque === 0}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  variacaoSelecionada?.id === v.id
                    ? 'border-[#3cbfb3] bg-[#e8f8f7] text-[#1a4f4a]'
                    : v.estoque === 0
                      ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                      : 'border-gray-200 text-gray-600 hover:border-[#3cbfb3]/50'
                }`}
              >
                {v.nome}
              </button>
            ))}
          </div>
          {produto.temVariacoes && !variacaoSelecionada && (
            <p className="text-amber-600 text-xs font-medium mt-2">Selecione a variação para continuar</p>
          )}
        </div>
      )}

      {/* Bloco de preço */}
      <div className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-100">
        {/* Preço original riscado + badge desconto */}
        {desconto > 0 && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-400 text-sm line-through">
              R$ {fmt(precoOriginal)}
            </span>
            <span className="bg-[#3cbfb3] text-white text-xs font-black px-2 py-0.5 rounded-md">
              -{desconto}%
            </span>
          </div>
        )}

        {/* Preço principal */}
        <p className="text-4xl font-black text-gray-900 leading-none mb-2">
          R$ {fmt(precoAtual)}
        </p>

        {/* PIX */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-[#3cbfb3] flex items-center justify-center shrink-0">
            <span className="text-white text-[8px] font-black">PIX</span>
          </div>
          <span className="text-[#2a9d8f] font-bold text-sm">
            R$ {fmt(precoAtVista)}
            <span className="text-gray-400 font-normal"> (3% de desconto à vista)</span>
          </span>
        </div>

        <div className="border-t border-gray-200 my-3" />

        {/* Tabela de parcelamento */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Parcelamento no Cartão
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div
              key={n}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm ${
                n === 6
                  ? 'bg-[#e8f8f7] border border-[#3cbfb3]/30'
                  : 'bg-white border border-gray-100'
              }`}
            >
              <span className={`font-bold ${n === 6 ? 'text-[#1a4f4a]' : 'text-gray-700'}`}>{n}x</span>
              <span className={`font-semibold text-xs ${n === 6 ? 'text-[#3cbfb3]' : 'text-gray-600'}`}>
                R$ {fmt(precoAtual / n)}
              </span>
              <span className="text-[10px] text-green-600 font-bold">s/ juros</span>
            </div>
          ))}
          {[7, 8, 9, 10, 11, 12].map(n => {
            const valor = calcPMT(precoAtual, taxa, n)
            return (
              <div
                key={n}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-sm bg-white border border-gray-100"
              >
                <span className="font-bold text-gray-700">{n}x</span>
                <span className="font-semibold text-xs text-gray-600">
                  R$ {fmt(valor)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={handleAddToCart}
          disabled={adicionando || esgotado || (produto.temVariacoes && !variacaoSelecionada)}
          className="flex-1 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-60 text-white font-extrabold py-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#3cbfb3]/25"
        >
          {adicionado ? <Check size={18} /> : <ShoppingCart size={18} />}
          {adicionado ? 'Adicionado!' : adicionando ? 'Adicionando...' : 'Adicionar ao Carrinho'}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={esgotado || (produto.temVariacoes && !variacaoSelecionada)}
          className="px-6 py-4 rounded-2xl border-2 border-[#3cbfb3] text-[#3cbfb3] font-bold hover:bg-[#e8f8f7] disabled:opacity-60 transition text-sm flex items-center gap-2"
        >
          <ShoppingBag size={16} />
          Comprar Agora
        </button>
      </div>

      {/* Selos de confiança — 6 itens */}
      <div className="mt-5 pt-5 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', titulo: '12 meses de garantia', desc: 'Garantia real e documentada' },
            { icon: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01', titulo: 'Entrega para todo o Brasil', desc: 'Grátis acima de R$ 500' },
            { icon: 'M1 4v6h6M3.51 15a9 9 0 1 0 .49-4.95', titulo: 'Troca em 7 dias', desc: 'Sem burocracia' },
            { icon: 'M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zM2 10h20', titulo: '6x sem juros', desc: 'No cartão de crédito' },
            { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4', titulo: 'Produto 100% original', desc: '30 anos de tradição Sixxis' },
            { icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16z', titulo: 'Suporte especializado', desc: 'Seg–Sex 8h às 18h' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-[#3cbfb3]/30 hover:bg-[#f0fffe] transition-all duration-200">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#e8f8f7' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3cbfb3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-gray-800 leading-tight">{s.titulo}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
