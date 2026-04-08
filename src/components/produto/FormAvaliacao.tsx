'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface Props {
  produtoId:  string
  comprouProduto: boolean
}

export default function FormAvaliacao({ produtoId, comprouProduto }: Props) {
  const [nota, setNota] = useState(0)
  const [hover, setHover] = useState(0)
  const [titulo, setTitulo] = useState('')
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  if (!comprouProduto) return null

  if (enviado) {
    return (
      <div className="bg-[#e8f8f7] border border-[#3cbfb3]/30 rounded-xl p-5 text-center mt-6">
        <p className="text-[#3cbfb3] font-bold text-lg">⭐ Avaliação enviada!</p>
        <p className="text-sm text-gray-600 mt-1">Será publicada após análise da nossa equipe.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nota === 0) { setErro('Selecione uma nota'); return }
    setErro('')
    setEnviando(true)

    const res = await fetch('/api/avaliacoes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ produtoId, nota, titulo, comentario }),
    })

    setEnviando(false)

    if (res.ok) {
      setEnviado(true)
    } else {
      const d = await res.json()
      setErro(d.error ?? 'Erro ao enviar avaliação')
    }
  }

  return (
    <div className="mt-8 border border-gray-200 rounded-2xl p-6">
      <h3 className="text-base font-bold text-[#0a0a0a] mb-4">Deixe sua avaliação</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Estrelas */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Sua nota</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setNota(n)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={
                    n <= (hover || nota)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título (opcional)</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Resumo da sua avaliação"
            maxLength={100}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comentário (opcional)</label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={4}
            placeholder="Conte como foi sua experiência com o produto..."
            maxLength={1000}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] resize-none"
          />
        </div>

        {erro && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{erro}</p>
        )}

        <button
          type="submit"
          disabled={enviando || nota === 0}
          className="bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition"
        >
          {enviando ? 'Enviando...' : 'Enviar avaliação'}
        </button>
      </form>
    </div>
  )
}
