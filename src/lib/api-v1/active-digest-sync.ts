import type { PrismaClient } from '@prisma/client'
import { activeDigestStore, type ActiveDigestStore } from './active-digests'
import { loadActiveApiKeyDigests } from './auth'
import { API_QUERY_TIMEOUT_MS } from './constants'
import { withQueryTimeout } from './resource'

export async function reconcileActiveApiKeyDigests(
  prisma: PrismaClient,
  store: Pick<ActiveDigestStore, 'replaceFrom'> = activeDigestStore,
): Promise<void> {
  await store.replaceFrom(() => withQueryTimeout(
    () => loadActiveApiKeyDigests({ prisma }),
    API_QUERY_TIMEOUT_MS,
  ))
}

type InitializerOptions = {
  reconcile: () => Promise<void>
  now?: () => number
  retryMs?: number
}

export function createActiveDigestInitializer(options: InitializerOptions): () => Promise<void> {
  const now = options.now ?? Date.now
  const retryMs = options.retryMs ?? 60_000
  let inFlight: Promise<void> | null = null
  let retryAt = 0
  return async () => {
    if (inFlight) return await inFlight
    if (now() < retryAt) throw new Error('Active digest initialization unavailable')
    const current = (async () => {
      try {
        await options.reconcile()
        retryAt = 0
      } catch {
        retryAt = now() + retryMs
        throw new Error('Active digest initialization unavailable')
      }
    })()
    inFlight = current
    try {
      await current
    } finally {
      if (inFlight === current) inFlight = null
    }
  }
}

export const ensureActiveApiKeyDigests = createActiveDigestInitializer({
  reconcile: async () => {
    const { prisma } = await import('../prisma')
    await reconcileActiveApiKeyDigests(prisma)
  },
})
