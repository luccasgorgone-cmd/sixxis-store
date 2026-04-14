'use client'

import { useEffect, useState } from 'react'

interface Avaliacao {
  id:         string
  nota:       number
  titulo:     string | null
  comentario: string | null
  createdAt:  string
  cliente:    { nome: string }
}

interface Props { produtoId: string }

function Estrelas({ nota, size = 14 }: { nota: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          fill={n <= nota ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
          stroke={n <= nota ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
          strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

function EstrelasItem({ nota, size = 14 }: { nota: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          fill={n <= nota ? '#f59e0b' : '#e5e7eb'}
          stroke={n <= nota ? '#f59e0b' : '#e5e7eb'}
          strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

function primeiroNome(nome: string) {
  const parts = nome.trim().split(' ')
  if (parts.length === 1) return nome
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

const VISIVEIS_INICIAL = 3

export default function AvaliacoesProduto({ produtoId }: Props) {
  const [data, setData] = useState<{
    avaliacoes: Avaliacao[]
    total: number
    media: number
    distribuicao: { nota: number; count: number }[]
  } | null>(null)
  const [expandida, setExpandida] = useState(false)

  useEffect(() => {
    fetch(`/api/avaliacoes?produtoId=${produtoId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [produtoId])

  if (!data || data.total === 0) return null

  const avaliacoesExibidas = expandida ? data.avaliacoes : data.avaliacoes.slice(0, VISIVEIS_INICIAL)
  const temMais = data.avaliacoes.length > VISIVEIS_INICIAL

  // Mapa de distribuição por estrela (1-5)
  const distMap = Object.fromEntries(data.distribuicao.map(d => [d.nota, d.count]))

  return (
    <section id="avaliacoes" className="mt-12">
      <h2 className="text-xl font-extrabold text-[#0a0a0a] mb-6">Avaliações dos clientes</h2>

      {/* Resumo — gradiente escuro */}
      <div
        className="rounded-2xl overflow-hidden border border-[#3cbfb3]/20 mb-6"
        style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
      >
        <div className="flex items-center gap-6 p-5">

          {/* Nota grande */}
          <div className="text-center shrink-0">
            <p className="text-5xl font-black text-white leading-none">
              {data.media.toFixed(1)}
            </p>
            <div className="mt-2 flex justify-center">
              <Estrelas nota={Math.round(data.media)} size={14} />
            </div>
            <p className="text-[10px] text-white/60 mt-1 font-semibold">
              {data.total} avaliação{data.total !== 1 ? 'ões' : ''}
            </p>
          </div>

          {/* Barras por estrela */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((estrela) => {
              const count = distMap[estrela] || 0
              const pct   = data.total > 0 ? Math.round((count / data.total) * 100) : 0
              return (
                <div key={estrela} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 700, width: '10px', textAlign: 'right', flexShrink: 0 }}>
                    {estrela}
                  </span>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#f59e0b" style={{ flexShrink: 0 }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '9999px', height: '6px' }}>
                    <div style={{ width: `${pct}%`, height: '6px', borderRadius: '9999px', backgroundColor: '#f59e0b', transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 500, width: '24px', flexShrink: 0 }}>
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista de avaliações */}
      <div className="space-y-4">
        {avaliacoesExibidas.map((av) => (
          <div key={av.id} className="border border-gray-100 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <EstrelasItem nota={av.nota} size={14} />
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

      {/* Botão expandir/colapsar */}
      {temMais && (
        <button
          onClick={() => setExpandida(!expandida)}
          className="w-full py-3 text-sm font-bold text-[#3cbfb3] hover:bg-[#e8f8f7] transition rounded-2xl border border-[#3cbfb3]/20 flex items-center justify-center gap-2 mt-4"
        >
          {expandida ? (
            <><span>Mostrar menos</span><span>↑</span></>
          ) : (
            <><span>Ver mais {data.avaliacoes.length - VISIVEIS_INICIAL} avaliações</span><span>↓</span></>
          )}
        </button>
      )}
    </section>
  )
}
