'use client'

import { useEffect, useState } from 'react'
import { Gift, TrendingUp, Loader2, Copy, Check } from 'lucide-react'

interface HistoricoItem {
  id:        string
  pontos:    number
  tipo:      string
  descricao: string | null
  createdAt: string
}

export default function FidelidadePage() {
  const [data, setData] = useState<{
    saldo: number
    descontoDisponivel: number
    historico: HistoricoItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [resgatando, setResgatando] = useState(false)
  const [cupomGerado, setCupomGerado] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [pontosResgatar, setPontosResgatar] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/fidelidade')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleResgatar(e: React.FormEvent) {
    e.preventDefault()
    const pts = Number(pontosResgatar)
    if (!pts || pts < 100) { setErro('Mínimo de 100 pontos para resgate'); return }
    if (data && pts > data.saldo) { setErro('Saldo insuficiente'); return }
    setErro('')
    setResgatando(true)
    const r = await fetch('/api/fidelidade', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pontos: pts }),
    })
    setResgatando(false)
    if (r.ok) {
      const d = await r.json()
      setCupomGerado(d.cupomCodigo)
      setPontosResgatar('')
      // Recarregar saldo
      fetch('/api/fidelidade').then((r) => r.json()).then(setData)
    } else {
      const d = await r.json()
      setErro(d.error ?? 'Erro ao resgatar')
    }
  }

  function copiar(texto: string) {
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#3cbfb3] animate-spin" />
      </main>
    )
  }

  const saldo = data?.saldo ?? 0
  const desconto = data?.descontoDisponivel ?? 0

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight mb-8">
        Programa de Fidelidade
      </h1>

      {/* Saldo */}
      <div
        className="rounded-2xl p-8 mb-6 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #0f1f1e 0%, #3cbfb3 100%)' }}
      >
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
          <Gift className="w-7 h-7 text-white" />
        </div>
        <p className="text-white/70 text-sm mb-1">Seu saldo de pontos</p>
        <p className="text-6xl font-extrabold">{saldo.toLocaleString('pt-BR')}</p>
        <p className="text-white/70 text-sm mt-2">
          ≈ {desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em descontos
        </p>
      </div>

      {/* Como funciona */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Como funciona
        </h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-[#3cbfb3] font-bold mt-0.5">✓</span>
            Ganhe <strong>1 ponto</strong> para cada R$1,00 em compras
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#3cbfb3] font-bold mt-0.5">✓</span>
            Resgate <strong>100 pontos</strong> por R$1,00 de desconto
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#3cbfb3] font-bold mt-0.5">✓</span>
            Pontos creditados automaticamente após confirmação do pagamento
          </li>
        </ul>
      </div>

      {/* Resgatar */}
      {saldo >= 100 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Resgatar Pontos</h2>

          {cupomGerado ? (
            <div className="bg-[#e8f8f7] border border-[#3cbfb3]/30 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-2">Cupom gerado com sucesso!</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono font-bold text-[#3cbfb3] text-xl tracking-widest">{cupomGerado}</span>
                <button onClick={() => copiar(cupomGerado)} className="text-gray-400 hover:text-[#3cbfb3] transition">
                  {copiado ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Use no checkout para aplicar o desconto</p>
            </div>
          ) : (
            <form onSubmit={handleResgatar} className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min={100}
                  max={saldo}
                  step={100}
                  value={pontosResgatar}
                  onChange={(e) => setPontosResgatar(e.target.value)}
                  placeholder={`Mín. 100 pts (saldo: ${saldo})`}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
                />
                {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
              </div>
              <button
                type="submit"
                disabled={resgatando}
                className="bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition"
              >
                {resgatando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resgatar'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Histórico */}
      {(data?.historico?.length ?? 0) > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Histórico</h2>
          <div className="space-y-2">
            {data!.historico.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm text-gray-700">{h.descricao ?? h.tipo}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(h.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className={`font-bold text-sm ${h.pontos > 0 ? 'text-[#3cbfb3]' : 'text-red-500'}`}>
                  {h.pontos > 0 ? '+' : ''}{h.pontos.toLocaleString('pt-BR')} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
