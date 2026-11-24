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
      <p className="text-sx-accent-text font-semibold text-sm">
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
        className="min-w-0 flex-1 rounded-lg border border-sx-line px-4 py-3 text-sm font-medium text-sx-text outline-none placeholder:text-sx-subtle focus:border-sx-accent-text focus:ring-2 focus:ring-sx-accent/30"
        style={{ backgroundColor: 'var(--sx-surface)' }}
      />
      <button
        type="submit"
        className="h-12 shrink-0 rounded-lg px-6 text-sm font-bold text-sx-ink transition-colors hover:opacity-90"
        style={{ backgroundColor: 'var(--sx-accent)' }}
      >
        Cadastrar
      </button>
      {status === 'error' && (
        <p className="text-red-500 text-xs mt-1 w-full text-left">Digite um e-mail válido.</p>
      )}
    </form>
  )
}
