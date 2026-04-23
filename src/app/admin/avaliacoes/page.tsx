'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Star, Search, Check, X, Trash2, Edit2, XCircle, Package as PackageIcon, Handshake } from 'lucide-react'
import Link from 'next/link'

type TipoAvaliacao = 'produto' | 'parceiro'

interface AvaliacaoUnificada {
  id: string
  tipo: TipoAvaliacao
  nota: number
  nomeAutor: string
  titulo: string | null
  comentario: string | null
  aprovada: boolean
  destaque: boolean
  ordem: number
  resposta?: string | null
  createdAt: string
  contextoLabel: string            // nome do produto OU "Parceiro Sixxis"
  contextoHref?: string | null     // link para o produto admin (se aplicável)
  produtoImagem?: string | null
  avatarIniciais: string
  avatarCor: string
  // campos extras de parceiro (opcionais)
  empresa?: string | null
  cargo?: string | null
  cidade?: string | null
}

interface ApiProduto { id: string; nome: string; imagens: string[]; slug: string }
interface ApiAvProduto {
  id: string; nota: number; nomeAutor: string; titulo: string | null; comentario: string | null
  aprovada: boolean; destaque: boolean; ordem: number; resposta: string | null
  createdAt: string; produto: ApiProduto | null; cliente: { nome: string } | null
}
interface ApiAvParceiro {
  id: string; nomeCompleto: string; empresa: string | null; cargo: string | null; cidade: string | null
  nota: number; titulo: string; comentario: string
  avatarInicial: string | null; corAvatar: string
  aprovada: boolean; destaque: boolean; ordem: number; createdAt: string
}

const POR_PAGINA = 20
const CORES_PRODUTO = ['#3cbfb3', '#0f2e2b', '#1a4f4a', '#2563eb', '#7c3aed', '#16a34a']

function corPorNome(nome: string) {
  let h = 0
  for (let i = 0; i < nome.length; i++) h = (h << 5) - h + nome.charCodeAt(i)
  return CORES_PRODUTO[Math.abs(h) % CORES_PRODUTO.length]
}

function iniciaisDe(nome: string) {
  const parts = nome.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function Estrelas({ nota, size = 12 }: { nota: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size}
          className={n <= nota ? 'fill-[#f59e0b] text-[#f59e0b]' : 'fill-gray-200 text-gray-200'} />
      ))}
    </div>
  )
}

