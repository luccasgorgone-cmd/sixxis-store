'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'

interface Avaliacao {
  id:         string
  nota:       number
  titulo:     string | null
  comentario: string | null
  createdAt:  string
  cliente:    { nome: string }
}

interface Props { produtoId: string }

function Estrelas({ nota, size = 16 }: { nota: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= nota ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
        />
      ))}
    </div>
  )
}

function primeiroNome(nome: string) {
  const parts = nome.trim().split(' ')
  if (parts.length === 1) return nome
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export default function AvaliacoesProduto({ produtoId }: Props) {
  const [data, setData] = useState<{
    avaliacoes: Avaliacao[]
    total: number
    media: number
    distribuicao: { nota: number; count: number }[]
  } | null>(null)

  useEffect(() => {
    fetch(`/api/avaliacoes?produtoId=${produtoId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [produtoId])

  if (!data || data.total === 0) return null

  return (
    <section id="avaliacoes" className="mt-12">
      <h2 className="text-xl font-extrabold text-[#0a0a0a] mb-6">Avaliações dos clientes</h2>

      {/* Resumo */}
      <div className="flex flex-col sm:flex-row gap-8 mb-8 p-6 bg-[#f8f9fa] rounded-2xl">
        <div className="text-center shrink-0">
          <p className="text-6xl font-extrabold text-[#0a0a0a]">{data.media.toFixed(1)}</p>
          <Estrelas nota={Math.round(data.media)} size={20} />
          <p className="text-sm text-gray-500 mt-1">{data.total} avaliação{data.total !== 1 ? 'ões' : ''}</p>
        </div>

        <div className="flex-1 space-y-2">
          {data.distribuicao.map(({ nota, count }) => {
            const pct = data.total > 0 ? (count / data.total) * 100 : 0
            return (
              <div key={nota} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-right text-gray-600 font-medium">{nota}</span>
                <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-gray-500 text-xs">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {data.avaliacoes.map((av) => (
          <div key={av.id} className="border border-gray-100 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <Estrelas nota={av.nota} />
                {av.titulo && (
                  <p className="font-semibold text-[#0a0a0a] mt-1 text-sm">{av.titulo}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-gray-700">{primeiroNome(av.cliente.nome)}</p>
                <p className="text-xs text-gray-400">
                  {new Date(av.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <span className="inline-block mt-1 text-[10px] font-semibold bg-[#e8f8f7] text-[#3cbfb3] px-2 py-0.5 rounded-full">
                  Compra Verificada
                </span>
              </div>
            </div>
            {av.comentario && (
              <p className="text-sm text-gray-600 leading-relaxed mt-2">{av.comentario}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
