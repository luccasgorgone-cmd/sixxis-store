'use client'

import { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) {
      setStatus('error')
      return
    }
    try {
      await fetch('/api/newsletter', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
    } catch { /* silent */ }
    setStatus('ok')
    setEmail('')
  }

  if (status === 'ok') {
    return (
      <p className="text-[#3cbfb3] font-semibold text-sm">
        ✓ Cadastrado com sucesso! Fique de olho no seu e-mail para nossas novidades.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu melhor e-mail"
        className="flex-1 bg-white text-gray-800 placeholder-gray-400 px-5 py-3.5 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-[#3cbfb3]"
      />
      <button
        type="submit"
        className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
      >
        Cadastrar
      </button>
      {status === 'error' && (
        <p className="text-red-500 text-xs mt-1 w-full text-left">Digite um e-mail válido.</p>
      )}
    </form>
  )
}