export default function AdminAvaliacoesPage() {
  const [itens, setItens] = useState<AvaliacaoUnificada[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionadas, setSelecionadas] = useState<string[]>([])
  const [editando, setEditando] = useState<AvaliacaoUnificada | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [tab, setTab] = useState<'todas' | 'produto' | 'parceiro'>('todas')
  const [filtroBusca, setFiltroBusca] = useState('')
  const [filtroNota, setFiltroNota] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)

  // Lê ?tipo= uma vez no mount (client-only, sem useSearchParams para evitar
  // Suspense que bloqueia hidratação em Next 16 + React 19 em prod).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const t = sp.get('tipo')
    if (t === 'produto' || t === 'parceiro' || t === 'todas') setTab(t)
  }, [])

  // Sincroniza tab -> URL via history.replaceState (sem useRouter).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    if (tab === 'todas') sp.delete('tipo')
    else sp.set('tipo', tab)
    const qs = sp.toString()
    const newUrl = qs ? `/admin/avaliacoes?${qs}` : '/admin/avaliacoes'
    window.history.replaceState(null, '', newUrl)
  }, [tab])

  const carregar = useCallback(async () => {
    try {
      const [rProd, rParc] = await Promise.all([
        fetch('/api/admin/avaliacoes?limit=500', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/admin/avaliacoes-parceiros',  { credentials: 'include', cache: 'no-store' }),
      ])
      console.log('[admin/avaliacoes] response:', { prodOk: rProd.ok, prodStatus: rProd.status, parcOk: rParc.ok, parcStatus: rParc.status })
      const dataProd = rProd.ok ? await rProd.json().catch(() => ({ avaliacoes: [] })) : { avaliacoes: [] }
      const dataParc = rParc.ok ? await rParc.json().catch(() => [])                    : []

      const lProd: ApiAvProduto[] = Array.isArray(dataProd?.avaliacoes) ? dataProd.avaliacoes : []
      const lParc: ApiAvParceiro[] = Array.isArray(dataParc) ? dataParc : []
      console.log('[admin/avaliacoes] data:', { produto: lProd.length, parceiro: lParc.length })

      const mapProd: AvaliacaoUnificada[] = lProd.map(av => {
        const nome = av.nomeAutor || av.cliente?.nome || 'Anônimo'
        return {
          id: av.id,
          tipo: 'produto',
          nota: av.nota,
          nomeAutor: nome,
          titulo: av.titulo,
          comentario: av.comentario,
          aprovada: av.aprovada,
          destaque: av.destaque,
          ordem: av.ordem ?? 0,
          resposta: av.resposta,
          createdAt: av.createdAt,
          contextoLabel: av.produto?.nome ?? '—',
          contextoHref: av.produto ? `/admin/produtos/${av.produto.id}` : null,
          produtoImagem: av.produto?.imagens?.[0] ?? null,
          avatarIniciais: iniciaisDe(nome),
          avatarCor: corPorNome(nome),
        }
      })

      const mapParc: AvaliacaoUnificada[] = lParc.map(av => ({
        id: av.id,
        tipo: 'parceiro',
        nota: av.nota,
        nomeAutor: av.nomeCompleto,
        titulo: av.titulo,
        comentario: av.comentario,
        aprovada: av.aprovada,
        destaque: av.destaque,
        ordem: av.ordem ?? 0,
        resposta: null,
        createdAt: av.createdAt,
        contextoLabel: 'Parceiro Sixxis',
        contextoHref: null,
        produtoImagem: null,
        avatarIniciais: (av.avatarInicial || iniciaisDe(av.nomeCompleto)).slice(0, 2),
        avatarCor: av.corAvatar || '#3cbfb3',
        empresa: av.empresa,
        cargo: av.cargo,
        cidade: av.cidade,
      }))

      const unificadas = [...mapProd, ...mapParc].sort((a, b) => {
        if (a.destaque !== b.destaque) return a.destaque ? -1 : 1
        if (a.ordem !== b.ordem) return a.ordem - b.ordem
        return b.createdAt.localeCompare(a.createdAt)
      })

      setItens(unificadas)
    } catch (err) {
      console.error('[admin/avaliacoes] fetch falhou:', err)
      setItens([])
    } finally {
      console.log('[admin/avaliacoes] setLoading(false)')
      setLoading(false)
    }
  }, [])

  // Mount: fetch imediato + safety-net que força loading=false em 5s se algo travar.
  useEffect(() => {
    let alive = true
    carregar()
    const safety = setTimeout(() => { if (alive) setLoading(false) }, 5000)
    return () => { alive = false; clearTimeout(safety) }
  }, [carregar])

  const countTodas = itens.length
  const countProduto = useMemo(() => itens.filter(i => i.tipo === 'produto').length, [itens])
  const countParceiro = useMemo(() => itens.filter(i => i.tipo === 'parceiro').length, [itens])

  const itensFiltrados = useMemo(() => {
    return itens.filter(i => {
      if (tab !== 'todas' && i.tipo !== tab) return false
      if (filtroNota && i.nota !== parseInt(filtroNota)) return false
      if (filtroStatus === 'aprovada' && !i.aprovada) return false
      if (filtroStatus === 'pendente' && i.aprovada) return false
      if (filtroStatus === 'destaque' && !i.destaque) return false
      if (filtroBusca) {
        const q = filtroBusca.toLowerCase()
        if (
          !i.nomeAutor.toLowerCase().includes(q) &&
          !(i.comentario ?? '').toLowerCase().includes(q) &&
          !(i.titulo ?? '').toLowerCase().includes(q) &&
          !i.contextoLabel.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [itens, tab, filtroBusca, filtroNota, filtroStatus])

  const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / POR_PAGINA))
  const itensPaginados = itensFiltrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA)

  const temFiltros = filtroBusca || filtroNota || filtroStatus
  function limparFiltros() {
    setFiltroBusca(''); setFiltroNota(''); setFiltroStatus(''); setPaginaAtual(1)
  }

  function endpointDe(item: AvaliacaoUnificada, sub = '') {
    const base = item.tipo === 'produto' ? '/api/avaliacoes' : '/api/admin/avaliacoes-parceiros'
    return `${base}/${item.id}${sub}`
  }

  async function patchItem(item: AvaliacaoUnificada, body: Record<string, unknown>) {
    await fetch(endpointDe(item), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async function toggleAprovada(item: AvaliacaoUnificada) {
    await patchItem(item, { aprovada: !item.aprovada })
    carregar()
  }

  async function toggleDestaque(item: AvaliacaoUnificada) {
    await patchItem(item, { destaque: !item.destaque })
    setItens(prev => prev.map(x => x.id === item.id ? { ...x, destaque: !item.destaque } : x))
  }

  async function salvarOrdem(item: AvaliacaoUnificada, ordem: number) {
    await patchItem(item, { ordem })
    setItens(prev => prev.map(x => x.id === item.id ? { ...x, ordem } : x))
  }

  async function excluir(item: AvaliacaoUnificada) {
    if (!confirm('Excluir esta avaliação?')) return
    await fetch(endpointDe(item), { method: 'DELETE' })
    setItens(prev => prev.filter(x => x.id !== item.id))
  }

  async function aprovarEmMassa() {
    await Promise.all(
      selecionadas.map(id => {
        const it = itens.find(x => x.id === id)
        if (!it) return Promise.resolve()
        return patchItem(it, { aprovada: true })
      }),
    )
    setSelecionadas([])
    carregar()
  }

  async function excluirEmMassa() {
    if (!confirm(`Excluir ${selecionadas.length} avaliação(ões)?`)) return
    await Promise.all(
      selecionadas.map(id => {
        const it = itens.find(x => x.id === id)
        if (!it) return Promise.resolve()
        return fetch(endpointDe(it), { method: 'DELETE' })
      }),
    )
    setSelecionadas([])
    carregar()
  }

  function toggleSelecao(id: string) {
    setSelecionadas(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvando(true)
    try {
      const payload: Record<string, unknown> = {
        nota: editando.nota,
        titulo: editando.titulo,
        comentario: editando.comentario,
        aprovada: editando.aprovada,
        destaque: editando.destaque,
        ordem: editando.ordem,
      }
      if (editando.tipo === 'produto') {
        payload.nomeAutor = editando.nomeAutor
        payload.resposta = editando.resposta ?? ''
      } else {
        payload.nomeCompleto = editando.nomeAutor
      }
      await patchItem(editando, payload)
    } finally {
      setSalvando(false)
      setEditando(null)
      carregar()
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f2e2b' }}>Avaliações</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Carregando...' : `${countTodas} avaliação(ões) no total`}
          </p>
        </div>
        {selecionadas.length > 0 && (
          <div className="flex gap-2">
            <button onClick={aprovarEmMassa}
              className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 font-bold px-4 py-2 rounded-xl text-sm hover:bg-green-100 transition">
              <Check size={14} /> Aprovar ({selecionadas.length})
            </button>
            <button onClick={excluirEmMassa}
              className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-100 transition">
              <Trash2 size={14} /> Excluir ({selecionadas.length})
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {([
          { key: 'todas',    label: 'Todas',    count: countTodas },
          { key: 'produto',  label: 'Produto',  count: countProduto },
          { key: 'parceiro', label: 'Parceiro', count: countParceiro },
        ] as const).map(t => {
          const ativo = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPaginaAtual(1); setSelecionadas([]) }}
              className="px-4 py-2.5 text-sm font-bold transition relative"
              style={{
                color: ativo ? '#0f2e2b' : '#6b7280',
                borderBottom: ativo ? '2px solid #3cbfb3' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t.label}
              <span
                className="ml-2 inline-flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 min-w-[20px] h-[18px]"
                style={{
                  backgroundColor: ativo ? '#3cbfb3' : '#e5e7eb',
                  color: ativo ? '#ffffff' : '#6b7280',
                }}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide block mb-1">Buscar</label>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filtroBusca}
                onChange={e => { setFiltroBusca(e.target.value); setPaginaAtual(1) }}
                placeholder="Nome, título, comentário ou produto..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide block mb-1">Avaliação</label>
            <select
              value={filtroNota}
              onChange={e => { setFiltroNota(e.target.value); setPaginaAtual(1) }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
            >
              <option value="">Todas as notas</option>
              <option value="5">5 estrelas</option>
              <option value="4">4 estrelas</option>
              <option value="3">3 estrelas</option>
              <option value="2">2 estrelas</option>
              <option value="1">1 estrela</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide block mb-1">Status</label>
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
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-500 font-medium">
              {itensFiltrados.length} resultado{itensFiltrados.length !== 1 ? 's' : ''}
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

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-10 text-sm">Carregando...</p>
        ) : itensFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm mb-3">Nenhuma avaliação encontrada.</p>
            {temFiltros && (
              <button onClick={limparFiltros} className="text-xs text-[#3cbfb3] font-bold hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="min-w-[1100px] grid px-4 py-2.5 border-b border-gray-100 bg-gray-50"
              style={{ gridTemplateColumns: '24px 90px 1fr 1.5fr 90px 1fr 90px 90px 80px 70px 120px', gap: '12px' }}
            >
              <div />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Autor</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Produto / Contexto</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nota</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Título + trecho</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destaque</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ordem</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ações</p>
            </div>

            {itensPaginados.map(av => (
              <div
                key={`${av.tipo}-${av.id}`}
                className="min-w-[1100px] grid px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition items-center"
                style={{ gridTemplateColumns: '24px 90px 1fr 1.5fr 90px 1fr 90px 90px 80px 70px 120px', gap: '12px' }}
              >
                <input
                  type="checkbox"
                  checked={selecionadas.includes(av.id)}
                  onChange={() => toggleSelecao(av.id)}
                  className="w-4 h-4 accent-[#3cbfb3]"
                />

                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border justify-self-start"
                  style={
                    av.tipo === 'produto'
                      ? { backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }
                      : { backgroundColor: '#faf5ff', color: '#7c3aed', borderColor: '#ddd6fe' }
                  }
                >
                  {av.tipo === 'produto'
                    ? <><PackageIcon size={10} /> Produto</>
                    : <><Handshake size={10} /> Parceiro</>
                  }
                </span>

                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs shrink-0"
                    style={{ backgroundColor: av.avatarCor }}
                  >
                    {av.avatarIniciais}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{av.nomeAutor}</p>
                    {av.tipo === 'parceiro' && (av.empresa || av.cargo) && (
                      <p className="text-[10px] text-gray-400 truncate">
                        {[av.cargo, av.empresa].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  {av.contextoHref ? (
                    <Link href={av.contextoHref} className="text-xs text-[#3cbfb3] hover:underline font-medium truncate block">
                      {av.contextoLabel}
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-600 truncate block">{av.contextoLabel}</span>
                  )}
                </div>

                <Estrelas nota={av.nota} />

                <div className="min-w-0">
                  {av.titulo && <p className="text-xs font-bold text-gray-700 truncate">{av.titulo}</p>}
                  <p className="text-[11px] text-gray-500 truncate">{av.comentario}</p>
                </div>

                <p className="text-xs text-gray-500">{new Date(av.createdAt).toLocaleDateString('pt-BR')}</p>

                <div>
                  {av.aprovada
                    ? <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">Aprovada</span>
                    : <span className="bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">Pendente</span>
                  }
                </div>

                <button
                  type="button"
                  onClick={() => toggleDestaque(av)}
                  className="flex items-center justify-center p-1 rounded-lg hover:bg-amber-50 transition"
                  title={av.destaque ? 'Remover destaque' : 'Marcar como destaque'}
                >
                  <Star
                    size={18}
                    className={av.destaque ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-gray-300'}
                  />
                </button>

                <input
                  type="number"
                  defaultValue={av.ordem}
                  onBlur={e => {
                    const v = parseInt(e.target.value) || 0
                    if (v !== av.ordem) salvarOrdem(av, v)
                  }}
                  className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:ring-2 focus:ring-[#3cbfb3] outline-none"
                />

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleAprovada(av)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg transition ${
                      av.aprovada ? 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500' : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                    title={av.aprovada ? 'Reprovar' : 'Aprovar'}
                  >
                    {av.aprovada ? <X size={11} /> : <Check size={11} />}
                  </button>
                  <button
                    onClick={() => setEditando({ ...av })}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-lg transition"
                    title="Editar"
                  >
                    <Edit2 size={11} />
                  </button>
                  <button
                    onClick={() => excluir(av)}
                    className="bg-red-50 hover:bg-red-100 text-red-500 text-[10px] font-bold px-2 py-1 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-5 flex-wrap">
          <button
            onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
            disabled={paginaAtual === 1}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-sm hover:border-[#3cbfb3] disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600"
          >‹</button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-1.5">
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-400 text-sm">…</span>}
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
          >›</button>
          <span className="text-xs text-gray-500 ml-1">
            Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
          </span>
        </div>
      )}

      {/* Modal edição */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 text-lg">
                Editar Avaliação <span className="text-xs font-semibold text-gray-400">· {editando.tipo === 'produto' ? 'Produto' : 'Parceiro'}</span>
              </h4>
              <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Nota</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setEditando(e => e ? { ...e, nota: n } : e)}>
                      <Star size={28} className={n <= editando.nota ? 'fill-[#f59e0b] text-[#f59e0b]' : 'fill-gray-200 text-gray-200'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Nome do Autor</label>
                <input
                  type="text"
                  value={editando.nomeAutor}
                  onChange={e => setEditando(prev => prev ? { ...prev, nomeAutor: e.target.value } : prev)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Título</label>
                <input
                  type="text"
                  value={editando.titulo ?? ''}
                  onChange={e => setEditando(prev => prev ? { ...prev, titulo: e.target.value } : prev)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1.5">Comentário</label>
                <textarea
                  value={editando.comentario ?? ''}
                  onChange={e => setEditando(prev => prev ? { ...prev, comentario: e.target.value } : prev)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none resize-none"
                />
              </div>

              {editando.tipo === 'produto' && (
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1.5">Resposta oficial da Sixxis</label>
                  <textarea
                    value={editando.resposta ?? ''}
                    onChange={e => setEditando(prev => prev ? { ...prev, resposta: e.target.value } : prev)}
                    rows={3}
                    placeholder="Aparece abaixo da avaliação no site público"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none resize-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1.5">Ordem</label>
                  <input
                    type="number"
                    value={editando.ordem}
                    onChange={e => setEditando(prev => prev ? { ...prev, ordem: parseInt(e.target.value) || 0 } : prev)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Menor = aparece primeiro</p>
                </div>
                <div className="flex flex-col gap-2 justify-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editando.aprovada}
                      onChange={e => setEditando(prev => prev ? { ...prev, aprovada: e.target.checked } : prev)}
                      className="w-4 h-4 accent-[#3cbfb3]"
                    />
                    <span className="text-sm font-medium text-gray-700">Aprovada</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editando.destaque}
                      onChange={e => setEditando(prev => prev ? { ...prev, destaque: e.target.checked } : prev)}
                      className="w-4 h-4 accent-[#f59e0b]"
                    />
                    <span className="text-sm font-medium text-gray-700">Destaque</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={salvarEdicao}
                  disabled={salvando}
                  className="flex-1 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2"
                >
                  {salvando ? 'Salvando...' : <><Check size={16} />Salvar</>}
                </button>
                <button
                  onClick={() => setEditando(null)}
                  className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
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
