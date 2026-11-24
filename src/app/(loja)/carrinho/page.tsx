'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, Trash2, Plus, Minus, Tag, ChevronRight,
  Truck, CreditCard, Zap, Package,
  CheckCircle, AlertCircle, X, Star, Clock, Coins
} from 'lucide-react'
import {
  type TipoCupom,
  descricaoCupom,
} from '@/lib/preco-cupom'
import { calcularPromoCliente } from '@/lib/promo-segunda-unidade'
import { useCarrinho } from '@/hooks/useCarrinho'
import { type CarrinhoItem, normalizeZustandItem, toZustandItem } from '@/lib/carrinho-pagina'
import { validarCupomRemoto } from '@/lib/cupom-client'
import { useRevalidarCupomPersistido } from '@/hooks/useRevalidarCupom'
import UsarCashback from '@/components/checkout/UsarCashback'
import SelosConfianca from '@/components/checkout/SelosConfianca'
import { FRETE_COPY } from '@/lib/copy/frete'
import {
  soDigitosCep, cepValido, montarProdutosFrete, normalizarRespostaFrete,
} from '@/lib/frete-estimativa'
import { MAX_PARCELAS_SEM_JUROS, valorParcela } from '@/lib/parcelamento'
import { precoPix, DESCONTO_PIX_PCT } from '@/lib/preco-pix'

