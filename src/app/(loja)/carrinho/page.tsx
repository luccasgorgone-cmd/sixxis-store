'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, Trash2, Plus, Minus, Tag, ChevronRight,
  ShieldCheck, Truck, Lock, CreditCard, Zap, Package,
  CheckCircle, AlertCircle, X, Star, Clock, BadgeCheck, Headphones
} from 'lucide-react'
import {
  type TipoCupom,
  descricaoCupom, calcularDescontoCupom,
} from '@/lib/preco-cupom'
import { useCarrinho } from '@/hooks/useCarrinho'
import { trackBeginCheckout } from '@/lib/analytics/events'

// ─── TIPOS ───────────────────────────────────────────────────
interface CarrinhoItem {
  id: string
  produtoId?: string
  nome: string
  slug: string
  preco: number
  precoPromocional?: number
  imagem?: string
  variacao?: string
  quantidade: number
}

// ─── HELPER ──────────────────────────────────────────────────
const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

// Normaliza item do formato Zustand persist → CarrinhoItem
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeZustandItem(i: any): CarrinhoItem {
  const idBase = String(i.produtoId || i.id || '')
  const varSuffix = i.variacaoId ? `-${i.variacaoId}` : ''
  return {
    id: (i.id && !i.produtoId) ? i.id : idBase + varSuffix,
    produtoId: i.produtoId || i.id,
    nome: i.nome || '',
    slug: i.slug || i.produtoId || i.id || '',
    preco: i.precoOriginal ?? i.preco ?? 0,
    precoPromocional: i.precoOriginal ? (i.preco ?? undefined) : i.precoPromocional,
    imagem: i.imagem,
    variacao: i.variacaoNome || i.variacaoId || i.variacao,
    quantidade: i.quantidade ?? 1,
  }
}

