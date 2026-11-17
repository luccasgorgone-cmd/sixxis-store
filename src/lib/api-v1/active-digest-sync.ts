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
