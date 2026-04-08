'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

interface Produto {
  id: string
  nome: string
  slug: string
  preco: number
  precoPromocional: number | null
  imagens: string[]
  estoque: number
  categoria: string
  modelo: string | null
}

interface FiltrosProduto {
  categoria?: string
  q?: string
  page?: number
  limit?: number
}

export function useProdutos(filtros: FiltrosProduto = {}) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const buscar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const params = new URLSearchParams()
      if (filtros.categoria) params.set('categoria', filtros.categoria)
      if (filtros.q) params.set('q', filtros.q)
      if (filtros.page) params.set('page', String(filtros.page))
      if (filtros.limit) params.set('limit', String(filtros.limit))

      const { data } = await axios.get(`/api/produtos?${params.toString()}`)
      setProdutos(data.produtos)
      setTotal(data.total)
    } catch {
      setErro('Erro ao carregar produtos.')
    } finally {
      setCarregando(false)
    }
  }, [filtros.categoria, filtros.q, filtros.page, filtros.limit])

  useEffect(() => {
    buscar()
  }, [buscar])

  return { produtos, total, carregando, erro, recarregar: buscar }
}
