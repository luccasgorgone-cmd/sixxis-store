'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ShieldCheck, Package } from 'lucide-react'

interface GarantiaDetalhe {
  id: string
  status: string
  mesesAdicionais: number
  valorPago: number | string
  inicioVigencia: string
  fimVigencia: string
  createdAt: string
  acionamentos: Array<{ data: string; descricao: string; autor?: string }> | null
  produto: { id: string; nome: string; slug: string } | null
  pedido: {
    id: string
    createdAt: string
    cliente: { nome: string; email: string; cpf: string | null; telefone: string | null } | null
  } | null
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

const fmtData = (s: string) =>
  new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export default function GarantiaDetalhePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [g, setG] = useState<GarantiaDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [novaObs, setNovaObs] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/garantias/${params.id}`, { cache: 'no-store' })
      if (r.ok) {
        const d = await r.json()
        setG(d.garantia)
      }
    } finally { setLoading(false) }
  }, [params.id])

  useEffect(() => { carregar() }, [carregar])

  async function alterarStatus(novoStatus: string) {
    setSalvando(true)
    await fetch(`/api/admin/garantias/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
    })
    setSalvando(false)
    await carregar()
  }

  async function adicionarAcionamento() {
    if (!novaObs.trim()) return
    setSalvando(true)
    const lista = [...(g?.acionamentos ?? []), { data: new Date().toISOString(), descricao: novaObs.trim() }]
    await fetch(`/api/admin/garantias/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acionamentos: lista, status: 'acionada' }),
    })
    setNovaObs('')
    setSalvando(false)
    await carregar()
  }

  if (loading) return <p className="text-sm text-gray-400 p-6">Carregando…</p>
  if (!g) return <p className="text-sm text-gray-400 p-6">Garantia não encontrada.</p>

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft size={14} /> Voltar
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck size={22} className="text-[#3cbfb3]" />
          <div>
            <h1 className="text-xl font-black text-gray-900">
              {g.produto?.nome} • +{g.mesesAdicionais}m
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Garantia #{g.id.slice(-8).toUpperCase()} • status <strong>{g.status}</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Info label="Valor pago" valor={fmtBRL(Number(g.valorPago))} />
          <Info label="Início vigência" valor={fmtData(g.inicioVigencia)} />
          <Info label="Fim vigência" valor={fmtData(g.fimVigencia)} />
          <Info label="Pedido" valor={`#${g.pedido?.id.slice(-8).toUpperCase() ?? ''}`} />
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
          <p className="font-bold text-gray-900">Cliente</p>
          <p className="text-gray-600">{g.pedido?.cliente?.nome}</p>
          <p className="text-gray-500">{g.pedido?.cliente?.email}</p>
          {g.pedido?.cliente?.cpf && <p className="text-gray-500">CPF: {g.pedido.cliente.cpf}</p>}
          {g.pedido?.cliente?.telefone && <p className="text-gray-500">Tel: {g.pedido.cliente.telefone}</p>}
        </div>
      </div>

      {/* Ações */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-black text-gray-900 mb-3">Alterar status</h2>
        <div className="flex flex-wrap gap-2">
          {(['ativa', 'acionada', 'expirada', 'cancelada'] as const).map((s) => (
            <button
              key={s}
              disabled={salvando || g.status === s}
              onClick={() => alterarStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition disabled:opacity-50 ${
                g.status === s
                  ? 'border-[#3cbfb3] bg-[#e8f8f7] text-[#1a4f4a]'
                  : 'border-gray-200 text-gray-600 hover:border-[#3cbfb3]/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Acionamentos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
          <Package size={14} /> Histórico de acionamentos
        </h2>
        {(g.acionamentos ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum acionamento registrado.</p>
        ) : (
          <ul className="space-y-3">
            {g.acionamentos!.map((a, i) => (
              <li key={i} className="border-l-2 border-[#3cbfb3] pl-3">
                <p className="text-xs text-gray-400">{fmtData(a.data)}</p>
                <p className="text-sm text-gray-800">{a.descricao}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <textarea
            value={novaObs}
            onChange={(e) => setNovaObs(e.target.value)}
            rows={3}
            placeholder="Descrever um novo acionamento (cliente reportou problema X, técnico atendeu, etc.)"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
          />
          <button
            onClick={adicionarAcionamento}
            disabled={!novaObs.trim() || salvando}
            className="mt-2 px-4 py-2 rounded-xl bg-[#3cbfb3] text-white text-sm font-bold disabled:opacity-50"
          >
            Registrar acionamento
          </button>
        </div>
      </div>

      {g.produto && (
        <Link
          href={`/adm-a7f9c2b4/produtos/${g.produto.id}`}
          className="text-sm text-[#3cbfb3] hover:underline"
        >
          ← Editar produto vinculado
        </Link>
      )}
    </div>
  )
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
      <p className="text-sm font-bold text-gray-900 mt-0.5">{valor}</p>
    </div>
  )
}
