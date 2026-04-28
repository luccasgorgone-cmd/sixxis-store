'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldOff, Star, Info, Loader2 } from 'lucide-react'

interface ItemPedido {
  produtoId: string
  nome: string
  imagem?: string
  quantidade: number
}

interface ProdutoComGarantia {
  produtoId: string
  nome: string
  imagem?: string
  garantiaFabricaMeses: number
  preco12: number | null
  preco24: number | null
}

export type SelecaoGarantia = Record<string, 0 | 12 | 24>

interface Props {
  itens: ItemPedido[]
  /** Map produtoId -> meses adicionais escolhidos. Default 0 (sem). */
  selecao: SelecaoGarantia
  onChange: (s: SelecaoGarantia) => void
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

export default function GarantiaEstendidaStep({ itens, selecao, onChange }: Props) {
  const [produtos, setProdutos] = useState<ProdutoComGarantia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (itens.length === 0) { setProdutos([]); setLoading(false); return }
    setLoading(true)
    const ids = [...new Set(itens.map((i) => i.produtoId))].join(',')
    fetch(`/api/produtos/garantia-info?ids=${ids}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        // map preserva metadados visuais do item (nome com variação, imagem)
        const itensMap = new Map(itens.map((i) => [i.produtoId, i]))
        const lista: ProdutoComGarantia[] = (d.produtos ?? []).map((p: {
          id: string
          garantiaFabricaMeses: number
          garantiaEstendida12Preco: number | string | null
          garantiaEstendida24Preco: number | string | null
        }) => ({
          produtoId: p.id,
          nome: itensMap.get(p.id)?.nome ?? '',
          imagem: itensMap.get(p.id)?.imagem,
          garantiaFabricaMeses: p.garantiaFabricaMeses ?? 12,
          preco12: p.garantiaEstendida12Preco != null ? Number(p.garantiaEstendida12Preco) : null,
          preco24: p.garantiaEstendida24Preco != null ? Number(p.garantiaEstendida24Preco) : null,
        }))
        setProdutos(lista)
      })
      .finally(() => setLoading(false))
  }, [itens])

  // Caso nenhum produto tenha garantia configurada, este step não deve nem renderizar
  // — o componente pai detecta isso pela prop `temGarantiaDisponivel` que já indica.
  const elegiveis = produtos.filter((p) => p.preco12 != null || p.preco24 != null)

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <Loader2 size={20} className="animate-spin text-[#3cbfb3] mx-auto" />
        <p className="text-sm text-gray-400 mt-2">Carregando opções de garantia…</p>
      </div>
    )
  }

  if (elegiveis.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-sm text-gray-500">
        Nenhum dos produtos do seu pedido oferece garantia estendida no momento.
        Pulando para o pagamento…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#f0fffe] border border-[#3cbfb3]/30 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="text-[#3cbfb3] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-black text-gray-900">Proteja seu produto por mais tempo</h3>
            <p className="text-xs text-gray-600 mt-1">
              A garantia de fábrica cobre os primeiros meses. Que tal estender essa proteção
              contra defeitos por mais tempo? A garantia estendida começa quando a de fábrica termina.
            </p>
          </div>
        </div>
      </div>

      {elegiveis.map((p) => {
        const mesesEscolhidos = selecao[p.produtoId] ?? 0
        return (
          <div key={p.produtoId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                {p.imagem ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imagem} alt={p.nome} className="w-full h-full object-contain p-1" />
                ) : (
                  <ShieldCheck size={20} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{p.nome}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Garantia de fábrica: {p.garantiaFabricaMeses} meses
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CardOpcao
                titulo="Sem garantia adicional"
                subtitulo={`Apenas ${p.garantiaFabricaMeses} meses de cobertura`}
                preco={0}
                meses={p.garantiaFabricaMeses}
                ativo={mesesEscolhidos === 0}
                icone={<ShieldOff size={20} className="text-gray-400" />}
                onClick={() => onChange({ ...selecao, [p.produtoId]: 0 })}
              />
              {p.preco12 != null && (
                <CardOpcao
                  titulo="+12 meses extra"
                  subtitulo={`Total: ${p.garantiaFabricaMeses + 12} meses`}
                  preco={p.preco12}
                  meses={p.garantiaFabricaMeses + 12}
                  popular
                  ativo={mesesEscolhidos === 12}
                  icone={<ShieldCheck size={20} className="text-[#3cbfb3]" />}
                  onClick={() => onChange({ ...selecao, [p.produtoId]: 12 })}
                />
              )}
              {p.preco24 != null && (
                <CardOpcao
                  titulo="+24 meses extra"
                  subtitulo={`Total: ${p.garantiaFabricaMeses + 24} meses`}
                  preco={p.preco24}
                  meses={p.garantiaFabricaMeses + 24}
                  ativo={mesesEscolhidos === 24}
                  icone={<ShieldCheck size={20} className="text-[#0f2e2b]" />}
                  onClick={() => onChange({ ...selecao, [p.produtoId]: 24 })}
                />
              )}
            </div>
          </div>
        )
      })}

      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm text-gray-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-gray-900">
          <Info size={14} /> Como funciona
        </div>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li>A garantia estendida começa após o vencimento da garantia de fábrica.</li>
          <li>Cobre defeitos de fabricação, peças e mão de obra.</li>
          <li>Acionamento via WhatsApp (18) 99747-4701.</li>
          <li>A Sixxis se responsabiliza pelo reparo ou substituição.</li>
          <li>Vinculada ao pedido e CPF do comprador.</li>
        </ul>
      </div>
    </div>
  )
}

function CardOpcao({
  titulo, subtitulo, preco, ativo, popular, icone, onClick,
}: {
  titulo: string
  subtitulo: string
  preco: number
  meses: number
  ativo: boolean
  popular?: boolean
  icone: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left rounded-2xl border-2 p-4 transition-all ${
        ativo
          ? 'border-[#3cbfb3] bg-[#e8f8f7] shadow-md'
          : 'border-gray-200 hover:border-[#3cbfb3]/50 bg-white'
      }`}
    >
      {popular && (
        <span className="absolute -top-2 left-3 inline-flex items-center gap-0.5 bg-[#3cbfb3] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
          <Star size={10} className="fill-white" /> Popular
        </span>
      )}
      <div className="flex items-center justify-between mb-2">
        {icone}
        {ativo && (
          <span className="text-[10px] uppercase font-black text-[#1a4f4a] bg-white px-2 py-0.5 rounded-full">
            Selecionado
          </span>
        )}
      </div>
      <p className="text-sm font-black text-gray-900 leading-snug">{titulo}</p>
      <p className="text-xs text-gray-500 mt-0.5">{subtitulo}</p>
      <p className="text-lg font-black text-gray-900 mt-3">
        {preco === 0 ? 'R$ 0' : `R$ ${preco.toFixed(2).replace('.', ',')}`}
      </p>
      {preco > 0 && (
        <p className="text-[10px] text-gray-400 mt-0.5">ou 12× R$ {(preco / 12).toFixed(2).replace('.', ',')}</p>
      )}
    </button>
  )
}
