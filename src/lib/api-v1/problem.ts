import { redactValue } from './redact'
import type { ProblemDetails } from './types'

/** RFC 9457; never echo raw exceptions or request credentials through problem text. */
export function problem(status: number, title: string, detail: string, requestId: string, type = 'about:blank'): Response {
  const safe = (value: string) => String(redactValue(value, { allowPii: false, allowMessages: false }))
  const body: ProblemDetails = { type, title: safe(title), status, detail: safe(detail), requestId }
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/problem+json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Request-Id': requestId,
    },
  })
}
