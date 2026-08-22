'use client'

// Cobre erro no próprio root layout — error.tsx não pega esse caso porque ele
// também vive dentro do layout que quebrou. Sem isto, um crash no layout raiz
// não aparece em lugar nenhum (nem no Sentry, nem no console do usuário).
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    console.error('[ROOT-LAYOUT-ERROR]', {
      digest: error.digest,
      message: error.message,
      stack: error.stack?.substring(0, 800),
    })
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body style={{ padding: 40, fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '40px auto' }}>
        <h1>Algo deu errado</h1>
        <p>Recarregue a página. Se persistir, entre em contato pelo WhatsApp.</p>
      </body>
    </html>
  )
}
