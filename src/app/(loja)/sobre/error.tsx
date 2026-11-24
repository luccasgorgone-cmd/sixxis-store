'use client'

import { useEffect } from 'react'

export default function SobreError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[/sobre]', error.digest, error.message, error.stack)
  }, [error])
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-black text-sx-text mb-2">Erro ao carregar</h2>
        <p className="text-sm text-sx-muted mb-1">Tivemos um problema ao renderizar esta página.</p>
        {error.digest && <p className="text-[11px] font-mono text-sx-subtle mb-4">digest: {error.digest}</p>}
        <button
          onClick={reset}
          className="px-5 py-2 rounded-xl font-bold text-sm"
          style={{ background: 'var(--sx-accent)', color: '#0f2e2b' }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
