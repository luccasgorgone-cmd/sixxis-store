'use client'

import { useState } from 'react'
import GaleriaCB from '@/components/produto/GaleriaCB'
import type { GaleriaItemCB } from '@/components/produto/GaleriaCB'
import InfoProdutoCB from '@/components/produto/InfoProdutoCB'
import SpecsExpandiveis from '@/components/produto/SpecsExpandiveis'
import EconomiaComparador from '@/components/produto/EconomiaComparador'

function extractSpecNumber(specs: { label: string; valor: string }[], ...terms: string[]): number {
  for (const term of terms) {
    const found = specs.find(s => s.label.toLowerCase().includes(term.toLowerCase()))?.valor
    if (found) {
      const clean = found.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, ' ')
      const m = /\d+(\.\d+)?/.exec(clean.trim())
      if (m) return parseFloat(m[0])
    }
  }
  return NaN
}

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

  // Extract energy/area specs for EconomiaComparador (climatizadores only)
  const specs = especificacoes ?? []
  const consumoW = extractSpecNumber(specs, 'potência', 'consumo', 'potencia')
  const areaM2 = extractSpecNumber(specs, 'cobertura', 'área', 'area recomendada', 'ambiente')
  const showEconomia = !isNaN(consumoW) && consumoW > 0 && !isNaN(areaM2) && areaM2 > 0
  const precoClimatizador = Math.round(produto.precoPromocional ?? produto.preco)

  return (
    <>
      <div className="relative">
        <GaleriaCB itens={itensGaleria} nome={produto.nome} />
        {specs.length > 0 && (
          <SpecsExpandiveis especificacoes={specs} />
        )}
        {showEconomia && (
          <EconomiaComparador
            consumoW={consumoW}
            areaM2={areaM2}
            precoClimatizador={precoClimatizador}
          />
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