// ─── HELPER ──────────────────────────────────────────────────
const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

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
  const [freteStatus, setFreteStatus] = useState<'ok' | 'a_combinar' | 'bloqueado' | null>(null)
  const [freteMsg, setFreteMsg] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recomendados, setRecomendados] = useState<any[]>([])
  // Cashback aplicável (R$) reportado pelo toggle — sincronizado com o checkout.
  const [cashbackCart, setCashbackCart] = useState(0)

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
      // Real: hidrata o input de CEP a partir do localStorage no mount. Refatorar
      // para tirar o setState do efeito exige mudar onde o valor inicial do
      // input é lido (fora do escopo desta limpeza de cupom) — não mascarar de novo.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // Grava pelo PRÓPRIO store (o persist escreve o localStorage preservando cupom
  // e cashback). Escrever o localStorage à mão deixava o drawer/checkout com a
  // quantidade antiga em memória e apagava variacaoId/feedId/cupom do item.
  const salvarCarrinho = useCallback((novosItens: CarrinhoItem[]) => {
    setItens(novosItens)
    useCarrinho.setState({ itens: novosItens.map(toZustandItem) })
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
    // Falha de rede/429 NÃO concede desconto: só o servidor (avaliarCupom) decide
    // se um cupom é válido, qual o percentual e se a 1ª compra se aplica.
    const itensCupom = itens.map(i => ({
      produtoId:     i.produtoId ?? i.id,
      precoUnitario: i.preco,
      quantidade:    i.quantidade,
    }))
    const r = await validarCupomRemoto(cupomInput, subtotal, itensCupom)
    if (r.estado === 'valido') {
      limparAvisoCupom()
      setCupomGlobal({
        codigo:    r.cupom.codigo,
        tipo:      r.cupom.tipo,
        valor:     r.cupom.valor,
        desconto:  r.cupom.desconto,
        descricao: descricaoCupom(r.cupom.tipo, r.cupom.valor),
      })
      setCupomErro('')
    } else {
      setCupomErro(r.erro)
    }
    setAplicandoCupom(false)
  }

  // ── CALCULAR FRETE ────────────────────────────────────────
  const calcularFrete = async () => {
    const cepLimpo = soDigitosCep(cepInput)
    if (!cepValido(cepLimpo) || itens.length === 0) return
    setCalculandoFrete(true)
    setFreteStatus(null)
    setFreteMsg('')
    setFreteOpcoes([])
    setFreteSelecionado(null)
    try {
      // Fonte única: /api/frete → resolverFrete (tabela produto × UF + carriers).
      // A UF é derivada do CEP no servidor; montagem/normalização em frete-estimativa.
      const res = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cepDestino: cepLimpo,
          produtos: montarProdutosFrete(itens),
        }),
      })
      const norm = normalizarRespostaFrete(await res.json())
      setFreteStatus(norm.status)
      setFreteMsg(norm.mensagem)
      if (norm.status === 'ok') {
        setFreteOpcoes(norm.opcoes)
        if (norm.opcoes[0]) setFreteSelecionado(norm.opcoes[0])
      }
      localStorage.setItem('sixxis_cep', cepLimpo)
    } catch {
      setFreteStatus('bloqueado')
      setFreteMsg('Não foi possível calcular o frete. Tente novamente.')
    }
    setCalculandoFrete(false)
  }

  // ── CÁLCULOS ──────────────────────────────────────────────
  const subtotal = itens.reduce(
    (s, i) => s + (i.precoPromocional ?? i.preco) * i.quantidade, 0
  )
  // Cupom persistido pode ter sido desativado/alterado depois de aplicado:
  // reconfirma com o servidor e remove sozinho se não valer mais.
  const { aviso: avisoCupom, limparAviso: limparAvisoCupom } = useRevalidarCupomPersistido(subtotal)

  // Desconto do cupom = valor ESCOPADO que o servidor calculou (avaliarCupom),
  // NUNCA 10% recalculado sobre o carrinho inteiro. Cupom de modelo único
  // (produtoIds) incide só no subtotal dos itens elegíveis; recalcular por % aqui
  // dava desconto no carrinho todo. useRevalidarCupomPersistido mantém esse
  // número em dia quando a quantidade muda. Clampa ao subtotal por segurança.
  const descontoCupom = cupomAplicado
    ? Math.min(cupomAplicado.desconto, subtotal)
    : 0
  // Promo "2ª unidade" (exibição; servidor é autoritativo). Ativa → não acumula
  // com cupom: o desconto vem da promo e o campo de cupom fica bloqueado.
  const promo = calcularPromoCliente(
    itens.map((i) => ({ feedId: i.feedId ?? i.slug, preco: i.precoPromocional ?? i.preco, quantidade: i.quantidade })),
  )
  const cupomBloqueado = promo.ativo
  const descontoEfetivo = promo.ativo ? Math.min(promo.desconto, subtotal) : descontoCupom
  const valorFrete = freteSelecionado?.preco ?? 0
  // Cashback aplicável só faz sentido sobre produtos; nunca deixa o total < 0.
  const cashbackAplicado = Math.min(cashbackCart, subtotal - descontoEfetivo)
  const totalFinal = Math.max(0, subtotal - descontoEfetivo + valorFrete - cashbackAplicado)
  const totalPix = precoPix(totalFinal)

  const totalItens = itens.reduce((s, i) => s + i.quantidade, 0)

  // ── FINALIZAR COMPRA ──────────────────────────────────────
  // begin_checkout / InitiateCheckout NÃO dispara mais aqui: passou a disparar
  // 1x no mount de /checkout (cobre todos os caminhos de entrada, não só este
  // botão, e evita disparo duplicado no caminho carrinho→checkout).
  const handleCheckout = () => {
    router.push('/checkout')
  }

  // ── LOADING ───────────────────────────────────────────────
  if (carregando) {
    return (
      <div style={{ backgroundColor: 'var(--sx-bg)' }} className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full animate-spin"
          style={{ border: '3px solid #e5e7eb', borderTopColor: 'var(--sx-accent)' }} />
      </div>
    )
  }

  // ── EMPTY STATE ───────────────────────────────────────────
  if (itens.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--sx-bg)' }} className="min-h-[70vh] flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#e8f8f7' }}>
            <ShoppingCart size={40} style={{ color: 'var(--sx-accent-text)' }} />
          </div>
          <h1 className="text-2xl font-black text-sx-text mb-2">Seu carrinho está vazio</h1>
          <p className="text-sx-subtle text-sm mb-8">
            Adicione produtos para continuar com a compra
          </p>
          <Link href="/produtos"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-black text-base transition-all hover:shadow-lg hover:-translate-y-0.5 bg-sx-accent hover:bg-sx-accent-hover text-[#032E28]">
            <Zap size={18} /> Explorar produtos
          </Link>
        </div>
      </div>
    )
  }

  // ── RENDER PRINCIPAL ──────────────────────────────────────
  return (
    <div style={{ backgroundColor: 'var(--sx-bg)' }} className="min-h-screen pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-sm text-sx-subtle mb-6">
          <Link href="/" className="hover:text-sx-accent-text transition-colors">Início</Link>
          <ChevronRight size={13} />
          <span className="text-sx-text-2 font-semibold">Carrinho</span>
        </nav>

        {/* TÍTULO */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-black text-sx-text">Meu Carrinho</h1>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-sx-ink"
            style={{ backgroundColor: 'var(--sx-accent)' }}>
            {totalItens} {totalItens === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {/* LAYOUT 2 COLUNAS */}
        {/* Em coluna (abaixo de lg) os filhos precisam esticar: com items-start a
            coluna da esquerda ficava com a largura do próprio conteúdo (~434 px) e
            passava da tela no celular, cortando o "+" da quantidade e o frete. */}
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">

          {/* ════ COLUNA ESQUERDA ════ */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* LISTA DE ITENS */}
            <div className="bg-sx-surface rounded-2xl border border-sx-line shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {itens.map(item => {
                  const precoUnit = item.precoPromocional ?? item.preco
                  const precoTotal = precoUnit * item.quantidade
                  const temDesconto = item.precoPromocional && item.precoPromocional < item.preco
                  const pctDesc = temDesconto
                    ? Math.round((1 - item.precoPromocional! / item.preco) * 100)
                    : 0

                  return (
                    <div key={item.id} className="flex gap-4 p-5 hover:bg-sx-raised/50 transition-colors">

                      {/* IMAGEM */}
                      <Link href={item.slug ? `/produtos/${item.slug}` : '#'}
                        className="shrink-0 w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-xl overflow-hidden
                                   bg-sx-stage border border-[#e6e9e4] hover:border-sx-accent/40 transition-colors">
                        {item.imagem ? (
                          <img src={item.imagem} alt={item.nome}
                            className="w-full h-full object-contain p-2"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-sx-subtle" />
                          </div>
                        )}
                      </Link>

                      {/* DETALHES */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <Link href={item.slug ? `/produtos/${item.slug}` : '#'}
                              className="text-sm font-bold text-sx-text hover:text-sx-accent-text transition-colors line-clamp-2 leading-snug">
                              {item.nome}
                            </Link>
                            {item.variacao && (
                              <span className="inline-block mt-1.5 text-xs text-sx-muted
                                               bg-sx-raised px-2 py-0.5 rounded-full">
                                Voltagem: {item.variacao}
                              </span>
                            )}
                          </div>
                          <button onClick={() => removerItem(item.id)}
                            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg text-sx-subtle
                                       hover:text-red-500 hover:bg-red-50 transition-all"
                            aria-label="Remover item">
                            <X size={18} />
                          </button>
                        </div>

                        <div className="flex items-end justify-between mt-3 flex-wrap gap-2">
                          {/* PREÇO */}
                          <div>
                            {temDesconto && (
                              <p className="text-xs text-sx-subtle line-through leading-none mb-0.5">
                                {fmtBRL(item.preco * item.quantidade)}
                              </p>
                            )}
                            <div className="flex items-baseline gap-1.5">
                              <p className="text-lg font-black text-sx-text">
                                {fmtBRL(precoTotal)}
                              </p>
                              {temDesconto && (
                                <span className="text-[10px] font-black text-white
                                                 bg-red-500 px-1.5 py-0.5 rounded-full leading-none">
                                  -{pctDesc}%
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-sx-subtle mt-0.5">
                              {fmtBRL(precoUnit)} / unidade
                            </p>
                          </div>

                          {/* CONTROLE DE QUANTIDADE */}
                          <div className="flex items-center gap-1 bg-sx-raised rounded-xl p-1">
                            <button onClick={() => alterarQtd(item.id, -1)}
                              disabled={item.quantidade <= 1}
                              className="w-11 h-11 rounded-lg flex items-center justify-center text-sx-muted
                                         hover:text-sx-text hover:bg-white/10 disabled:opacity-30 transition-all">
                              <Minus size={16} />
                            </button>
                            <span className="w-9 text-center text-sm font-black text-sx-text">
                              {item.quantidade}
                            </span>
                            <button onClick={() => alterarQtd(item.id, 1)}
                              disabled={item.quantidade >= 99}
                              className="w-11 h-11 rounded-lg flex items-center justify-center text-sx-muted
                                         hover:text-sx-text hover:bg-white/10 disabled:opacity-30 transition-all">
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
            <div className="bg-sx-surface rounded-2xl border border-sx-line shadow-sm p-5">
              <h3 className="text-sm font-black text-sx-text flex items-center gap-2 mb-4">
                <Tag size={14} style={{ color: 'var(--sx-accent-text)' }} />
                Cupom de desconto
              </h3>

              {avisoCupom && !cupomAplicado && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
                  {avisoCupom}
                </p>
              )}

              {cupomBloqueado ? (
                <p className="text-xs text-sx-muted bg-sx-raised border border-sx-line rounded-xl px-4 py-3">
                  {promo.descricao ?? 'Promo'} aplicada — não acumula com cupom.
                </p>
              ) : cupomAplicado ? (
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
                      <Tag size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sx-subtle" />
                      <input
                        value={cupomInput}
                        onChange={e => setCupomInput(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && aplicarCupom()}
                        placeholder="CÓDIGO DO CUPOM"
                        className="w-full pl-9 pr-3 py-3 border border-sx-line rounded-xl text-sm
                                   font-mono font-bold tracking-widest uppercase
                                   focus:outline-none focus:border-sx-accent focus:ring-2
                                   focus:ring-sx-accent/20 transition-all"
                      />
                    </div>
                    <button onClick={aplicarCupom}
                      disabled={!cupomInput.trim() || aplicandoCupom}
                      className="shrink-0 whitespace-nowrap px-4 sm:px-5 py-3 rounded-xl font-bold text-sm transition-all
                                 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed
                                 bg-sx-accent hover:bg-sx-accent-hover text-[#032E28]">
                      {aplicandoCupom ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {cupomErro && (
                    <p className="text-xs text-red-500 flex items-center gap-1.5 mt-2">
                      <AlertCircle size={12} />{cupomErro}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* FRETE */}
            <div className="bg-sx-surface rounded-2xl border border-sx-line shadow-sm p-5">
              <h3 className="text-sm font-black text-sx-text flex items-center gap-2 mb-4">
                <Truck size={14} style={{ color: 'var(--sx-accent-text)' }} />
                {FRETE_COPY.calcular}
              </h3>

              <div className="flex gap-2 mb-3">
                <input
                  value={cepInput}
                  onChange={e => setCepInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={e => e.key === 'Enter' && calcularFrete()}
                  placeholder="00000-000"
                  maxLength={9}
                  className="flex-1 min-w-0 px-4 py-3 border border-sx-line rounded-xl text-sm
                             font-mono focus:outline-none focus:border-sx-accent
                             focus:ring-2 focus:ring-sx-accent/20 transition-all"
                />
                <button onClick={calcularFrete}
                  disabled={cepInput.replace(/\D/g, '').length < 8 || calculandoFrete}
                  className="shrink-0 whitespace-nowrap px-4 sm:px-5 py-3 rounded-xl font-bold text-sm transition-all
                             hover:shadow-md disabled:opacity-50
                             bg-sx-accent hover:bg-sx-accent-hover text-[#032E28]">
                  {calculandoFrete ? FRETE_COPY.calculando : FRETE_COPY.calcular}
                </button>
              </div>

              {freteOpcoes.length > 0 && (
                <div className="space-y-2 mt-3">
                  {freteOpcoes.map(op => (
                    <label key={op.id}
                      className={`flex items-center justify-between p-3 rounded-xl border-2
                                  cursor-pointer transition-all ${
                        freteSelecionado?.id === op.id
                          ? 'border-sx-accent bg-sx-accent/5'
                          : 'border-sx-line hover:border-sx-line'
                      }`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="frete" className="accent-sx-accent"
                          checked={freteSelecionado?.id === op.id}
                          onChange={() => setFreteSelecionado(op)} />
                        <div>
                          <p className="text-sm font-semibold text-sx-text">{op.nome}</p>
                          {op.prazo && (
                            <p className="text-xs text-sx-subtle flex items-center gap-1">
                              <Clock size={10} /> {op.prazo}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm font-black ${op.preco === 0 ? 'text-emerald-600' : 'text-sx-text'}`}>
                        {op.preco === 0 ? FRETE_COPY.gratisPreco : fmtBRL(op.preco)}
                      </p>
                    </label>
                  ))}
                </div>
              )}

              {!calculandoFrete && freteStatus === 'a_combinar' && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3 mt-3">
                  <Truck size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-medium">
                    {FRETE_COPY.aCombinarDescricao}
                  </p>
                </div>
              )}

              {!calculandoFrete && freteStatus === 'bloqueado' && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3 mt-3">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-medium">
                    {freteMsg || 'Ainda não entregamos na sua região.'}
                  </p>
                </div>
              )}
            </div>

            {/* VOCÊ TAMBÉM PODE GOSTAR */}
            {recomendados.length > 0 && (
              <div className="bg-sx-surface rounded-2xl border border-sx-line shadow-sm p-5">
                <h3 className="text-sm font-black text-sx-text mb-4 flex items-center gap-2">
                  <Star size={14} style={{ color: 'var(--sx-accent-text)' }} />
                  Você também pode gostar
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {recomendados.map((p: any) => (
                    <Link key={p.id} href={`/produtos/${p.slug}`}
                      className="group flex flex-col rounded-xl border border-sx-line
                                 hover:border-sx-accent/40 hover:shadow-md transition-all overflow-hidden bg-sx-raised">
                      <div className="aspect-square bg-sx-stage p-2 overflow-hidden">
                        {p.imagens?.[0] ? (
                          <img src={p.imagens[0]} alt={p.nome}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-sx-subtle" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 flex-1">
                        <p className="text-xs font-semibold text-sx-text-2 line-clamp-2 leading-snug mb-1">
                          {p.nome}
                        </p>
                        <p className="text-sm font-black" style={{ color: 'var(--sx-accent-text)' }}>
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
            <div className="bg-sx-surface rounded-2xl border border-sx-line shadow-sm p-5 lg:sticky lg:top-24">
              <h3 className="text-sm font-black text-sx-text mb-5">Resumo do pedido</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-sx-muted">
                    Subtotal ({totalItens} {totalItens === 1 ? 'item' : 'itens'})
                  </span>
                  <span className="font-semibold text-sx-text">{fmtBRL(subtotal)}</span>
                </div>
                {promo.ativo ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Tag size={11} /> {promo.descricao ?? 'Promo'}
                    </span>
                    <span className="font-bold text-emerald-600">
                      -{fmtBRL(descontoEfetivo)}
                    </span>
                  </div>
                ) : cupomAplicado && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Tag size={11} /> {cupomAplicado.codigo}
                    </span>
                    <span className="font-bold text-emerald-600">
                      -{fmtBRL(descontoCupom)}
                    </span>
                  </div>
                )}
                {cashbackAplicado > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-sx-accent-text flex items-center gap-1">
                      <Coins size={11} /> Cashback
                    </span>
                    <span className="font-bold text-sx-accent-text">
                      -{fmtBRL(cashbackAplicado)}
                    </span>
                  </div>
                )}
                {freteSelecionado ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-sx-muted">Frete</span>
                    <span className={`font-semibold ${freteSelecionado.preco === 0 ? 'text-emerald-600' : 'text-sx-text'}`}>
                      {freteSelecionado.preco === 0 ? FRETE_COPY.gratis : fmtBRL(freteSelecionado.preco)}
                    </span>
                  </div>
                ) : freteStatus === 'a_combinar' ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-sx-muted">Frete</span>
                    <span className="font-semibold text-amber-600">{FRETE_COPY.aCombinar}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-sx-subtle">Frete</span>
                    <span className="text-xs text-sx-subtle">{FRETE_COPY.calculeAcima}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-sx-line pt-4 mb-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-black text-sx-text text-base">Total</span>
                  <span className="text-2xl font-black text-sx-text">{fmtBRL(totalFinal)}</span>
                </div>
                <p className="text-xs font-semibold text-right" style={{ color: 'var(--sx-accent-text)' }}>
                  {fmtBRL(totalPix)} no PIX ({DESCONTO_PIX_PCT}% OFF)
                </p>
                <p className="text-xs text-sx-subtle text-center mt-2">
                  ou {MAX_PARCELAS_SEM_JUROS}× de {fmtBRL(valorParcela(totalFinal))} sem juros
                </p>
              </div>

              {/* FINALIZAR COMPRA */}
              <button
                onClick={handleCheckout}
                className="w-full py-4 rounded-xl font-black text-base flex items-center
                           justify-center gap-2 transition-all hover:shadow-lg
                           hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] mb-3
                           bg-sx-accent hover:bg-sx-accent-hover text-[#032E28]">
                <CreditCard size={18} /> Finalizar compra
              </button>

              <Link href="/produtos"
                className="block text-center text-sm text-sx-subtle hover:text-sx-muted transition-colors">
                ← Continuar comprando
              </Link>

              {/* TRUST BADGES — 6 selos definitivos (componente compartilhado) */}
              <SelosConfianca className="mt-5 pt-4 border-t border-sx-line" />
            </div>

            {/* CASHBACK — usar ou não (opt-in, sincronizado com o checkout) */}
            <UsarCashback subtotalProdutos={subtotal} onValor={setCashbackCart} compact />

            {/* PARCELAMENTO INFO */}
            <div className="bg-sx-surface rounded-2xl border border-sx-line shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#e8f8f7' }}>
                  <CreditCard size={18} style={{ color: 'var(--sx-accent-text)' }} />
                </div>
                <div>
                  <p className="text-xs font-black text-sx-text">
                    Parcele sem juros
                  </p>
                  <p className="text-xs text-sx-subtle mt-0.5">
                    Em até {MAX_PARCELAS_SEM_JUROS}× no cartão de crédito · Débito e PIX aceitos
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
