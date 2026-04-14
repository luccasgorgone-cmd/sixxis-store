'use client'

import { useState, useEffect } from 'react'
import { Star, Check, X, Trash2, Edit2 } from 'lucide-react'

interface AvaliacaoFoto { id: string; url: string }
interface AvaliacaoAdmin {
  id: string
  nota: number
  nomeAutor: string
  emailAutor: string | null
  titulo: string | null
  comentario: string | null
  aprovada: boolean
  destaque: boolean
  resposta: string | null
  createdAt: string
  fotos: AvaliacaoFoto[]
  cliente: { nome: string } | null
}

interface Props { produtoId: string }

function Estrelas({ nota }: { nota: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={12}
          className={n <= nota ? 'fill-[#f59e0b] text-[#f59e0b]' : 'fill-gray-200 text-gray-200'} />
      ))}
    </div>
  )
}

export default function AvaliacoesAdminProduto({ produtoId }: Props) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoAdmin[]>([])
  const [loading, setLoading]       = useState(true)
  const [filtro, setFiltro]         = useState('todas')
  const [editando, setEditando]     = useState<AvaliacaoAdmin | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando]     = useState(false)
  const [adicionando, setAdicionando] = useState(false)
  const [novaAv, setNovaAv]         = useState({ nota: 5, nomeAutor: '', emailAutor: '', titulo: '', comentario: '', aprovada: true, resposta: '' })

  function carregar() {
    setLoading(true)
    const q = filtro === 'todas' ? '' : `&status=${filtro}`
    fetch(`/api/admin/avaliacoes?produtoId=${produtoId}${q}`)
      .then(r => r.json())
      .then(d => { setAvaliacoes(d.avaliacoes ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [filtro, produtoId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleAprovada(id: string, aprovada: boolean) {
    await fetch(`/api/avaliacoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aprovada }),
    })
    carregar()
  }

  async function toggleDestaque(id: string, destaque: boolean) {
    await fetch(`/api/avaliacoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destaque }),
    })
    carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta avaliação?')) return
    await fetch(`/api/avaliacoes/${id}`, { method: 'DELETE' })
    carregar()
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvando(true)
    await fetch(`/api/avaliacoes/${editando.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nota:       editando.nota,
        nomeAutor:  editando.nomeAutor,
        titulo:     editando.titulo,
        comentario: editando.comentario,
        aprovada:   editando.aprovada,
        destaque:   editando.destaque,
        resposta:   editando.resposta,
      }),
    })
    setSalvando(false)
    setModalAberto(false)
    setEditando(null)
    carregar()
  }

  async function salvarNova() {
    setSalvando(true)
    const res = await fetch('/api/avaliacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produtoId, ...novaAv }),
    })
    const json = await res.json()
    // Endpoint público cria como aprovada:false — se admin marcou aprovada:true, aplicar via PATCH
    if (novaAv.aprovada && json.avaliacao?.id) {
      await fetch(`/api/avaliacoes/${json.avaliacao.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprovada: true,
          ...(novaAv.resposta ? { resposta: novaAv.resposta } : {}),
        }),
      })
    }
    setSalvando(false)
    setAdicionando(false)
    setNovaAv({ nota: 5, nomeAutor: '', emailAutor: '', titulo: '', comentario: '', aprovada: true, resposta: '' })
    carregar()
  }

  const filtradas = avaliacoes.filter(av => {
    if (filtro === 'aprovadas') return av.aprovada
    if (filtro === 'pendentes') return !av.aprovada
    if (filtro === 'destaque')  return av.destaque
    return true
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Star size={18} className="text-[#f59e0b]" />
          Avaliações ({avaliacoes.length})
        </h3>
        <button
          onClick={() => setAdicionando(true)}
          className="flex items-center gap-2 bg-[#3cbfb3] text-white font-bold px-4 py-2 rounded-xl text-sm transition hover:bg-[#2a9d8f]"
        >
          + Adicionar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['todas', 'aprovadas', 'pendentes', 'destaque'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filtro === f ? 'bg-[#3cbfb3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-4 text-center">Carregando...</p>
      ) : filtradas.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">Nenhuma avaliação encontrada.</p>
      ) : (
        <div className="space-y-3">
          {filtradas.map(av => (
            <div key={av.id} className="border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Estrelas nota={av.nota} />
                    <span className="font-bold text-gray-900 text-sm">{av.nomeAutor || av.cliente?.nome || '—'}</span>
                    <span className="text-gray-400 text-xs">{new Date(av.createdAt).toLocaleDateString('pt-BR')}</span>
                    {av.aprovada
                      ? <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">Aprovada</span>
                      : <span className="bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">Pendente</span>
                    }
                    {av.destaque && (
                      <span className="bg-[#e8f8f7] text-[#1a4f4a] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#3cbfb3]/20">⭐ Destaque</span>
                    )}
                    {av.fotos?.length > 0 && (
                      <span className="text-xs text-[#3cbfb3]">{av.fotos.length} foto(s)</span>
                    )}
                  </div>
                  {av.titulo && <p className="font-semibold text-gray-800 text-sm mb-0.5">{av.titulo}</p>}
                  <p className="text-gray-600 text-sm line-clamp-2">{av.comentario}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-4 shrink-0 flex-wrap justify-end">
                  <button onClick={() => toggleAprovada(av.id, !av.aprovada)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                      av.aprovada ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600' : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}>
                    {av.aprovada ? 'Reprovar' : 'Aprovar'}
                  </button>
                  <button onClick={() => toggleDestaque(av.id, !av.destaque)}
                    className={`text-xs font-bold px-2 py-1.5 rounded-xl transition ${
                      av.destaque ? 'bg-[#e8f8f7] text-[#3cbfb3]' : 'bg-gray-100 text-gray-400 hover:bg-[#e8f8f7]'
                    }`} title="Marcar como destaque">⭐</button>
                  <button onClick={() => { setEditando({...av}); setModalAberto(true) }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl transition">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => excluir(av.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-xl transition">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal edição */}
      {modalAberto && editando && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalAberto(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 text-lg">Editar Avaliação</h4>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Nota</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setEditando(e => e ? {...e, nota: n} : e)}
                      className="transition-transform hover:scale-110">
                      <Star size={28} className={n <= editando.nota ? 'fill-[#f59e0b] text-[#f59e0b]' : 'fill-gray-200 text-gray-200'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Nome do Autor</label>
                <input type="text" value={editando.nomeAutor}
                  onChange={e => setEditando(prev => prev ? {...prev, nomeAutor: e.target.value} : prev)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Título</label>
                <input type="text" value={editando.titulo ?? ''}
                  onChange={e => setEditando(prev => prev ? {...prev, titulo: e.target.value} : prev)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Comentário</label>
                <textarea value={editando.comentario ?? ''}
                  onChange={e => setEditando(prev => prev ? {...prev, comentario: e.target.value} : prev)}
                  rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none resize-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Resposta da Loja</label>
                <textarea value={editando.resposta ?? ''}
                  onChange={e => setEditando(prev => prev ? {...prev, resposta: e.target.value} : prev)}
                  rows={3} placeholder="Deixe em branco para remover a resposta."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none resize-none" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editando.aprovada}
                    onChange={e => setEditando(prev => prev ? {...prev, aprovada: e.target.checked} : prev)}
                    className="w-4 h-4 accent-[#3cbfb3]" />
                  <span className="text-sm font-medium text-gray-700">Aprovada</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editando.destaque}
                    onChange={e => setEditando(prev => prev ? {...prev, destaque: e.target.checked} : prev)}
                    className="w-4 h-4 accent-[#f59e0b]" />
                  <span className="text-sm font-medium text-gray-700">Destaque</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={salvarEdicao} disabled={salvando}
                  className="flex-1 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2">
                  {salvando ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Salvando...</> : <><Check size={16} />Salvar</>}
                </button>
                <button onClick={() => setModalAberto(false)}
                  className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nova avaliação */}
      {adicionando && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAdicionando(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 text-lg">Adicionar Avaliação</h4>
              <button onClick={() => setAdicionando(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Nota</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setNovaAv(a => ({...a, nota: n}))}
                      className="transition-transform hover:scale-110">
                      <Star size={28} className={n <= novaAv.nota ? 'fill-[#f59e0b] text-[#f59e0b]' : 'fill-gray-200 text-gray-200'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Nome *</label>
                <input type="text" value={novaAv.nomeAutor}
                  onChange={e => setNovaAv(a => ({...a, nomeAutor: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Título</label>
                <input type="text" value={novaAv.titulo}
                  onChange={e => setNovaAv(a => ({...a, titulo: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">E-mail</label>
                <input type="email" value={novaAv.emailAutor}
                  onChange={e => setNovaAv(a => ({...a, emailAutor: e.target.value}))}
                  placeholder="email@exemplo.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Comentário *</label>
                <textarea value={novaAv.comentario}
                  onChange={e => setNovaAv(a => ({...a, comentario: e.target.value}))}
                  rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none resize-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Resposta da Loja</label>
                <textarea value={novaAv.resposta}
                  onChange={e => setNovaAv(a => ({...a, resposta: e.target.value}))}
                  rows={2} placeholder="Deixe em branco para não incluir resposta."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={novaAv.aprovada}
                  onChange={e => setNovaAv(a => ({...a, aprovada: e.target.checked}))}
                  className="w-4 h-4 accent-[#3cbfb3]" />
                <span className="text-sm font-medium text-gray-700">Aprovada (publicar imediatamente)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={salvarNova} disabled={salvando || !novaAv.nomeAutor || !novaAv.comentario}
                  className="flex-1 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition">
                  {salvando ? 'Salvando...' : 'Adicionar'}
                </button>
                <button onClick={() => setAdicionando(false)}
                  className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
