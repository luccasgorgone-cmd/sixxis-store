'use client'

// Relatório de MARGEM DE CONTRIBUIÇÃO por venda. Somente admin.
// Margem = venda − taxa MP − custo de frete real.
// TODO (COGS): quando o custo de produto vier do ERP, entra como mais uma coluna
// de subtração (a coluna "Custo produto" já está reservada abaixo).

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, RefreshCcw, AlertCircle, Loader2, Percent } from 'lucide-react'
import { ADMIN_BASE } from '@/lib/admin-path'
import { formatBRL } from '@/lib/format'

interface Linha {
  pedidoId: string
  data: string
  cliente: string
  formaPagamento: string
  venda: number
  taxaMp: number | null
  custoFrete: number | null
  custoProdutos: number | null
  margem: number | null
  margemPct: number | null
  taxaPendente: boolean
  fretePendente: boolean
}

interface Totais {
  pedidos: number
  vendas: number
  taxaMp: number
  custoFrete: number
  margem: number
  margemPctMedia: number | null
  linhasCompletas: number
  taxasPendentes: number
  fretesPendentes: number
  vendasCompletas: number
}

type Periodo = 'hoje' | '7d' | '30d' | 'mes' | 'personalizado'

const fmtData = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

const fmtPct = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}%`)

export default function MargemPage() {
  const [periodo, setPeriodo] = useState<Periodo>('30d')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const [linhas, setLinhas] = useState<Linha[]>([])
  const [totais, setTotais] = useState<Totais | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sincronizando, setSincronizando] = useState(false)
  const [msgSync, setMsgSync] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const p = new URLSearchParams({ periodo })
      if (periodo === 'personalizado' && dataInicio && dataFim) {
        p.set('from', dataInicio)
        p.set('to', dataFim)
      }
      const r = await fetch(`/api/admin/relatorios/margem?${p}`, { cache: 'no-store' })
      if (!r.ok) throw new Error('Falha ao carregar o relatório')
      const d = await r.json()
      setLinhas(d.linhas)
      setTotais(d.totais)
    } catch (e) {
      setErro((e as Error).message)
    }
    setCarregando(false)
  }, [periodo, dataInicio, dataFim])

  useEffect(() => { carregar() }, [carregar])

  async function sincronizarTaxas() {
    setSincronizando(true)
    setMsgSync('')
    try {
      const r = await fetch('/api/admin/pagamentos/sincronizar-taxas', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Falha na sincronização')
      setMsgSync(
        `${d.atualizados} atualizado(s) · ${d.semTaxa} sem taxa no MP · ` +
        `${d.falhas} falha(s) · ${d.restantes} restante(s)`,
      )
      await carregar()
    } catch (e) {
      setMsgSync(`Erro: ${(e as Error).message}`)
    }
    setSincronizando(false)
  }

  const cards = totais ? [
    { label: 'Vendas',        valor: formatBRL(totais.vendas),     sub: `${totais.pedidos} pedido(s) pagos` },
    { label: '(−) Taxa MP',   valor: formatBRL(totais.taxaMp),     sub: totais.taxasPendentes ? `${totais.taxasPendentes} pendente(s)` : 'todas sincronizadas' },
    { label: '(−) Frete',     valor: formatBRL(totais.custoFrete), sub: totais.fretesPendentes ? `${totais.fretesPendentes} sem custo lançado` : 'todos lançados' },
    { label: '= Margem',      valor: formatBRL(totais.margem),     sub: `${totais.linhasCompletas} de ${totais.pedidos} linha(s) completas` },
    { label: 'Margem % média', valor: fmtPct(totais.margemPctMedia), sub: 'só sobre linhas completas' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <TrendingUp size={22} className="text-[#3cbfb3]" /> Margem de contribuição
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Venda − taxa do Mercado Pago − custo real de frete. Interno: o cliente nunca vê.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
            {(['hoje','7d','30d','mes','personalizado'] as const).map((p) => {
              const LABELS: Record<string,string> = {hoje:'Hoje','7d':'7 dias','30d':'30 dias',mes:'Mês',personalizado:'Personalizado'}
              return (
                <button key={p} onClick={() => setPeriodo(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    periodo === p ? 'bg-[#3cbfb3] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                  }`}>
                  {LABELS[p]}
                </button>
              )
            })}
          </div>
          {periodo === 'personalizado' && (
            <div className="flex items-center gap-2">
              <input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
              <span className="text-gray-400 text-sm">até</span>
              <input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
            </div>
          )}
          <button onClick={carregar}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-[#3cbfb3] hover:border-[#3cbfb3]/40 transition-all">
            <RefreshCcw size={15} className={carregando ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Sincronização das taxas do MP */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-start gap-2">
          <Percent size={16} className="text-[#3cbfb3] mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500">
            A taxa é gravada automaticamente quando o pagamento é aprovado. Use o botão para
            preencher pedidos antigos (ou os que falharam). É idempotente.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {msgSync && <span className="text-xs text-gray-500">{msgSync}</span>}
          <button onClick={sincronizarTaxas} disabled={sincronizando}
            className="bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition flex items-center gap-2">
            {sincronizando ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            Sincronizar taxas do MP
          </button>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={15} /> {erro}
        </div>
      )}

      {/* Totais do período */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{c.label}</p>
            <p className="text-lg font-black text-gray-900 mt-1">{c.valor}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Linhas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3 text-right">Venda</th>
                <th className="px-4 py-3 text-right">(−) Taxa MP</th>
                <th className="px-4 py-3 text-right">(−) Frete</th>
                {/* TODO (COGS): coluna reservada — preencher com custoProdutos do ERP. */}
                <th className="px-4 py-3 text-right text-gray-300">(−) Custo produto</th>
                <th className="px-4 py-3 text-right">= Margem</th>
                <th className="px-4 py-3 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {carregando && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  <Loader2 size={18} className="animate-spin inline" />
                </td></tr>
              )}
              {!carregando && linhas.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  Nenhuma venda paga no período.
                </td></tr>
              )}
              {!carregando && linhas.map((l) => (
                <tr key={l.pedidoId} className="hover:bg-gray-50/60 transition">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtData(l.data)}</td>
                  <td className="px-4 py-3">
                    <Link href={`${ADMIN_BASE}/pedidos?q=${l.pedidoId}`}
                      className="font-mono text-xs font-bold text-[#3cbfb3] hover:underline">
                      #{l.pedidoId.slice(-8).toUpperCase()}
                    </Link>
                    <p className="text-[11px] text-gray-400">{l.cliente}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">{formatBRL(l.venda)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {l.taxaPendente
                      ? <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5">taxa pendente</span>
                      : <span className="text-gray-600">{formatBRL(l.taxaMp)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {l.fretePendente
                      ? <span className="text-[11px] font-bold text-gray-400">não lançado</span>
                      : <span className="text-gray-600">{formatBRL(l.custoFrete)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 whitespace-nowrap">—</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {l.margem == null
                      ? <span className="text-gray-300">—</span>
                      : <span className={`font-black ${l.margem >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatBRL(l.margem)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{fmtPct(l.margemPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
