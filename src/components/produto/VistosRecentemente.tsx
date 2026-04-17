'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useVistos } from '@/hooks/useListas'

interface ProdutoVisto {
  id: string
  nome: string
  slug: string
  preco: number | string
  imagens: unknown
}

export default function VistosRecentemente({ excluirId }: { excluirId?: string }) {
  const ids = useVistos((s) => s.ids)
  const [produtos, setProdutos] = useState<ProdutoVisto[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const filtrados = ids.filter((id) => id !== excluirId)
    if (filtrados.length < 2) {
      setProdutos([])
      setLoaded(true)
      return
    }
    fetch(`/api/produtos/por-ids?ids=${filtrados.join(',')}`)
      .then((r) => r.json())
      .then((data) => {
        setProdutos(Array.isArray(data?.produtos) ? data.produtos : [])
      })
      .catch(() => setProdutos([]))
      .finally(() => setLoaded(true))
  }, [ids, excluirId])

  if (!loaded || produtos.length < 2) return null

  return (
    <section className="mt-16">
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-gray-900">Vistos recentemente</h2>
        <div className="w-12 h-0.5 bg-[#3cbfb3] mt-1 rounded-full" />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory">
        {produtos.map((p) => {
          const imagens = Array.isArray(p.imagens) ? (p.imagens as string[]) : []
          const preco = Number(p.preco)
          return (
            <Link
              key={p.id}
              href={`/produtos/${p.slug}`}
              className="shrink-0 w-[160px] sm:w-[180px] snap-start bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#3cbfb3]/40 hover:shadow-md transition-all group"
            >
              <div className="aspect-square relative bg-white">
                {imagens[0] ? (
                  <Image
                    src={imagens[0]}
                    alt={p.nome}
                    fill
                    className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    sizes="180px"
                    unoptimized
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50" />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-gray-700 line-clamp-2 leading-snug mb-1">{p.nome}</p>
                <p className="text-sm font-black text-gray-900">
                  R$ {preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
