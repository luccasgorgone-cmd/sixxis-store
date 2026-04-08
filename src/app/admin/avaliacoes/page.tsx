'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Star, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import { Toast } from '@/components/admin/Toast'

interface Avaliacao {
  id:        string
  nota:      number
  titulo:    string | null
  comentario: string | null
  aprovada:  boolean
  createdAt: string
  cliente:   { nome: string; email: string }
  produto:   { nome: string; slug: string }
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} className={n <= nota ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
      ))}
    </div>
  )
}

export default function AdminAvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'pendente' | 'aprovada'>('pendente')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type })

  const fetchAvaliacoes = useCallback(async () => {
    setLoading(true)
    const aprovada = filtro === 'aprovada' ? 'true' : 'false'
    const r = await fetch(`/api/admin/avaliacoes?aprovada=${aprovada}`)
    const d = await r.json()
    setAvaliacoes(d.avaliacoes ?? [])
    setLoading(false)
  }, [filtro])

  useEffect(() => { fetchAvaliacoes() }, [fetchAvaliacoes])

  async function handleAprovar(id: string, aprovada: boolean) {
    await fetch('/api/admin/avaliacoes', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, aprovada }),
    })
    showToast(aprovada ? 'Avaliação aprovada!' : 'Avaliação rejeitada')
    fetchAvaliacoes()
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('pt-BR')
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
            <p className="text-sm text-gray-500 mt-0.5">{avaliacoes.length} avaliação{avaliacoes.length !== 1 ? 'ões' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {(['pendente', 'aprovada'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  filtro === f
                    ? 'bg-[#3cbfb3] text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {f === 'pendente' ? 'Aguardando' : 'Aprovadas'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#3cbfb3] animate-spin" />
          </div>
        ) : avaliacoes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma avaliação {filtro === 'pendente' ? 'aguardando aprovação' : 'aprovada'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {avaliacoes.map((av) => (
              <div key={av.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Estrelas nota={av.nota} />
                      <span className="text-xs text-gray-400">{fmtDate(av.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-gray-900">{av.cliente.nome}</p>
                      <span className="text-gray-300">·</span>
                      <p className="text-xs text-gray-400">{av.cliente.email}</p>
                    </div>

                    <p className="text-xs text-[#3cbfb3] font-medium mb-2">Produto: {av.produto.nome}</p>

                    {av.titulo && (
                      <p className="font-semibold text-sm text-gray-800 mb-1">{av.titulo}</p>
                    )}
                    {av.comentario && (
                      <p className="text-sm text-gray-600 leading-relaxed">{av.comentario}</p>
                    )}
                  </div>

                  {filtro === 'pendente' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAprovar(av.id, false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 border border-red-200 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </button>
                      <button
                        onClick={() => handleAprovar(av.id, true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50 border border-green-200 transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprovar
                      </button>
                    </div>
                  )}

                  {filtro === 'aprovada' && (
                    <button
                      onClick={() => handleAprovar(av.id, false)}
                      className="text-xs text-gray-400 hover:text-red-400 transition"
                    >
                      Rejeitar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
