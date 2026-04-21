'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCarrinho } from '@/hooks/useCarrinho'
import type { Produto } from '@/types'

// ── Tipo local para compatibilidade ──────────────────────────────────────────
type ProdutoOferta = Produto

// ── TimerBloco ────────────────────────────────────────────────────────────────

function TimerBloco({ valor, label }: { valor: number; label: string }) {
  const str = String(valor).padStart(2, '0')
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #1a3d38, #0f2e2b)',
          border: '1px solid rgba(60,191,179,0.2)',
          boxShadow: '0 0 20px rgba(60,191,179,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/30 z-10" />
        <div className="absolute top-0 inset-x-0 h-1/2 bg-white/5 rounded-t-2xl" />
        <span className="text-2xl font-black text-white relative z-20 tracking-widest tabular-nums leading-none">
          {str}
        </span>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 mt-1.5">{label}</span>
    </div>
  )
}

// ── CardOfertaRelampago ───────────────────────────────────────────────────────

function CardOfertaRelampago({ produto }: { produto: ProdutoOferta }) {
  const router = useRouter()
  const { adicionarItem } = useCarrinho()

  const preco = Number(produto.preco)
  const promocional = produto.precoPromocional ? Number(produto.precoPromocional) : null
  const precoFinal = promocional ?? preco
  const descPct = promocional ? Math.round((1 - promocional / preco) * 100) : 0
  const imagem = Array.isArray(produto.imagens) ? produto.imagens[0] : null

  function comprarAgora() {
    adicionarItem({ produtoId: produto.id, nome: produto.nome, preco: precoFinal, quantidade: 1, imagem: imagem || undefined })
    router.push(`/checkout?compra_direta=1&produto=${produto.id}`)
  }

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-white/10
                    hover:border-[#3cbfb3]/40 transition-all duration-300 hover:-translate-y-1
                    hover:shadow-2xl hover:shadow-[#3cbfb3]/20">
      {descPct > 0 && (
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-red-500 text-white text-xs font-black px-2.5 py-1.5 rounded-xl
                          shadow-lg shadow-red-500/30 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 60 100" fill="currentColor">
              <path d="M35 0L5 55H30L15 100L55 40H28L35 0Z" />
            </svg>
            -{descPct}%
          </div>
        </div>
      )}

      <Link href={`/produtos/${produto.slug}`}>
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
          {imagem ? (
            <img src={imagem} alt={produto.nome}
              className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-[#0f2e2b]/0 group-hover:bg-[#0f2e2b]/5 transition-colors duration-300" />
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/produtos/${produto.slug}`}>
          <h3 className="text-sm font-bold text-gray-900 mb-2 leading-snug line-clamp-2 hover:text-[#3cbfb3] transition-colors">
            {produto.nome}
          </h3>
        </Link>

        <div className="mb-3">
          {promocional ? (
            <>
              <p className="text-xs text-gray-400 line-through leading-none">
                R$ {preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xl font-black text-gray-900 leading-tight mt-0.5">
                R$ {precoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </>
          ) : (
            <p className="text-xl font-black text-gray-900">
              R$ {precoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
          <p className="text-[11px] text-gray-400 mt-0.5">
            6x de R$ {(precoFinal / 6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} s/ juros
          </p>
        </div>

        {typeof produto.estoque === 'number' && produto.estoque <= 10 && produto.estoque > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-orange-500 font-bold">Últimas unidades!</span>
              <span className="text-gray-400">{produto.estoque} restantes</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full"
                style={{ width: `${Math.min(100, (produto.estoque / 20) * 100)}%`, background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
            </div>
          </div>
        )}

        <button onClick={comprarAgora}
          className="w-full py-3 rounded-xl font-black text-sm transition-all hover:shadow-lg hover:-translate-y-px active:translate-y-0"
          style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}>
          Comprar Agora
        </button>
      </div>
    </div>
  )
}

// ── OfertasRelampago ──────────────────────────────────────────────────────────

interface Props {
  produtos: ProdutoOferta[]
}

export default function OfertasRelampago({ produtos }: Props) {
  const [horas,   setHoras]   = useState(0)
  const [minutos, setMinutos] = useState(0)
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    const calcular = () => {
      const agora = new Date()
      const fim   = new Date()
      fim.setHours(23, 59, 59, 0)
      const diff = Math.max(0, fim.getTime() - agora.getTime())
      setHoras(Math.floor(diff / 3600000))
      setMinutos(Math.floor((diff % 3600000) / 60000))
      setSegundos(Math.floor((diff % 60000) / 1000))
    }
    calcular()
    const t = setInterval(calcular, 1000)
    return () => clearInterval(t)
  }, [])

  if (produtos.length === 0) return null

  const produtosOferta = produtos.slice(0, 3)

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 border-t border-b border-white/10 min-h-[400px]">

      {/* Overlay escuro suave para contraste com o wallpaper */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* Grid decorativa sutil */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10"
          style={{ background: 'radial-gradient(ellipse at right center, #3cbfb3 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#3cbfb3 1px, transparent 1px), linear-gradient(90deg, #3cbfb3 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* ── COLUNA ESQUERDA ── */}
          <div className="flex-shrink-0 text-center lg:text-left lg:w-72">
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30
                            text-red-400 text-xs font-black uppercase tracking-widest px-3 py-1.5
                            rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Oferta por tempo limitado
            </div>

            <div className="mb-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
                Oferta Relâmpago
              </h2>
              <p className="text-white/50 text-sm">Aproveite antes que o estoque acabe!</p>
            </div>

            <div className="w-12 h-1 bg-[#3cbfb3] rounded-full mb-6 mx-auto lg:mx-0" />

            {/* Timer */}
            <div className="mb-6">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Termina em</p>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <TimerBloco valor={horas} label="H" />
                <span className="text-2xl font-black text-[#3cbfb3] animate-pulse mb-3">:</span>
                <TimerBloco valor={minutos} label="MIN" />
                <span className="text-2xl font-black text-[#3cbfb3] animate-pulse mb-3">:</span>
                <TimerBloco valor={segundos} label="SEG" />
              </div>
            </div>

            <Link href="/ofertas"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm
                         transition-all hover:shadow-lg hover:-translate-y-px active:translate-y-0"
              style={{ background: 'linear-gradient(135deg, #3cbfb3, #2a9d8f)', color: '#0f2e2b' }}>
              Ver todas as ofertas
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* ── COLUNA DIREITA: Produtos ── */}
          <div className="flex-1 w-full">
            <div className={`grid gap-4 ${
              produtosOferta.length === 1
                ? 'grid-cols-1 max-w-xs mx-auto lg:mx-0 lg:max-w-sm'
                : produtosOferta.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-lg mx-auto lg:mx-0'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {produtosOferta.map((produto) => (
                <CardOfertaRelampago key={produto.id} produto={produto} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
