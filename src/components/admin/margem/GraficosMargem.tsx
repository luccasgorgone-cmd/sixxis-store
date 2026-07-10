'use client'

// Gráficos da central de lucratividade (aba Margem). Somente admin.
//
// Regra que vale em TODOS eles: custo/lucro desconhecido NUNCA vira R$ 0.
//  • séries: valor null → recharts não liga os pontos (connectNulls={false}),
//    em vez de desenhar uma queda a zero que não aconteceu.
//  • gráficos que dependem do COGS: se não há custo, renderizam o estado vazio
//    <SemDados> em vez de uma fatia/barra zerada.

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { formatBRL } from '@/lib/format'
import type { PontoSerie, LinhaForma } from '@/lib/margem-agregacoes'

// Tiffany da marca + neutros. Sem emojis.
export const COR = {
  vendas:  '#0f2e2b',
  contrib: '#3cbfb3',
  lucro:   '#2a9d8f',
  taxa:    '#9333ea',
  frete:   '#f59e0b',
  custo:   '#64748b',
  vazio:   '#e5e7eb',
}

const fmtCurto = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v))

const fmtPct = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}%`)

export function Painel({ titulo, sub, children }: {
  titulo: string; sub?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-sm font-black text-gray-900">{titulo}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5 mb-2">{sub}</p>}
      <div className="mt-3">{children}</div>
    </div>
  )
}

export function SemDados({ mensagem }: { mensagem: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-center px-4">
      <p className="text-xs text-gray-400">{mensagem}</p>
    </div>
  )
}

// Tooltip único: formata BRL e omite séries sem valor no ponto.
function TooltipBRL({ active, payload, label }: {
  active?: boolean
  payload?: { name?: string; value?: number | null; color?: string }[]
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2">
      <p className="text-[11px] font-bold text-gray-500 mb-1">{label}</p>
      {payload.map((p) => (
        p.value == null ? null : (
          <p key={p.name} className="text-xs font-semibold" style={{ color: p.color }}>
            {p.name}: {formatBRL(p.value)}
          </p>
        )
      ))}
    </div>
  )
}

// ─── 1. Evolução no tempo ────────────────────────────────────────────────────

export function GraficoEvolucao({ dados, granularidade }: {
  dados: PontoSerie[]; granularidade: string
}) {
  if (dados.length === 0) return <SemDados mensagem="Nenhuma venda paga no período." />

  const temLucro = dados.some((d) => d.lucroReal != null)
  // Em semanas o ponto é a segunda-feira: prefixa para não parecer um dia solto.
  const rotulo = (d: string) => {
    const [, m, dia] = d.split('-')
    return granularidade === 'semana' ? `sem. ${dia}/${m}` : `${dia}/${m}`
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={dados} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gVendas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COR.vendas} stopOpacity={0.18} />
            <stop offset="100%" stopColor={COR.vendas} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gContrib" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COR.contrib} stopOpacity={0.28} />
            <stop offset="100%" stopColor={COR.contrib} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="data" tickFormatter={rotulo} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtCurto} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} />
        <Tooltip content={<TooltipBRL />} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
        <Area type="monotone" dataKey="vendas" name="Vendas" stroke={COR.vendas} fill="url(#gVendas)" strokeWidth={2} />
        <Area type="monotone" dataKey="margemContrib" name="Margem de contribuição" stroke={COR.contrib} fill="url(#gContrib)" strokeWidth={2} connectNulls={false} />
        {temLucro && (
          <Area type="monotone" dataKey="lucroReal" name="Lucro real" stroke={COR.lucro} fill="none" strokeWidth={2} strokeDasharray="4 3" connectNulls={false} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── 2. Margem por forma de pagamento ────────────────────────────────────────

export function GraficoPorForma({ dados, onSelecionar }: {
  dados: LinhaForma[]
  onSelecionar?: (forma: string) => void
}) {
  const comPct = dados.filter((d) => d.margemContribPct != null)
  if (comPct.length === 0) {
    return <SemDados mensagem="Sem taxa e frete lançados ainda — a margem por forma aparece assim que houver." />
  }
  const temLucro = comPct.some((d) => d.lucroRealPct != null)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={comPct} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="forma" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          formatter={(v: number, n: string) => [fmtPct(v), n]}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
        <Bar dataKey="margemContribPct" name="Margem de contribuição %" radius={[6, 6, 0, 0]}
          onClick={(d: unknown) => onSelecionar?.((d as LinhaForma).forma)}
          cursor={onSelecionar ? 'pointer' : undefined}>
          {comPct.map((d) => (
            // PIX destacado em tiffany cheio; parcelado em tom apagado — a
            // diferença de margem entre eles é o ponto do gráfico.
            <Cell key={d.forma} fill={d.forma === 'PIX' ? COR.contrib : d.forma === 'Parcelado' ? COR.custo : COR.vendas} />
          ))}
        </Bar>
        {temLucro && (
          <Bar dataKey="lucroRealPct" name="Lucro real %" fill={COR.lucro} radius={[6, 6, 0, 0]}
            onClick={(d: unknown) => onSelecionar?.((d as LinhaForma).forma)}
            cursor={onSelecionar ? 'pointer' : undefined} />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── 3. Para onde vai o dinheiro ─────────────────────────────────────────────

export function BarraDestino({ vendas, taxaMp, custoFrete, custoProdutos, lucro, lucroDisponivel }: {
  vendas: number
  taxaMp: number
  custoFrete: number
  custoProdutos: number
  lucro: number
  lucroDisponivel: boolean
}) {
  if (vendas <= 0) return <SemDados mensagem="Nenhuma venda paga no período." />

  const pct = (v: number) => (v / vendas) * 100
  const fatias = [
    { nome: 'Taxa MP', valor: taxaMp, cor: COR.taxa },
    { nome: 'Frete',   valor: custoFrete, cor: COR.frete },
    ...(lucroDisponivel
      ? [
          { nome: 'Custo produto', valor: custoProdutos, cor: COR.custo },
          { nome: 'Lucro',         valor: Math.max(0, lucro), cor: COR.lucro },
        ]
      : []),
  ]
  const usado = fatias.reduce((s, f) => s + f.valor, 0)
  const restante = Math.max(0, vendas - usado)

  return (
    <div>
      <div className="flex h-8 rounded-xl overflow-hidden border border-gray-100">
        {fatias.map((f) => (
          f.valor <= 0 ? null : (
            <div key={f.nome} style={{ width: `${pct(f.valor)}%`, background: f.cor }}
              title={`${f.nome}: ${formatBRL(f.valor)} (${pct(f.valor).toFixed(1)}%)`} />
          )
        ))}
        {restante > 0 && (
          <div
            style={{ width: `${pct(restante)}%` }}
            className={lucroDisponivel ? 'bg-emerald-100' : 'bg-gray-100 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#e5e7eb_4px,#e5e7eb_8px)]'}
            title={lucroDisponivel ? 'Restante' : 'Custo do produto e lucro: a definir'}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {fatias.map((f) => (
          <div key={f.nome} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: f.cor }} />
            <span className="text-[11px] text-gray-500">
              {f.nome} <strong className="text-gray-700">{pct(f.valor).toFixed(1)}%</strong>
            </span>
          </div>
        ))}
        {!lucroDisponivel && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200 shrink-0" />
            <span className="text-[11px] text-gray-400">
              Custo do produto e lucro: <strong>a definir</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 4. Composição de custos ─────────────────────────────────────────────────

export function DonutCustos({ taxaMp, custoFrete, custoProdutos, lucroDisponivel }: {
  taxaMp: number; custoFrete: number; custoProdutos: number; lucroDisponivel: boolean
}) {
  const fatias = [
    { nome: 'Taxa MP', valor: taxaMp, cor: COR.taxa },
    { nome: 'Frete',   valor: custoFrete, cor: COR.frete },
    // Só entra quando existe: custo desconhecido não vira fatia de R$ 0.
    ...(lucroDisponivel ? [{ nome: 'Custo produto', valor: custoProdutos, cor: COR.custo }] : []),
  ].filter((f) => f.valor > 0)

  if (fatias.length === 0) return <SemDados mensagem="Nenhum custo lançado no período." />

  const total = fatias.reduce((s, f) => s + f.valor, 0)

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={fatias} dataKey="valor" nameKey="nome" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
            {fatias.map((f) => <Cell key={f.nome} fill={f.cor} />)}
          </Pie>
          <Tooltip
            formatter={(v: number, n: string) => [`${formatBRL(v)} (${((v / total) * 100).toFixed(1)}%)`, n]}
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {fatias.map((f) => (
          <div key={f.nome} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: f.cor }} />
            <span className="text-[11px] text-gray-500">{f.nome} <strong className="text-gray-700">{formatBRL(f.valor)}</strong></span>
          </div>
        ))}
      </div>
      {!lucroDisponivel && (
        <p className="text-[11px] text-gray-400 text-center mt-2">
          Custo do produto ainda não entra: aguardando cadastro.
        </p>
      )}
    </div>
  )
}
