// Init do Sentry no runtime Node (server components, route handlers, webhooks).
// SENTRY_DSN ausente/vazio → SDK sobe mas fica inerte, mesmo padrão de
// degradação graciosa das outras integrações opcionais do projeto.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  environment: process.env.NODE_ENV,
})
