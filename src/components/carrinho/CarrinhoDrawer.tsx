'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, ShoppingBag, Minus, Plus, Trash2, Package, Zap, Truck, Clock, AlertCircle, Loader2, Tag } from 'lucide-react'
import { useCarrinho, useTotalCarrinho } from '@/hooks/useCarrinho'
import { feedIdProduto } from '@/lib/feed-id'
import { calcularPromoCliente } from '@/lib/promo-segunda-unidade'
import { FRETE_COPY } from '@/lib/copy/frete'
import {
  cepValido, formatarCep, soDigitosCep, montarProdutosFrete,
  normalizarRespostaFrete, estadoFreteView, type RespostaFreteNormalizada,
} from '@/lib/frete-estimativa'

interface UpsellItem {
  id: string
  nome: string
  slug: string
  sku: string | null
  preco: number
  precoFinal: number
  desconto: number | null
  imagem: string | null
  pixPreco: string
  temVariacoes?: boolean
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CarrinhoDrawer() {
  const { itens, drawerAberto, setDrawerAberto, removerItem, atualizarQuantidade, adicionarItem } = useCarrinho()
  const total = useTotalCarrinho()
  const [upsell, setUpsell] = useState<UpsellItem[]>([])

  // Promo "2ª unidade" — só EXIBIÇÃO (o servidor em /api/pedidos é autoritativo).
  // Mesmo cálculo da página /carrinho e do /checkout; sem isto o drawer mostrava
  // o subtotal cheio e o cliente só via o desconto depois de avançar.
  const promo = calcularPromoCliente(
    itens.map((i) => ({ feedId: i.feedId, preco: i.preco, quantidade: i.quantidade })),
  )
  const descontoPromo = promo.ativo ? Math.min(promo.desconto, total) : 0
  const totalComDesconto = Math.max(0, total - descontoPromo)

  // ── Estimativa de frete (CEP antes do checkout) ──────────────
  const [cepFrete, setCepFrete] = useState('')
  const [calculandoFrete, setCalculandoFrete] = useState(false)
  const [freteErro, setFreteErro] = useState('')
  const [freteResult, setFreteResult] = useState<RespostaFreteNormalizada | null>(null)
  const estadoFrete = estadoFreteView(calculandoFrete, freteResult)

  // Prefill a partir do CEP salvo (descarta o valor dummy histórico "16015-480").
  useEffect(() => {
    const salvo = localStorage.getItem('sixxis_cep') || ''
    if (salvo && !/^16015-?480$/.test(salvo)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCepFrete(formatarCep(salvo))
    }
  }, [])

  const calcularFrete = async () => {
    if (!cepValido(cepFrete)) {
      setFreteErro('Digite um CEP válido com 8 dígitos.')
      return
    }
    if (itens.length === 0) return
    setCalculandoFrete(true)
    setFreteErro('')
    setFreteResult(null)
    try {
      // Fonte única: /api/frete → resolverFrete (tabela produto × UF + carriers).
      const res = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cepDestino: soDigitosCep(cepFrete),
          produtos: montarProdutosFrete(itens),
        }),
      })
      setFreteResult(normalizarRespostaFrete(await res.json()))
      try { localStorage.setItem('sixxis_cep', soDigitosCep(cepFrete)) } catch { /* storage indisponível */ }
    } catch {
      setFreteResult({
        status: 'bloqueado',
        opcoes: [],
        mensagem: 'Não foi possível calcular o frete. Tente novamente.',
      })
    }
    setCalculandoFrete(false)
  }

  // Fetch upsell products whenever cart opens or items change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!drawerAberto || itens.length === 0) { setUpsell([]); return }
    const exclude = itens.map(i => i.produtoId).join(',')
    fetch(`/api/produtos/upsell?limit=3&exclude=${exclude}`)
      .then(r => r.json())
      .then(d => setUpsell(d.produtos || []))
      .catch(() => setUpsell([]))
  }, [drawerAberto, itens])

  // ESC close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerAberto(false)
    }
    if (drawerAberto) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [drawerAberto, setDrawerAberto])

  // body scroll lock + drawer signal
  useEffect(() => {
    document.body.style.overflow = drawerAberto ? 'hidden' : ''
    if (drawerAberto) {
      document.body.setAttribute('data-drawer-open', 'true')
    } else {
      document.body.removeAttribute('data-drawer-open')
    }
    return () => {
      document.body.style.overflow = ''
      document.body.removeAttribute('data-drawer-open')
    }
  }, [drawerAberto])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          drawerAberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerAberto(false)}
        aria-hidden="true"
      />

      {/* Drawer — mobile ocupa toda a largura, desktop limita a 420px */}
      <div
        className={`fixed top-0 right-0 z-[61] h-full w-full sm:w-[420px] flex flex-col transition-transform duration-300 bg-sx-surface ${drawerAberto ? 'shadow-2xl' : ''}`}
        style={{
          transform: drawerAberto ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sx-line shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-sx-accent-text" />
            <h2 className="font-extrabold text-sx-text text-base">Meu Carrinho</h2>
            {itens.length > 0 && (
              <span className="bg-sx-accent text-sx-ink text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                {itens.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setDrawerAberto(false)}
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-sx-raised transition text-sx-subtle hover:text-sx-muted"
            aria-label="Fechar carrinho"
          >
            <X size={20} />
          </button>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
              <div className="w-16 h-16 bg-sx-raised rounded-full flex items-center justify-center">
                <Package size={28} className="text-sx-subtle" />
              </div>
              <p className="text-sx-muted font-semibold">Seu carrinho está vazio</p>
              <p className="text-sm text-sx-subtle">Adicione produtos para começar</p>
              <button
                onClick={() => setDrawerAberto(false)}
                className="mt-2 bg-sx-accent hover:bg-sx-accent-hover text-[#032E28] font-bold px-6 py-2.5 rounded-xl transition text-sm"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            itens.map(item => (
              <div
                key={`${item.produtoId}-${item.variacaoId ?? ''}`}
                className="flex gap-3 bg-sx-raised rounded-2xl p-3 border border-sx-line"
              >
                {/* Imagem */}
                <div className="w-16 h-16 rounded-xl bg-sx-stage border border-[#e6e9e4] overflow-hidden shrink-0 flex items-center justify-center">
                  {item.imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imagem} alt={item.nome} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Package size={24} className="text-gray-200" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sx-text line-clamp-2 leading-snug">{item.nome}</p>
                  {item.variacaoNome && (
                    <p className="text-xs text-sx-subtle mt-0.5">{item.variacaoNome}</p>
                  )}
                  <p className="text-sm font-extrabold text-sx-accent-text mt-1">
                    R$ {fmt(item.preco * item.quantidade)}
                  </p>

                  {/* Quantidade + remover */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-sx-line rounded-xl overflow-hidden bg-sx-raised">
                      <button
                        onClick={() => atualizarQuantidade(item.produtoId, item.quantidade - 1, item.variacaoId)}
                        className="w-11 h-11 flex items-center justify-center text-sx-muted hover:bg-sx-raised transition"
                        aria-label="Diminuir"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-sx-text">{item.quantidade}</span>
                      <button
                        onClick={() => atualizarQuantidade(item.produtoId, item.quantidade + 1, item.variacaoId)}
                        className="w-11 h-11 flex items-center justify-center text-sx-muted hover:bg-sx-raised transition"
                        aria-label="Aumentar"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => removerItem(item.produtoId, item.variacaoId)}
                      className="w-11 h-11 flex items-center justify-center text-sx-subtle hover:text-red-400 transition"
                      aria-label="Remover item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Upsell — você também pode gostar */}
          {itens.length > 0 && upsell.length > 0 && (
            <div className="mt-4 pt-4 border-t border-sx-line">
              <p className="text-xs font-bold text-sx-muted uppercase tracking-wide mb-3">Você também pode gostar</p>
              <div className="space-y-2.5">
                {upsell.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-sx-raised rounded-xl p-2.5 border border-sx-line">
                    <Link href={`/produtos/${p.slug}`} onClick={() => setDrawerAberto(false)} className="shrink-0">
                      <div className="w-12 h-12 bg-sx-stage rounded-lg overflow-hidden border border-[#e6e9e4] flex items-center justify-center">
                        {p.imagem ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imagem} alt={p.nome} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Package size={18} className="text-gray-200" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/produtos/${p.slug}`} onClick={() => setDrawerAberto(false)}>
                        <p className="text-xs font-semibold text-sx-text line-clamp-1 hover:text-sx-accent-text transition-colors">{p.nome}</p>
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-black text-sx-text">R$ {fmt(p.precoFinal)}</span>
                        {p.desconto && (
                          <span className="inline-flex items-center gap-0.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            <Zap size={8} /> -{p.desconto}%
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-sx-accent-text">R$ {fmt(Number(p.pixPreco))} no PIX</p>
                    </div>
                    {/* Produto com variação não entra por aqui: sem seletor no
                        drawer, o "+ Add" criaria item sem voltagem/cor. Vira
                        link p/ a página do produto, onde a escolha é obrigatória. */}
                    {p.temVariacoes ? (
                      <Link
                        href={`/produtos/${p.slug}`}
                        onClick={() => setDrawerAberto(false)}
                        className="shrink-0 bg-sx-accent hover:bg-sx-accent-hover text-[#032E28] text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition"
                      >
                        Escolher
                      </Link>
                    ) : (
                      <button
                        onClick={() => adicionarItem({ produtoId: p.id, nome: p.nome, preco: p.precoFinal, quantidade: 1, imagem: p.imagem ?? undefined, feedId: feedIdProduto({ sku: p.sku, slug: p.slug }) })}
                        className="shrink-0 bg-sx-accent hover:bg-sx-accent-hover text-[#032E28] text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {itens.length > 0 && (
          <div className="border-t border-sx-line px-5 py-4 space-y-3 shrink-0 bg-sx-surface">
            {/* Total (com a promo "2ª unidade" já abatida, para transparência) */}
            {promo.ativo ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-sx-muted">Subtotal</span>
                  <span className="text-sm font-semibold text-sx-subtle line-through">R$ {fmt(total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-600 flex items-center gap-1">
                    <Tag size={12} /> {promo.descricao ?? 'Promo'}
                  </span>
                  <span className="text-sm font-bold text-emerald-600">-R$ {fmt(descontoPromo)}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-sx-text-2">Total</span>
                  <span className="text-lg font-black text-sx-text">R$ {fmt(totalComDesconto)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-sx-muted">Subtotal</span>
                <span className="text-lg font-black text-sx-text">R$ {fmt(total)}</span>
              </div>
            )}
            {/* Estimativa de frete — mostra o custo ANTES do checkout */}
            <div className="-mt-1">
              <div className="flex gap-2">
                <input
                  inputMode="numeric"
                  value={cepFrete}
                  onChange={e => { setCepFrete(formatarCep(e.target.value)); setFreteErro('') }}
                  onKeyDown={e => e.key === 'Enter' && calcularFrete()}
                  placeholder="CEP para calcular o frete"
                  maxLength={9}
                  className="flex-1 min-w-0 px-3 py-2 border border-sx-line rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-sx-accent focus:border-transparent transition"
                  aria-label="CEP para calcular o frete"
                />
                <button
                  onClick={calcularFrete}
                  disabled={!cepValido(cepFrete) || calculandoFrete}
                  className="shrink-0 flex items-center gap-1.5 bg-sx-accent hover:bg-sx-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-[#032E28] font-bold px-3.5 py-2 rounded-xl text-sm transition active:scale-95"
                >
                  {calculandoFrete ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                  {calculandoFrete ? FRETE_COPY.calculando : FRETE_COPY.calcular}
                </button>
              </div>

              {freteErro && (
                <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} /> {freteErro}
                </p>
              )}

              {estadoFrete === 'ok' && freteResult && (
                <div className="mt-2 space-y-1.5">
                  {freteResult.opcoes.map(op => (
                    <div key={op.id}
                      className="flex items-center justify-between bg-sx-raised border border-sx-line rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Truck size={13} className="text-sx-accent-text shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-sx-text truncate">{op.nome}</p>
                          {op.prazo && (
                            <p className="text-[10px] text-sx-muted flex items-center gap-1">
                              <Clock size={9} /> {op.prazo}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs font-extrabold shrink-0 ${op.preco === 0 ? 'text-emerald-600' : 'text-sx-text'}`}>
                        {op.preco === 0 ? FRETE_COPY.gratisPreco : `R$ ${fmt(op.preco)}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {estadoFrete === 'a_combinar' && (
                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">
                  {FRETE_COPY.aCombinarDescricao}
                </p>
              )}

              {(estadoFrete === 'bloqueado' || estadoFrete === 'sem-opcoes') && (
                <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mt-2 flex items-start gap-1.5">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  {freteResult?.mensagem || 'Ainda não entregamos na sua região.'}
                </p>
              )}
            </div>

            {/* Selos */}
            <div className="flex items-center justify-center gap-3 bg-sx-raised rounded-xl py-2 px-3 flex-wrap">
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
                <span className="text-[10px] text-sx-muted font-medium">Compra Segura</span>
              </div>
              <div className="w-px h-3 bg-sx-line" />
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sx-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span className="text-[10px] text-sx-muted font-medium">SSL Ativo</span>
              </div>
              <div className="w-px h-3 bg-sx-line" />
              <div className="flex items-center gap-1">
                <svg width="20" height="13" viewBox="0 0 200 130" fill="none">
                  <rect width="200" height="130" rx="10" fill="#009ee3"/>
                  <text x="100" y="85" textAnchor="middle" fill="white" fontSize="60" fontWeight="bold" fontFamily="Arial, sans-serif">MP</text>
                </svg>
                <span className="text-[10px] text-sx-muted font-medium">Mercado Pago</span>
              </div>
            </div>

            {/* Botões */}
            <Link
              href="/checkout"
              onClick={() => setDrawerAberto(false)}
              className="w-full flex items-center justify-center gap-2 bg-sx-accent hover:bg-sx-accent-hover text-[#032E28] font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-sx-accent/25 hover:-translate-y-0.5 active:scale-[0.97] text-base"
            >
              <ShoppingBag size={18} />
              Finalizar compra
            </Link>
            <Link
              href="/carrinho"
              onClick={() => setDrawerAberto(false)}
              className="w-full flex items-center justify-center gap-2 border-2 border-sx-line text-sx-muted hover:border-sx-accent hover:text-sx-accent-text font-bold py-3 rounded-2xl transition text-sm"
            >
              Ver carrinho completo
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
