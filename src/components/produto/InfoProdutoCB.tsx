'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, ShoppingBag, ChevronDown, Truck, Check, Star, Share2, MessageCircle, ShieldCheck, RefreshCw, Award } from 'lucide-react'
import { useCarrinho } from '@/hooks/useCarrinho'

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
  mediaAvaliacoes: number
  totalAvaliacoes: number
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
  if (/\d+\s*v\b|bivolt/i.test(joined)) return 'Voltagem'
  const cores = ['preto','branco','azul','vermelho','verde','amarelo','rosa','cinza','laranja','roxo','marrom','bege','prata','dourado','grafite']
  if (cores.some(c => joined.toLowerCase().includes(c))) return 'Cor'
  if (/\b(pp|p|m|g{1,2}|xg|xxg|xs|s|l|xl{1,2}|xxl)\b/i.test(joined)) return 'Tamanho'
  if (/\b\d+(cm|mm|ml|l|kg|g|w|hz|gb|tb|pol)\b/i.test(joined)) return 'Capacidade'
  return 'Variação'
}

export default function InfoProdutoCB({ produto, variacoes, taxaJuros, mediaAvaliacoes, totalAvaliacoes }: Props) {
  const router = useRouter()
  const { adicionarItem } = useCarrinho()
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<Variacao | null>(null)
  const [adicionado, setAdicionado] = useState(false)
  const [parcelasAberto, setParcelasAberto] = useState(false)
  const [cepInput, setCepInput] = useState('')
  const [freteResult, setFreteResult] = useState<{ opcoes?: { tipo: string; preco: number; prazo?: string }[] } | null>(null)
  const [calculandoFrete, setCalculandoFrete] = useState(false)

  const precoBase = produto.precoPromocional ?? produto.preco
  const precoAtual = variacaoSelecionada?.preco ?? precoBase
  const precoOriginal = produto.preco
  const desconto = precoOriginal > precoAtual
    ? Math.round(((precoOriginal - precoAtual) / precoOriginal) * 100)
    : 0
  const precoAtVista = precoAtual * 0.97
  const taxa = taxaJuros / 100
  const estoqueAtual = variacaoSelecionada ? variacaoSelecionada.estoque : produto.estoque
  const esgotado = estoqueAtual === 0
  const variacoesAtivas = variacoes.filter(v => v.ativo)

  function handleAddToCart() {
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
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2500)
  }

  function handleComprar() {
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

  async function calcularFrete() {
    if (cepInput.length < 8) return
    setCalculandoFrete(true)
    // Simulação de frete — integração real via API de frete
    await new Promise(r => setTimeout(r, 600))
    setFreteResult({
      opcoes: [
        { tipo: 'PAC', preco: produto.preco >= 500 ? 0 : 29.90, prazo: '5 a 8 dias úteis' },
        { tipo: 'SEDEX', preco: 49.90, prazo: '1 a 3 dias úteis' },
      ],
    })
    setCalculandoFrete(false)
  }

  return (
    <div>
      {/* Vendido por */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
          Vendido e entregue por <strong>Sixxis</strong>
        </span>
      </div>

      {/* Título */}
      <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mb-2">
        {produto.nome}
      </h1>

      {/* SKU */}
      {produto.sku && (
        <p className="text-xs text-gray-400 mb-3">(Cód. Item {produto.sku})</p>
      )}

      {/* Avaliações */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
        {totalAvaliacoes > 0 ? (
          <>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={14}
                  className={s <= Math.round(mediaAvaliacoes) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200 fill-gray-200'} />
              ))}
            </div>
            <span className="text-xs leading-none font-bold text-gray-800">{mediaAvaliacoes.toFixed(1)}</span>
            <a href="#avaliacoes" className="text-xs leading-none text-[#0066cc] hover:underline">
              {totalAvaliacoes} avaliação{totalAvaliacoes !== 1 ? 'ões' : ''}
            </a>
          </>
        ) : (
          <span className="text-xs leading-none text-gray-400">Seja o primeiro a avaliar</span>
        )}
        <div className="w-px h-3.5 bg-gray-200 mx-1 shrink-0" />
        <a href={`https://wa.me/5518997474701?text=Tenho%20uma%20dúvida%20sobre%20${encodeURIComponent(produto.nome)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs leading-none text-[#0066cc] hover:underline">
          <MessageCircle size={12} />
          Tire sua dúvida
        </a>
      </div>

      {/* Badge desconto */}
      {desconto > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-[#16a34a] text-white text-xs font-black px-2.5 py-1 rounded-lg">
            Baixou {desconto}%
          </span>
        </div>
      )}

      {/* Bloco de preços */}
      <div className="mb-5">
        {precoOriginal > precoAtual && (
          <p className="text-sm text-gray-400 line-through mb-0.5">
            de R$ {fmt(precoOriginal)}
          </p>
        )}

        <div className="mb-2">
          <span className="text-gray-600 text-sm">por </span>
          <span className="text-3xl font-black text-gray-900">R$ {fmt(precoAtual)}</span>
          <span className="text-sm text-gray-600 ml-2">
            em até <strong>6x</strong> de{' '}
            <strong>R$ {fmt(precoAtual / 6)}</strong> sem juros no cartão
          </span>
        </div>

        {/* PIX */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-[#f0fffe] border border-[#3cbfb3]/20 rounded-xl">
          <div className="w-8 h-8 bg-[#3cbfb3] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-black text-[9px]">PIX</span>
          </div>
          <div>
            <span className="text-gray-500 text-sm">por </span>
            <span className="text-lg font-black text-gray-900">R$ {fmt(precoAtVista)}</span>
            <span className="text-[#3cbfb3] text-sm font-semibold ml-1">com 3% de desconto</span>
          </div>
        </div>

        {/* Ver parcelamento */}
        <button
          onClick={() => setParcelasAberto(a => !a)}
          className="text-[#0066cc] text-sm hover:underline mb-4 flex items-center gap-1"
        >
          Ver mais opções de pagamento
          <ChevronDown size={14} className={`transition-transform ${parcelasAberto ? 'rotate-180' : ''}`} />
        </button>

        {parcelasAberto && (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 mb-4">
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm ${
                  n === 6 ? 'bg-[#e8f8f7] border border-[#3cbfb3]/30' : 'bg-white border border-gray-100'
                }`}>
                  <span className="font-bold text-gray-700">{n}x</span>
                  <span className={`font-bold ${n === 6 ? 'text-[#3cbfb3]' : 'text-gray-600'}`}>
                    R$ {fmt(precoAtual / n)}
                  </span>
                  <span className="text-[10px] text-green-600 font-bold">sem juros</span>
                </div>
              ))}
              {[7,8,9,10,11,12].map(n => {
                const valor = calcPMT(precoAtual, taxa, n)
                return (
                  <div key={n} className="flex items-center justify-between px-3 py-2 rounded-xl text-sm bg-white border border-gray-100">
                    <span className="font-bold text-gray-700">{n}x</span>
                    <span className="font-bold text-gray-600">R$ {fmt(valor)}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-gray-400 text-center col-span-2">
              * Parcelas de 7x a 12x sujeitas a juros. Consulte no checkout.
            </p>
          </div>
        )}
      </div>

      {/* Variações */}
      {variacoesAtivas.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-bold text-gray-700 mb-2">
            {inferirTipoVariacao(variacoesAtivas.map(v => v.nome))}:
          </p>
          <div className="flex flex-wrap gap-2">
            {variacoesAtivas.map(v => (
              <button
                key={v.id}
                onClick={() => setVariacaoSelecionada(v)}
                disabled={v.estoque === 0}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${
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
            <p className="text-amber-600 text-xs font-medium mt-2">⚡ Selecione a opção para continuar</p>
          )}
        </div>
      )}

      {/* Estoque */}
      <div className="mb-4">
        {esgotado ? (
          <span className="text-red-600 text-sm font-bold">✗ Produto esgotado</span>
        ) : (
          <span className="text-green-700 text-sm font-semibold">✓ Em estoque</span>
        )}
      </div>

      {/* Botões */}
      <div className="space-y-3 mb-6">
        <button
          onClick={handleComprar}
          disabled={esgotado || (produto.temVariacoes && !variacaoSelecionada)}
          className="w-full bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-60 text-white font-extrabold text-base py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-xl shadow-[#3cbfb3]/25 hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
        >
          <ShoppingBag size={20} />
          Comprar
        </button>
        <button
          onClick={handleAddToCart}
          disabled={esgotado || (produto.temVariacoes && !variacaoSelecionada)}
          className="w-full border-2 border-[#3cbfb3] text-[#3cbfb3] font-extrabold text-base py-3.5 rounded-2xl hover:bg-[#e8f8f7] disabled:opacity-60 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5"
        >
          {adicionado ? <Check size={18} /> : <ShoppingCart size={18} />}
          {adicionado ? 'Adicionado ao Carrinho!' : 'Adicionar ao Carrinho'}
        </button>
      </div>

      {/* Trust cards */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { icon: ShieldCheck, label: 'Compra Segura',    sub: 'Dados criptografados', color: 'text-[#3cbfb3]',  bg: 'bg-[#e8f8f7]'  },
          { icon: Truck,       label: 'Frete Grátis',     sub: 'Acima de R$ 500',      color: 'text-blue-500',   bg: 'bg-blue-50'    },
          { icon: RefreshCw,   label: 'Troca Fácil',      sub: 'Até 7 dias úteis',     color: 'text-amber-500',  bg: 'bg-amber-50'   },
          { icon: Award,       label: 'Produto Original', sub: 'Garantia Sixxis',      color: 'text-purple-500', bg: 'bg-purple-50'  },
        ].map(({ icon: Icon, label, sub, color, bg }) => (
          <div key={label}
            className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:border-gray-200 hover:shadow-sm transition-all">
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
              <Icon size={15} className={color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-800 leading-tight truncate">{label}</p>
              <p className="text-[10px] text-gray-500 leading-tight truncate mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Frete */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4">
        <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
          <Truck size={15} className="text-[#3cbfb3]" />
          Calcular frete e prazo de entrega
        </p>
        <div className="flex gap-2">
          <input
            value={cepInput}
            onChange={e => setCepInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="00000-000"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
          />
          <button
            onClick={calcularFrete}
            disabled={calculandoFrete || cepInput.length < 8}
            className="bg-[#0f2e2b] hover:bg-[#1a4f4a] disabled:opacity-60 text-white font-bold px-4 py-2 rounded-xl text-sm transition"
          >
            {calculandoFrete ? '...' : 'Consultar'}
          </button>
        </div>
        {freteResult && freteResult.opcoes && (
          <div className="mt-3 space-y-1">
            {freteResult.opcoes.map(op => (
              <div key={op.tipo} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-1.5">
                  <Truck size={12} className="text-[#3cbfb3]" />
                  <span className="text-gray-700 font-semibold">{op.tipo}</span>
                </div>
                <span className="font-bold text-gray-900">
                  {op.preco === 0 ? (
                    <span className="text-green-600">Grátis</span>
                  ) : (
                    `R$ ${op.preco.toFixed(2).replace('.', ',')}`
                  )}
                  {op.prazo && <span className="text-gray-400 font-normal ml-1">• {op.prazo}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compartilhar */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`Olha esse produto na Sixxis Store: ${produto.nome} — https://sixxisstore.com.br/produtos/${produto.slug}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-[#25D366] border border-gray-200 hover:border-[#25D366] rounded-lg px-3 py-2 transition-colors"
      >
        <Share2 size={13} />
        Compartilhar via WhatsApp
      </a>
    </div>
  )
}
