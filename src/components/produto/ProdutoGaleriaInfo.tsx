'use client'

import { useState } from 'react'
import GaleriaCB from '@/components/produto/GaleriaCB'
import type { GaleriaItemCB } from '@/components/produto/GaleriaCB'
import InfoProdutoCB from '@/components/produto/InfoProdutoCB'
import SpecsExpandiveis from '@/components/produto/SpecsExpandiveis'

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
    imagem?: string
  }
  variacoes: Variacao[]
  taxaJuros: number
  mediaAvaliacoes: number
  totalAvaliacoes: number
  itensIniciais: GaleriaItemCB[]
  imagensPorVariacao?: Record<string, string[]>
  especificacoes?: { label: string; valor: string }[]
}

export default function ProdutoGaleriaInfo({
  produto,
  variacoes,
  taxaJuros,
  mediaAvaliacoes,
  totalAvaliacoes,
  itensIniciais,
  imagensPorVariacao,
  especificacoes,
}: Props) {
  const [itensGaleria, setItensGaleria] = useState<GaleriaItemCB[]>(() => {
    if (!imagensPorVariacao) return itensIniciais
    // Find default variant (prefer branco) to initialize gallery with correct color photos
    const ativas = variacoes.filter(v => v.ativo)
    const defaultNome =
      ativas.find(v => v.nome.toLowerCase().includes('branco'))?.nome ??
      ativas[0]?.nome
    if (!defaultNome) return itensIniciais
    const imgs = imagensPorVariacao[defaultNome]
    if (imgs && imgs.length > 0) return imgs.map(url => ({ tipo: 'imagem' as const, url }))
    return itensIniciais
  })

  function handleVariacaoChange(variacaoNome: string | null) {
    if (!imagensPorVariacao || !variacaoNome) {
      setItensGaleria(itensIniciais)
      return
    }
    const imgs = imagensPorVariacao[variacaoNome]
    if (imgs && imgs.length > 0) {
      setItensGaleria(imgs.map(url => ({ tipo: 'imagem' as const, url })))
    } else {
      setItensGaleria(itensIniciais)
    }
  }

  return (
    <>
      <div className="relative">
        <GaleriaCB itens={itensGaleria} nome={produto.nome} />
        {especificacoes && especificacoes.length > 0 && (
          <SpecsExpandiveis especificacoes={especificacoes} />
        )}
      </div>
      <InfoProdutoCB
        produto={produto}
        variacoes={variacoes}
        taxaJuros={taxaJuros}
        mediaAvaliacoes={mediaAvaliacoes}
        totalAvaliacoes={totalAvaliacoes}
        imagensPorVariacao={imagensPorVariacao}
        onVariacaoChange={handleVariacaoChange}
      />
    </>
  )
}
