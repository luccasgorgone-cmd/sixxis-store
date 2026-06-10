// Verificação server-side do token do Cloudflare Turnstile.
//
// DEGRADAÇÃO GRACIOSA (regra inegociável): se TURNSTILE_SECRET_KEY não estiver
// definida, NÃO verifica e NÃO bloqueia — retorna true (pula). Assim login/
// cadastro/checkout continuam funcionando antes das vars serem configuradas.
//
// Com o secret definido: token ausente/ inválido → false (bloqueia).

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstile(
  token: string | undefined | null,
  ip?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // sem secret → pula (degradação graciosa)
  if (!token) return false

  try {
    const form = new URLSearchParams()
    form.append('secret', secret)
    form.append('response', token)
    if (ip) form.append('remoteip', ip)

    const res = await fetch(VERIFY_URL, { method: 'POST', body: form })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    // Falha de rede na verificação não deve derrubar o fluxo de auth; loga e
    // bloqueia (secret está setado → é um modo "fail-closed" consciente).
    console.error('[turnstile] falha ao verificar token')
    return false
  }
}
