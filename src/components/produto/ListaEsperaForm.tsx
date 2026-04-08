'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'

interface Props { produtoId: string }

export default function ListaEsperaForm({ produtoId }: Props) {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setErro('Digite seu e-mail'); return }
    setErro('')
    setEnviando(true)

    const res = await fetch('/api/lista-espera', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ produtoId, email }),
    })

    setEnviando(false)

    if (res.ok) {
      setOk(true)
    } else {
      setErro('Erro ao cadastrar. Tente novamente.')
    }
  }

  if (ok) {
    return (
      <div className="bg-[#e8f8f7] border border-[#3cbfb3]/30 rounded-xl p-4 text-center">
        <Bell className="w-6 h-6 text-[#3cbfb3] mx-auto mb-2" />
        <p className="font-semibold text-[#3cbfb3] text-sm">Você será avisado!</p>
        <p className="text-xs text-gray-500 mt-1">Enviaremos um e-mail quando o produto estiver disponível.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-5 h-5 text-[#3cbfb3]" />
        <p className="font-semibold text-[#0a0a0a] text-sm">Avise-me quando disponível</p>
      </div>
      <p className="text-xs text-gray-500 mb-4">Cadastre seu e-mail e avisaremos quando o produto voltar ao estoque.</p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
        />
        <button
          type="submit"
          disabled={enviando}
          className="bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition"
        >
          {enviando ? '...' : 'Avisar'}
        </button>
      </form>

      {erro && <p className="text-xs text-red-500 mt-2">{erro}</p>}
    </div>
  )
}