// Converte CarrinhoItem → formato Zustand persist (para drawer funcionar)
function toZustandItem(i: CarrinhoItem) {
  return {
    id: i.id,
    produtoId: i.produtoId || i.id,
    nome: i.nome,
    slug: i.slug,
    preco: i.precoPromocional ?? i.preco,
    precoOriginal: i.precoPromocional ? i.preco : undefined,
    precoPromocional: i.precoPromocional,
    quantidade: i.quantidade,
    imagem: i.imagem,
    variacaoNome: i.variacao,
    variacaoId: undefined as string | undefined,
  }
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────
export default function CarrinhoPage() {
  const router = useRouter()
  const [itens, setItens] = useState<CarrinhoItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [cupomInput, setCupomInput] = useState('')
  const cupomAplicado = useCarrinho((s) => s.cupomAplicado)
  const setCupomGlobal = useCarrinho((s) => s.setCupom)
  const [cupomErro, setCupomErro] = useState('')
  const [aplicandoCupom, setAplicandoCupom] = useState(false)
  const [cepInput, setCepInput] = useState('')
  const [freteOpcoes, setFreteOpcoes] = useState<Array<{
    id: string; nome: string; prazo: string; preco: number
  }>>([])
  const [freteSelecionado, setFreteSelecionado] = useState<{
    id: string; nome: string; prazo: string; preco: number
  } | null>(null)
  const [calculandoFrete, setCalculandoFrete] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recomendados, setRecomendados] = useState<any[]>([])

  // ── CARREGAR CARRINHO DO LOCALSTORAGE ──────────────────────
  useEffect(() => {
    const lerCarrinho = () => {
      try {
        const raw = localStorage.getItem('sixxis-carrinho')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            // Formato array puro (novo formato / testes)
            setItens(parsed)
          } else if (parsed?.state?.itens && Array.isArray(parsed.state.itens)) {
            // Formato Zustand persist: {"state":{"itens":[...]},"version":0}
            setItens(parsed.state.itens.map(normalizeZustandItem))
          }
        }
      } catch (e) {
        console.error('Erro ao ler carrinho:', e)
      }
      setCarregando(false)
    }

    lerCarrinho()

    // CEP salvo (descarta valor dummy "16015-480")
    const cepSalvo = localStorage.getItem('sixxis_cep') || ''
    if (cepSalvo && !/^16015-?480$/.test(cepSalvo)) {
      setCepInput(cepSalvo)
    } else if (cepSalvo) {
      localStorage.removeItem('sixxis_cep')
    }

    // Ouvir evento de atualização do carrinho (quando drawer adiciona item)
    window.addEventListener('carrinho-atualizado', lerCarrinho)
    window.addEventListener('storage', lerCarrinho)
    return () => {
      window.removeEventListener('carrinho-atualizado', lerCarrinho)
      window.removeEventListener('storage', lerCarrinho)
    }
  }, [])

  // ── CARREGAR RECOMENDADOS ─────────────────────────────────
  useEffect(() => {
    fetch('/api/produtos?limit=4')
      .then(r => r.json())
      .then(d => setRecomendados(d.produtos?.slice(0, 4) || []))
      .catch(() => {})
  }, [])

  // ── SALVAR CARRINHO ───────────────────────────────────────
  // Escreve em formato Zustand persist para manter o drawer em sincronia
  const salvarCarrinho = useCallback((novosItens: CarrinhoItem[]) => {
    setItens(novosItens)
    const zustandData = {
      state: { itens: novosItens.map(toZustandItem) },
      version: 0,
    }
    localStorage.setItem('sixxis-carrinho', JSON.stringify(zustandData))
    window.dispatchEvent(new Event('carrinho-atualizado'))
  }, [])

  // ── ALTERAR QUANTIDADE ────────────────────────────────────
  const alterarQtd = (id: string, delta: number) => {
    salvarCarrinho(
      itens.map(item =>
        item.id !== id ? item
          : { ...item, quantidade: Math.max(1, Math.min(99, item.quantidade + delta)) }
      )
    )
  }

  // ── REMOVER ITEM ──────────────────────────────────────────
  const removerItem = (id: string) => {
    salvarCarrinho(itens.filter(item => item.id !== id))
  }

  // ── APLICAR CUPOM ─────────────────────────────────────────
  const aplicarCupom = async () => {
    if (!cupomInput.trim()) return
    setAplicandoCupom(true)
    setCupomErro('')
    try {
      const res = await fetch('/api/cupons/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: cupomInput.trim().toUpperCase(),
          total: subtotal
        })
      })
      const data = await res.json()
      if (!res.ok || data.error || data.valido === false) {
        setCupomErro(data.error || data.erro || 'Cupom inválido ou expirado.')
      } else {
        const tipo: TipoCupom = data.tipo || 'PERCENTUAL'
        const valor = Number(data.valor) || 0
        const desconto = Number(data.desconto) || calcularDescontoCupom(tipo, valor, subtotal)
        setCupomGlobal({
          codigo: data.codigo || cupomInput.trim().toUpperCase(),
          tipo,
          valor,
          desconto,
          descricao: descricaoCupom(tipo, valor),
        })
        setCupomErro('')
      }
    } catch {
      const c = cupomInput.trim().toUpperCase()
      if (c === 'SIXXIS10') {
        const desconto = calcularDescontoCupom('PERCENTUAL', 10, subtotal)
        setCupomGlobal({
          codigo: 'SIXXIS10',
          tipo: 'PERCENTUAL',
          valor: 10,
          desconto,
          descricao: '10% OFF na primeira compra',
        })
        setCupomErro('')
      } else {
        setCupomErro('Cupom inválido ou expirado.')
      }
    }
    setAplicandoCupom(false)
  }

  // ── CALCULAR FRETE ────────────────────────────────────────
  const calcularFrete = async () => {
    const cepLimpo = cepInput.replace(/\D/g, '')
    if (cepLimpo.length < 8) return
    setCalculandoFrete(true)
    try {
      const res = await fetch(`/api/frete?cep=${cepLimpo}&total=${subtotal}`)
      const data = await res.json()
      if (data.opcoes?.length) {
        setFreteOpcoes(data.opcoes)
        if (data.opcoes[0]) setFreteSelecionado(data.opcoes[0])
      } else {
        throw new Error('sem opcoes')
      }
      localStorage.setItem('sixxis_cep', cepLimpo)
    } catch {
      const pac = { id: 'pac', nome: 'PAC — Correios', prazo: '3 a 5 dias úteis', preco: subtotal >= 500 ? 0 : 18.90 }
      const sedex = { id: 'sedex', nome: 'SEDEX — Correios', prazo: '1 a 2 dias úteis', preco: 32.90 }
      setFreteOpcoes([pac, sedex])
      setFreteSelecionado(pac)
      localStorage.setItem('sixxis_cep', cepLimpo)
    }
    setCalculandoFrete(false)
  }

  // ── CÁLCULOS ──────────────────────────────────────────────
  const subtotal = itens.reduce(
    (s, i) => s + (i.precoPromocional ?? i.preco) * i.quantidade, 0
  )
  const descontoCupom = cupomAplicado
    ? calcularDescontoCupom(cupomAplicado.tipo, cupomAplicado.valor, subtotal)
    : 0
  const valorFrete = freteSelecionado?.preco ?? 0
  const totalFinal = subtotal - descontoCupom + valorFrete
  const totalPix = totalFinal * 0.97

  const totalItens = itens.reduce((s, i) => s + i.quantidade, 0)

  // ── FINALIZAR COMPRA (track + push) ───────────────────────
  const handleCheckout = () => {
    trackBeginCheckout(
      itens.map(i => ({
        item_id: i.produtoId || i.id,
        item_name: i.nome,
        item_brand: 'Sixxis',
        price: i.precoPromocional ?? i.preco,
        quantity: i.quantidade,
        variant: i.variacao,
      })),
      totalFinal,
      cupomAplicado?.codigo,
    )
    router.push('/checkout')
  }

  // ── LOADING ───────────────────────────────────────────────
  if (carregando) {
    return (
      <div style={{ backgroundColor: '#f8fafc' }} className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full animate-spin"
          style={{ border: '3px solid #e5e7eb', borderTopColor: '#3cbfb3' }} />
      </div>
    )
  }

  // ── EMPTY STATE ───────────────────────────────────────────
  if (itens.length === 0) {
    return (
      <div style={{ backgroundColor: '#f8fafc' }} className="min-h-[70vh] flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#e8f8f7' }}>
            <ShoppingCart size={40} style={{ color: '#3cbfb3' }} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Seu carrinho está vazio</h1>
          <p className="text-gray-400 text-sm mb-8">
            Adicione produtos para continuar com a compra
          </p>
          <Link href="/produtos"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-black text-base transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}>
            <Zap size={18} /> Explorar produtos
          </Link>
          <p className="text-xs text-gray-400 mt-6">
            Use o cupom <span className="font-bold text-[#3cbfb3]">SIXXIS10</span> para 10% OFF na primeira compra
          </p>
        </div>
      </div>
    )
  }

  // ── RENDER PRINCIPAL ──────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#f8fafc' }} className="min-h-screen pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#3cbfb3] transition-colors">Início</Link>
          <ChevronRight size={13} />
          <span className="text-gray-700 font-semibold">Carrinho</span>
        </nav>

        {/* TÍTULO */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-black text-gray-900">Meu Carrinho</h1>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: '#3cbfb3' }}>
            {totalItens} {totalItens === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {/* LAYOUT 2 COLUNAS */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ════ COLUNA ESQUERDA ════ */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* LISTA DE ITENS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {itens.map(item => {
                  const precoUnit = item.precoPromocional ?? item.preco
                  const precoTotal = precoUnit * item.quantidade
                  const temDesconto = item.precoPromocional && item.precoPromocional < item.preco
                  const pctDesc = temDesconto
                    ? Math.round((1 - item.precoPromocional! / item.preco) * 100)
                    : 0

                  return (
                    <div key={item.id} className="flex gap-4 p-5 hover:bg-gray-50/50 transition-colors">

                      {/* IMAGEM */}
                      <Link href={item.slug ? `/produtos/${item.slug}` : '#'}
                        className="shrink-0 w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-xl overflow-hidden
                                   bg-gray-50 border border-gray-100 hover:border-[#3cbfb3]/40 transition-colors">
                        {item.imagem ? (
                          <img src={item.imagem} alt={item.nome}
                            className="w-full h-full object-contain p-2"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-gray-300" />
                          </div>
                        )}
                      </Link>

                      {/* DETALHES */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <Link href={item.slug ? `/produtos/${item.slug}` : '#'}
                              className="text-sm font-bold text-gray-900 hover:text-[#3cbfb3] transition-colors line-clamp-2 leading-snug">
                              {item.nome}
                            </Link>
                            {item.variacao && (
                              <span className="inline-block mt-1.5 text-xs text-gray-500
                                               bg-gray-100 px-2 py-0.5 rounded-full">
                                Voltagem: {item.variacao}
                              </span>
                            )}
                          </div>
                          <button onClick={() => removerItem(item.id)}
                            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg text-gray-300
                                       hover:text-red-500 hover:bg-red-50 transition-all"
                            aria-label="Remover item">
                            <X size={18} />
                          </button>
                        </div>

                        <div className="flex items-end justify-between mt-3 flex-wrap gap-2">
                          {/* PREÇO */}
                          <div>
                            {temDesconto && (
                              <p className="text-xs text-gray-400 line-through leading-none mb-0.5">
                                {fmtBRL(item.preco * item.quantidade)}
                              </p>
                            )}
                            <div className="flex items-baseline gap-1.5">
                              <p className="text-lg font-black text-gray-900">
                                {fmtBRL(precoTotal)}
                              </p>
                              {temDesconto && (
                                <span className="text-[10px] font-black text-white
                                                 bg-red-500 px-1.5 py-0.5 rounded-full leading-none">
                                  -{pctDesc}%
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {fmtBRL(precoUnit)} / unidade
                            </p>
                          </div>

                          {/* CONTROLE DE QUANTIDADE */}
                          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                            <button onClick={() => alterarQtd(item.id, -1)}
                              disabled={item.quantidade <= 1}
                              className="w-11 h-11 rounded-lg flex items-center justify-center text-gray-500
                                         hover:text-gray-900 hover:bg-white disabled:opacity-30 transition-all">
                              <Minus size={16} />
                            </button>
                            <span className="w-9 text-center text-sm font-black text-gray-900">
                              {item.quantidade}
                            </span>
                            <button onClick={() => alterarQtd(item.id, 1)}
                              disabled={item.quantidade >= 99}
                              className="w-11 h-11 rounded-lg flex items-center justify-center text-gray-500
                                         hover:text-gray-900 hover:bg-white disabled:opacity-30 transition-all">
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CUPOM */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-4">
                <Tag size={14} style={{ color: '#3cbfb3' }} />
                Cupom de desconto
              </h3>

              {cupomAplicado ? (
                <div className="flex items-center justify-between bg-emerald-50
                                border border-emerald-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-black text-emerald-800">{cupomAplicado.codigo}</p>
                      <p className="text-xs text-emerald-600">{cupomAplicado.descricao}</p>
                    </div>
                  </div>
                  <button onClick={() => { setCupomGlobal(null); setCupomInput('') }}
                    className="text-emerald-400 hover:text-red-500 transition-colors p-1">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Tag size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={cupomInput}
                        onChange={e => setCupomInput(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && aplicarCupom()}
                        placeholder="CÓDIGO DO CUPOM"
                        className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl text-sm
                                   font-mono font-bold tracking-widest uppercase
                                   focus:outline-none focus:border-[#3cbfb3] focus:ring-2
                                   focus:ring-[#3cbfb3]/20 transition-all"
                      />
                    </div>
                    <button onClick={aplicarCupom}
                      disabled={!cupomInput.trim() || aplicandoCupom}
                      className="shrink-0 whitespace-nowrap px-4 sm:px-5 py-3 rounded-xl font-bold text-sm transition-all
                                 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}>
                      {aplicandoCupom ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {cupomErro && (
                    <p className="text-xs text-red-500 flex items-center gap-1.5 mt-2">
                      <AlertCircle size={12} />{cupomErro}
                    </p>
                  )}
                  <button onClick={() => setCupomInput('SIXXIS10')}
                    className="mt-2 text-xs text-[#3cbfb3] hover:underline">
                    Primeira compra? Use <strong>SIXXIS10</strong> para 10% OFF →
                  </button>
                </>
              )}
            </div>

            {/* FRETE */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-4">
                <Truck size={14} style={{ color: '#3cbfb3' }} />
                Calcular frete
              </h3>

              <div className="flex gap-2 mb-3">
                <input
                  value={cepInput}
                  onChange={e => setCepInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={e => e.key === 'Enter' && calcularFrete()}
                  placeholder="00000-000"
                  maxLength={9}
                  className="flex-1 min-w-0 px-4 py-3 border border-gray-200 rounded-xl text-sm
                             font-mono focus:outline-none focus:border-[#3cbfb3]
                             focus:ring-2 focus:ring-[#3cbfb3]/20 transition-all"
                />
                <button onClick={calcularFrete}
                  disabled={cepInput.replace(/\D/g, '').length < 8 || calculandoFrete}
                  className="shrink-0 whitespace-nowrap px-4 sm:px-5 py-3 rounded-xl font-bold text-sm transition-all
                             hover:shadow-md disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}>
                  {calculandoFrete ? '...' : 'Calcular'}
                </button>
              </div>

              {subtotal >= 500 && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 mb-2">
                  <CheckCircle size={12} />
                  Frete grátis (PAC) para pedidos acima de R$ 500!
                </div>
              )}

              {freteOpcoes.length > 0 && (
                <div className="space-y-2 mt-3">
                  {freteOpcoes.map(op => (
                    <label key={op.id}
                      className={`flex items-center justify-between p-3 rounded-xl border-2
                                  cursor-pointer transition-all ${
                        freteSelecionado?.id === op.id
                          ? 'border-[#3cbfb3] bg-[#3cbfb3]/5'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="frete" className="accent-[#3cbfb3]"
                          checked={freteSelecionado?.id === op.id}
                          onChange={() => setFreteSelecionado(op)} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{op.nome}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={10} /> {op.prazo}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm font-black ${op.preco === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {op.preco === 0 ? 'Grátis' : fmtBRL(op.preco)}
                      </p>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* VOCÊ TAMBÉM PODE GOSTAR */}
            {recomendados.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Star size={14} style={{ color: '#3cbfb3' }} />
                  Você também pode gostar
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {recomendados.map((p: any) => (
                    <Link key={p.id} href={`/produtos/${p.slug}`}
                      className="group flex flex-col rounded-xl border border-gray-100
                                 hover:border-[#3cbfb3]/40 hover:shadow-md transition-all overflow-hidden bg-gray-50">
                      <div className="aspect-square bg-white p-2 overflow-hidden">
                        {p.imagens?.[0] ? (
                          <img src={p.imagens[0]} alt={p.nome}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 flex-1">
                        <p className="text-xs font-semibold text-gray-700 line-clamp-2 leading-snug mb-1">
                          {p.nome}
                        </p>
                        <p className="text-sm font-black" style={{ color: '#3cbfb3' }}>
                          {fmtBRL(Number(p.precoPromocional || p.preco))}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ════ COLUNA DIREITA — RESUMO STICKY ════ */}
          <div className="w-full lg:w-[360px] shrink-0 space-y-4">

            {/* RESUMO DO PEDIDO */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:sticky lg:top-24">
              <h3 className="text-sm font-black text-gray-900 mb-5">Resumo do pedido</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Subtotal ({totalItens} {totalItens === 1 ? 'item' : 'itens'})
                  </span>
                  <span className="font-semibold text-gray-900">{fmtBRL(subtotal)}</span>
                </div>
                {cupomAplicado && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Tag size={11} /> {cupomAplicado.codigo}
                    </span>
                    <span className="font-bold text-emerald-600">
                      -{fmtBRL(descontoCupom)}
                    </span>
                  </div>
                )}
                {freteSelecionado ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Frete</span>
                    <span className={`font-semibold ${freteSelecionado.preco === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {freteSelecionado.preco === 0 ? 'Grátis' : fmtBRL(freteSelecionado.preco)}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Frete</span>
                    <span className="text-xs text-gray-400">Calcule acima</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 mb-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-black text-gray-900 text-base">Total</span>
                  <span className="text-2xl font-black text-gray-900">{fmtBRL(totalFinal)}</span>
                </div>
                <p className="text-xs font-semibold text-right" style={{ color: '#3cbfb3' }}>
                  {fmtBRL(totalPix)} no PIX (3% OFF)
                </p>
                <p className="text-xs text-gray-400 text-center mt-2">
                  ou 6× de {fmtBRL(totalFinal / 6)} sem juros
                </p>
              </div>

              {/* FINALIZAR COMPRA */}
              <button
                onClick={handleCheckout}
                className="w-full py-4 rounded-xl font-black text-base flex items-center
                           justify-center gap-2 transition-all hover:shadow-lg
                           hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] mb-3"
                style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}>
                <CreditCard size={18} /> Finalizar compra
              </button>

              <Link href="/produtos"
                className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
                ← Continuar comprando
              </Link>

              {/* TRUST BADGES — 6 selos definitivos */}
              <div className="mt-5 pt-4 border-t border-gray-50 grid grid-cols-2 gap-2">
                {[
                  { icon: ShieldCheck, titulo: '12 meses de garantia',       sub: 'Garantia real e documentada' },
                  { icon: Truck,       titulo: 'Entrega para todo o Brasil', sub: 'Grátis acima de R$ 500' },
                  { icon: Lock,        titulo: 'Compra 100% segura',         sub: 'SSL 256-bit + Antifraude' },
                  { icon: CreditCard,  titulo: '6x sem juros',               sub: 'No cartão de crédito' },
                  { icon: BadgeCheck,  titulo: 'Produto 100% original',      sub: 'Direto da fábrica' },
                  { icon: Headphones,  titulo: 'Suporte especializado',      sub: 'Seg–Sex 8h às 18h' },
                ].map(({ icon: Icon, titulo, sub }) => (
                  <div key={titulo} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-white">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-[#3cbfb3]/10 flex items-center justify-center">
                      <Icon size={15} className="text-[#3cbfb3]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 leading-tight">{titulo}</p>
                      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD CASHBACK */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#e8f8f7' }}>
                  <Zap size={18} style={{ color: '#3cbfb3' }} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">
                    Ganhe cashback nesta compra
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Acumule 2% a 7% de volta no programa Sixxis Club
                  </p>
                </div>
              </div>
            </div>

            {/* PARCELAMENTO INFO */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#e8f8f7' }}>
                  <CreditCard size={18} style={{ color: '#3cbfb3' }} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">
                    Parcele sem juros
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Em até 6× no cartão de crédito · Débito e PIX aceitos
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
