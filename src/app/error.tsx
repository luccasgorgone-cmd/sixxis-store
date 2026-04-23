'use client'

import { useEffect } from 'react'

export default function RootError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[ROUTE-LAYOUT-ERROR] (root)', {
      digest:   error.digest,
      message:  error.message,
      name:     error.name,
      stack:    error.stack?.substring(0, 800),
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
    })
  }, [error])

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '40px auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f2e2b', marginBottom: 12 }}>
        Erro global
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>
        <strong>Digest:</strong> <code style={{ fontFamily: 'monospace', color: '#dc2626' }}>{error.digest ?? '—'}</code>
      </p>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16, wordBreak: 'break-word' }}>
        <strong>Message:</strong> {error.message || '(sem mensagem)'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 20px', borderRadius: 10, background: '#3cbfb3',
          color: '#0f2e2b', fontWeight: 800, border: 'none', cursor: 'pointer',
        }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
