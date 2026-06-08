// Token de redefinição de senha — STATELESS (HMAC), sem tabela/migração.
// payload = base64url({ cid, exp }); assinatura = HMAC-SHA256(payload.fingerprint).
// O fingerprint deriva do hash ATUAL da senha → o token vira single-use: assim
// que a senha é trocada, o hash muda e o token deixa de validar. Tokens de
// contas OAuth-first (senha == '') não são emitidos (nada a redefinir).
import crypto from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || ''
const TTL_MS = 1000 * 60 * 60 // 1 hora

function sign(data: string): string {
  return crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
}

function fingerprint(senhaHash: string): string {
  return crypto.createHash('sha256').update(senhaHash).digest('base64url').slice(0, 16)
}

export function gerarResetToken(clienteId: string, senhaHash: string): string {
  const payload = Buffer.from(JSON.stringify({ cid: clienteId, exp: Date.now() + TTL_MS })).toString('base64url')
  return `${payload}.${sign(`${payload}.${fingerprint(senhaHash)}`)}`
}

export interface ResetTokenLido {
  cid: string
  exp: number
  payload: string
  sig: string
}

export function lerResetToken(token: string): ResetTokenLido | null {
  const [payload, sig] = String(token ?? '').split('.')
  if (!payload || !sig) return null
  try {
    const obj = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { cid?: string; exp?: number }
    if (!obj.cid || !obj.exp) return null
    return { cid: obj.cid, exp: obj.exp, payload, sig }
  } catch {
    return null
  }
}

export function resetTokenValido(t: ResetTokenLido, senhaHash: string): boolean {
  if (!SECRET) return false
  if (Date.now() > t.exp) return false
  const esperado = sign(`${t.payload}.${fingerprint(senhaHash)}`)
  try {
    return crypto.timingSafeEqual(Buffer.from(t.sig), Buffer.from(esperado))
  } catch {
    return false
  }
}
