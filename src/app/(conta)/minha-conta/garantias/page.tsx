'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, ShieldOff, Package, Phone, AlertTriangle } from 'lucide-react'
import LayoutConta from '@/components/conta/LayoutConta'

interface GarantiaCliente {
  id: string
  mesesAdicionais: number
  valorPago: string | number
  inicioVigencia: string
  fimVigencia: string
  status: string
  statusAtual: string
  produto: { id: string; nome: string; slug: string; imagens: unknown } | null
  pedido: { id: string; createdAt: string } | null
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

const fmtData = (s: string) =>
  new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const STATUS_CORES: Record<string, string> = {
  ativa: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  acionada: 'bg-amber-50 border-amber-200 text-amber-800',
  expirada: 'bg-sx-raised border-sx-line text-sx-muted',
  cancelada: 'bg-red-50 border-red-200 text-red-700',
}

export default function MinhaContaGarantiasPage() {
  const [garantias, setGarantias] = useState<GarantiaCliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/garantias')
      .then((r) => r.json())
      .then((d) => setGarantias(d.garantias ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <LayoutConta>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-sx-surface rounded-2xl h-40 animate-pulse border border-sx-line" />
          ))}
        </div>
      </LayoutConta>
    )
  }

  if (garantias.length === 0) {
    return (
      <LayoutConta>
        <div className="bg-sx-surface rounded-2xl border border-sx-line shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sx-raised flex items-center justify-center mx-auto mb-4">
            <ShieldOff size={28} className="text-sx-subtle" />
          </div>
          <h2 className="text-lg font-black text-sx-text mb-2">Você ainda não tem garantias estendidas</h2>
          <p className="text-sm text-sx-muted max-w-md mx-auto">
            Adicione no próximo pedido pra ter proteção extra além da garantia de fábrica.
          </p>
          <Link
            href="/produtos"
            className="inline-flex items-center mt-5 bg-sx-accent hover:bg-sx-accent-hover text-[#032E28] font-bold text-sm px-5 py-2.5 rounded-xl transition"
          >
            Explorar produtos
          </Link>
        </div>
      </LayoutConta>
    )
  }

  return (
    <LayoutConta>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-black text-sx-text flex items-center gap-2">
            <ShieldCheck size={22} className="text-sx-accent-text" /> Minhas garantias estendidas
          </h1>
          <p className="text-sm text-sx-muted mt-1">
            Proteção contratada para os produtos comprados na Sixxis. A garantia estendida começa após o vencimento da garantia de fábrica.
          </p>
        </div>

        <ul className="space-y-3">
          {garantias.map((g) => {
            // eslint-disable-next-line react-hooks/purity -- pre-existente, fora do escopo do redesign de cor
            const expiraSoonMs = new Date(g.fimVigencia).getTime() - Date.now()
            const expiraEmDias = Math.ceil(expiraSoonMs / (1000 * 60 * 60 * 24))
            const aVencer = g.statusAtual === 'ativa' && expiraEmDias > 0 && expiraEmDias <= 30
            const cor = STATUS_CORES[g.statusAtual] ?? STATUS_CORES.ativa
            const imagem = Array.isArray(g.produto?.imagens) ? (g.produto?.imagens as unknown as string[])[0] : null

            return (
              <li key={g.id} className="bg-sx-surface rounded-2xl border border-sx-line shadow-sm p-5">
                <div className="flex gap-4">
                  <div className="w-20 h-20 shrink-0 rounded-xl bg-sx-raised border border-sx-line overflow-hidden flex items-center justify-center">
                    {imagem ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagem} alt={g.produto?.nome ?? ''} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Package size={26} className="text-sx-subtle" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-sx-text line-clamp-2">{g.produto?.nome ?? '—'}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${cor}`}>
                        {g.statusAtual}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sx-tint text-sx-muted">
                        +{g.mesesAdicionais} meses
                      </span>
                    </div>
                    <p className="text-xs text-sx-muted mt-1">
                      Vigência: <strong>{fmtData(g.inicioVigencia)}</strong> a <strong>{fmtData(g.fimVigencia)}</strong>
                    </p>
                    <p className="text-xs text-sx-subtle mt-0.5">
                      Pedido #{g.pedido?.id.slice(-8).toUpperCase() ?? '—'} • Pago {fmtBRL(Number(g.valorPago))}
                    </p>

                    {aVencer && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                        <AlertTriangle size={12} /> Vence em {expiraEmDias} dias.
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={`https://wa.me/5518997474701?text=${encodeURIComponent(
                          `Olá, preciso acionar minha garantia estendida.\n\nPedido: ${g.pedido?.id ?? ''}\nProduto: ${g.produto?.nome ?? ''}\nGarantia: +${g.mesesAdicionais} meses (válida até ${fmtData(g.fimVigencia)})`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebd5b] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
                      >
                        <Phone size={12} /> Acionar via WhatsApp
                      </a>
                      {g.produto && (
                        <Link
                          href={`/produtos/${g.produto.slug}`}
                          className="inline-flex items-center text-xs font-bold text-sx-muted hover:text-sx-accent-text px-3 py-1.5 border border-sx-line rounded-xl transition"
                        >
                          Ver produto
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="bg-sx-surface border border-sx-accent/30 rounded-2xl p-5 text-sm text-sx-text-2">
          <h3 className="font-bold text-sx-text mb-2">Como funciona</h3>
          <ul className="space-y-1.5 list-disc list-inside text-sx-muted">
            <li>A garantia estendida começa após o vencimento da garantia de fábrica.</li>
            <li>Cobre defeitos de fabricação, peças e mão de obra.</li>
            <li>Você aciona pelo WhatsApp (botão acima) ou pelo e-mail suporte@sixxis.com.br.</li>
            <li>A garantia é vinculada ao seu pedido e CPF de comprador.</li>
            <li>
              Operacionalizada pela Sixxis Importação Exportação e Comércio LTDA, CNPJ 54.978.947/0001-09.
            </li>
          </ul>
        </div>
      </div>
    </LayoutConta>
  )
}
