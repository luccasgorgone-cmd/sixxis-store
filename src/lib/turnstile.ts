// Verificação server-side do token do Cloudflare Turnstile.
//
// PRODUÇÃO = FAIL-CLOSED: se TURNSTILE_SECRET_KEY não estiver definida em
// produção, a verificação NÃO é pulada — retorna false (bloqueia), para que um
// deploy mal configurado nunca rode com a proteção anti-bot silenciosamente
// desligada.
//
// DEV = degradação graciosa: fora de produção, sem secret, retorna true (pula)
// para que login/cadastro/checkout continuem funcionando no ambiente local.
//
// Com o secret definido: token ausente/inválido → false (bloqueia).

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstile(
  token: string | undefined | null,
  ip?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // Fail-closed: proteção obrigatória ausente em produção → bloqueia.
      console.error('[turnstile] TURNSTILE_SECRET_KEY ausente em produção — bloqueando (fail-closed).')
      return false
    }
    return true // dev → pula (degradação graciosa)
  }
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
