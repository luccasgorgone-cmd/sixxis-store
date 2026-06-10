'use client'
import { useCallback } from 'react'

/**
 * @deprecated Sistema B aposentado (Fase 1 analytics). O tracking interno foi
 * consolidado no Sistema A (lib/analytics/events.ts → /api/tracking, sessão no
 * cookie sixxis_sid). Este hook virou no-op para não quebrar imports antigos.
 * Para emitir eventos use os helpers de `@/lib/analytics/events`.
 */
export function useAnalytics() {
  const track = useCallback(async () => { /* no-op (deprecated) */ }, [])
  return { track }
}
