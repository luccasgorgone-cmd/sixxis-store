'use client'

import { useState, useEffect, useMemo } from 'react'
import { Star, Search, Check, X, Trash2, Edit2, ChevronDown, XCircle } from 'lucide-react'
import Link from 'next/link'

interface AvaliacaoFoto { id: string; url: string }
interface Produto { id: string; nome: string; imagens: string[]; slug: string }
interface AvaliacaoGlobal {
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
  produto: Produto | null
  cliente: { nome: string } | null
}

const POR_PAGINA = 20

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

export default function AdminAvaliacoesPage() {
  const [avaliacoes, setAvaliacoes]   = useState<AvaliacaoGlobal[]>([])
  const [loading, setLoading]         = useState(true)
  const [selecionadas, setSelecionadas] = useState<string[]>([])
  const [editando, setEditando]       = useState<AvaliacaoGlobal | null>(null)
  const [salvando, setSalvando]       = useState(false)

  // Filtros client-side
  const [filtroBusca,    setFiltroBusca]    = useState('')
  const [filtroProduto,  setFiltroProduto]  = useState('')
  const [filtroNota,     setFiltroNota]     = useState('')
  const [filtroStatus,   setFiltroStatus]   = useState('')
  const [paginaAtual,    setPaginaAtual]    = useState(1)

  function carregar() {
    setLoading(true)
    fetch('/api/admin/avaliacoes?limit=500')
      .then(r => r.json())
      .then(d => { setAvaliacoes(d.avaliacoes ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  // Produtos únicos para o dropdown
  const produtos = useMemo(() => {
    const map = new Map<string, string>()
    avaliacoes.forEach(av => {
      if (av.produto) map.set(av.produto.slug, av.produto.nome)
    })
    return [...map.entries()].map(([slug, nome]) => ({ slug, nome })).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [avaliacoes])

  // Filtragem client-side
  const avaliacoesFiltradas = useMemo(() => {
    return avaliacoes.filter(av => {
      if (filtroProduto && av.produto?.slug !== filtroProduto) return false
      if (filtroNota && av.nota !== parseInt(filtroNota)) return false
      if (filtroStatus === 'aprovada' && !av.aprovada) return false
      if (filtroStatus === 'pendente' && av.aprovada) return false
      if (filtroStatus === 'destaque' && !av.destaque) return false
      if (filtroBusca) {
        const q = filtroBusca.toLowerCase()
        if (
          !av.nomeAutor?.toLowerCase().includes(q) &&
          !av.comentario?.toLowerCase().includes(q) &&
          !av.titulo?.toLowerCase().includes(q) &&
          !av.produto?.nome?.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [avaliacoes, filtroBusca, filtroProduto, filtroNota, filtroStatus])

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(avaliacoesFiltradas.length / POR_PAGINA))
  const avaliacoesPaginadas = avaliacoesFiltradas.slice(
    (paginaAtual - 1) * POR_PAGINA,
    paginaAtual * POR_PAGINA,
  )

  const temFiltros = filtroBusca || filtroProduto || filtroNota || filtroStatus

  function limparFiltros() {
    setFiltroBusca(''); setFiltroProduto(''); setFiltroNota(''); setFiltroStatus('')
    setPaginaAtual(1)
  }

  async function toggleAprovada(id: string, aprovada: boolean) {
    await fetch(`/api/avaliacoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aprovada }),
    })
    carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta avaliação?')) return
    await fetch(`/api/avaliacoes/${id}`, { method: 'DELETE' })
    setAvaliacoes(prev => prev.filter(a => a.id !== id))
  }

  async function aprovarEmMassa() {
    for (const id of selecionadas) {
      await fetch(`/api/avaliacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprovada: true }),
      })
    }
    setSelecionadas([])
    carregar()
  }

  async function excluirEmMassa() {
    if (!confirm(`Excluir ${selecionadas.length} avaliação(ões)?`)) return
    for (const id of selecionadas) {
      await fetch(`/api/avaliacoes/${id}`, { method: 'DELETE' })
    }
    setSelecionadas([])
    carregar()
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvando(true)
    await fetch(`/api/avaliacoes/${editando.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nota: editando.nota,
        nomeAutor: editando.nomeAutor,
        titulo: editando.titulo,
        comentario: editando.comentario,
        aprovada: editando.aprovada,
        destaque: editando.destaque,
        resposta: editando.resposta,
      }),
    })
    setSalvando(false)
    setEditando(null)
    carregar()
  }

  function toggleSelecao(id: string) {
    setSelecionadas(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  function exportarCSV() {
    const header = 'ID,Produto,Nota,Autor,Comentário,Aprovada,Data\n'
    const rows = avaliacoesFiltradas.map(av =>
      `${av.id},"${av.produto?.nome ?? ''}",${av.nota},"${av.nomeAutor}","${(av.comentario ?? '').replace(/"/g, '""')}",${av.aprovada},${av.createdAt}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'avaliacoes.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Carregando...' : `${avaliacoes.length} avaliação(ões) no total`}
          </p>
        </div>
        <div className="flex gap-2">
          {selecionadas.length > 0 && (
            <>
              <button onClick={aprovarEmMassa}
                className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 font-bold px-4 py-2 rounded-xl text-sm hover:bg-green-100 transition">
                <Check size={14} /> Aprovar ({selecionadas.length})
              </button>
              <button onClick={excluirEmMassa}
                className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-100 transition">
                <Trash2 size={14} /> Excluir ({selecionadas.length})
              </button>
            </>
          )}
          <button onClick={exportarCSV}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-sm transition">
            <ChevronDown size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Busca */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide block mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filtroBusca}
                onChange={e => { setFiltroBusca(e.target.value); setPaginaAtual(1) }}
                placeholder="Nome, título ou comentário..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
              />
            </div>
          </div>

          {/* Produto */}
          <div>
            <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide block mb-1">
              Produto
            </label>
            <select
              value={filtroProduto}
              onChange={e => { setFiltroProduto(e.target.value); setPaginaAtual(1) }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
            >
              <option value="">Todos os produtos</option>
              {produtos.map(p => (
                <option key={p.slug} value={p.slug}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Nota */}
          <div>
            <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide block mb-1">
              Avaliação
            </label>
            <select
              value={filtroNota}
              onChange={e => { setFiltroNota(e.target.value); setPaginaAtual(1) }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
            >
              <option value="">Todas as notas</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 estrelas</option>
              <option value="4">⭐⭐⭐⭐ 4 estrelas</option>
              <option value="3">⭐⭐⭐ 3 estrelas</option>
              <option value="2">⭐⭐ 2 estrelas</option>
              <option value="1">⭐ 1 estrela</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide block mb-1">
              Status
            </label>
            <select
              value={filtroStatus}
              onChange={e => { setFiltroStatus(e.target.value); setPaginaAtual(1) }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
            >
              <option value="">Todos</option>
              <option value="aprovada">Aprovadas</option>
              <option value="pendente">Pendentes</option>
              <option value="destaque">Em destaque</option>
            </select>
          </div>

          {/* Contador + limpar */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-500 font-medium">
              {avaliacoesFiltradas.length} resultado{avaliacoesFiltradas.length !== 1 ? 's' : ''}
            </span>
            {temFiltros && (
              <button
                onClick={limparFiltros}
                className="text-xs text-red-500 font-bold flex items-center gap-1 border border-red-100 px-2.5 py-1.5 rounded-xl hover:bg-red-50 transition"
              >
                <XCircle size={11} /> Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Lista ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-10 text-sm">Carregando...</p>
        ) : avaliacoesFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm mb-3">Nenhuma avaliação encontrada.</p>
            {temFiltros && (
              <button onClick={limparFiltros} className="text-xs text-[#3cbfb3] font-bold hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Header tabela */}
            <div className="grid grid-cols-[24px_80px_1fr_80px_120px_80px_120px] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <div />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produto</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avaliação</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nota</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Data</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ações</p>
            </div>
            {avaliacoesPaginadas.map(av => (
              <div key={av.id}
                className="grid grid-cols-[24px_80px_1fr_80px_120px_80px_120px] gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition items-center">
                {/* Checkbox */}
                <input type="checkbox" checked={selecionadas.includes(av.id)} onChange={() => toggleSelecao(av.id)}
                  className="w-4 h-4 accent-[#3cbfb3]" />

                {/* Imagem produto */}
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                  {av.produto?.imagens?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(av.produto.imagens as string[])[0]} alt="" className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>

                {/* Avaliação */}
                <div className="min-w-0">
                  {av.produto && (
                    <Link href={`/admin/produtos/${av.produto.id}`} className="text-xs text-[#3cbfb3] hover:underline font-medium block truncate mb-0.5">
                      {av.produto.nome}
                    </Link>
                  )}
                  <p className="text-sm font-semibold text-gray-900">{av.nomeAutor || av.cliente?.nome}</p>
                  <p className="text-xs text-gray-500 truncate">{av.comentario}</p>
                </div>

                {/* Nota */}
                <Estrelas nota={av.nota} />

                {/* Data */}
                <p className="text-xs text-gray-500">{new Date(av.createdAt).toLocaleDateString('pt-BR')}</p>

                {/* Status */}
                <div>
                  {av.aprovada
                    ? <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">Aprovada</span>
                    : <span className="bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">Pendente</span>
                  }
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleAprovada(av.id, !av.aprovada)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg transition ${
                      av.aprovada ? 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500' : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}>
                    {av.aprovada ? <X size={11} /> : <Check size={11} />}
                  </button>
                  <button onClick={() => setEditando({ ...av })}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-lg transition">
                    <Edit2 size={11} />
                  </button>
                  <button onClick={() => excluir(av.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-500 text-[10px] font-bold px-2 py-1 rounded-lg transition">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Paginação ────────────────────────────────────────────────────────── */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-5 flex-wrap">
          <button
            onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
            disabled={paginaAtual === 1}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-sm hover:border-[#3cbfb3] disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600"
          >
            ‹
          </button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-1.5">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-gray-400 text-sm">…</span>
                )}
                <button
                  onClick={() => setPaginaAtual(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold border transition ${
                    p === paginaAtual
                      ? 'bg-[#0f2e2b] text-white border-[#0f2e2b]'
                      : 'border-gray-200 text-gray-600 hover:border-[#3cbfb3] hover:text-[#3cbfb3]'
                  }`}
                >{p}</button>
              </span>
            ))}
          <button
            onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaAtual === totalPaginas}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-sm hover:border-[#3cbfb3] disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600"
          >
            ›
          </button>
          <span className="text-xs text-gray-500 ml-1">
            Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
          </span>
        </div>
      )}

      {/* ── Modal edição ──────────────────────────────────────────────────────── */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 text-lg">Editar Avaliação</h4>
              <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Nota</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setEditando(e => e ? {...e, nota: n} : e)}>
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
                  rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none resize-none" />
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
                  {salvando ? 'Salvando...' : <><Check size={16} />Salvar</>}
                </button>
                <button onClick={() => setEditando(null)}
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
