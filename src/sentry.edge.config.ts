// Init do Sentry no runtime edge (middleware/proxy). Mesmo guard de DSN
// ausente das outras configs — ver src/sentry.server.config.ts.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  environment: process.env.NODE_ENV,
})
