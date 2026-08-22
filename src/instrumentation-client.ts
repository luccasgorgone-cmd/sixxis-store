// Init do Sentry no browser. NEXT_PUBLIC_SENTRY_DSN ausente/vazio → SDK sobe
// mas fica inerte (dsn undefined não envia nada) — mesmo padrão de degradação
// graciosa do Turnstile/Upstash (ver .env.example).
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  environment: process.env.NODE_ENV,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
