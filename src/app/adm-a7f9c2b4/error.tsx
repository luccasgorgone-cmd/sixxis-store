'use client'

import { useEffect } from 'react'

export default function AdminError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[ROUTE-LAYOUT-ERROR] (admin)', {
      digest:   error.digest,
      message:  error.message,
      name:     error.name,
      stack:    error.stack?.substring(0, 1500),
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
    })
  }, [error])

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif', maxWidth: 820, margin: '40px auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f2e2b', marginBottom: 12 }}>
        Erro no painel admin
      </h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
        <strong>Path:</strong> <code style={{ fontFamily: 'monospace' }}>
          {typeof window !== 'undefined' ? window.location.pathname : ''}
        </code>
      </p>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
        <strong>Digest:</strong> <code style={{ fontFamily: 'monospace', color: '#dc2626' }}>{error.digest ?? '—'}</code>
      </p>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4, wordBreak: 'break-word' }}>
        <strong>Name:</strong> {error.name || '—'}
      </p>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, wordBreak: 'break-word' }}>
        <strong>Message:</strong> {error.message || '(sem mensagem)'}
      </p>
      {error.stack && (
        <pre style={{ fontSize: 11, color: '#374151', background: '#f3f4f6', padding: 12, borderRadius: 8, overflow: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap' }}>
          {error.stack.substring(0, 1500)}
        </pre>
      )}
      <button
        onClick={reset}
        style={{
          marginTop: 16, padding: '10px 20px', borderRadius: 10, background: '#3cbfb3',
          color: '#0f2e2b', fontWeight: 800, border: 'none', cursor: 'pointer',
        }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
