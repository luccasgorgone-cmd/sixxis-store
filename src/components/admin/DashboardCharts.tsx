'use client'

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Label,
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  pendente: '#f59e0b',
  pago: '#6366f1',
  enviado: '#8b5cf6',
  entregue: '#10b981',
  cancelado: '#ef4444',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtDate(d: string) {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

// ─── Area chart — Vendas por dia ────────────────────────────────────────────

interface VendasDia { date: string; valor: number }

export function GraficoVendas({ data }: { data: VendasDia[] }) {
  if (!data.length) return <Empty label="Sem vendas no período" />
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor="#3cbfb3" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3cbfb3" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDate}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          formatter={(v: number) => [fmt(v), 'Vendas']}
          labelFormatter={fmtDate}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="valor"
          stroke="#3cbfb3"
          strokeWidth={2.5}
          fill="url(#gradVendas)"
          dot={false}
          activeDot={{ r: 5, fill: '#3cbfb3' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Bar chart horizontal — Top produtos ─────────────────────────────────────

interface TopProduto { nome: string; quantidade: number; receita: number }

export function GraficoTopProdutos({ data }: { data: TopProduto[] }) {
  if (!data.length) return <Empty label="Sem dados de produtos vendidos" />
  const truncated = data.map((d) => ({ ...d, nome: d.nome.length > 28 ? d.nome.slice(0, 28) + '…' : d.nome }))
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, truncated.length * 38)}>
      <BarChart data={truncated} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis
          dataKey="nome"
          type="category"
          width={180}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => [v, 'Unidades']}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Bar dataKey="quantidade" fill="#3cbfb3" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Donut — Status dos pedidos ───────────────────────────────────────────────

interface PorStatus { status: string; count: number }

export function GraficoStatus({ data }: { data: PorStatus[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (!total) return <Empty label="Sem pedidos no período" />
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <PieChart width={180} height={180}>
        <Pie
          data={data}
          cx={90}
          cy={90}
          innerRadius={56}
          outerRadius={82}
          dataKey="count"
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#d1d5db'} />
          ))}
          <Label value={total} position="center" fontSize={22} fontWeight={700} fill="#111827" />
        </Pie>
        <Tooltip
          formatter={(v: number, _n, p) => [v, p.payload.status]}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
      </PieChart>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: STATUS_COLORS[d.status] ?? '#d1d5db' }}
            />
            <span className="capitalize text-gray-600">{d.status}</span>
            <span className="ml-auto font-semibold text-gray-800 pl-4">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
      {label}
    </div>
  )
}
