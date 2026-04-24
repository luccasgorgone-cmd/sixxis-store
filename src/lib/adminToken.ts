import crypto from 'crypto'

const ALGO = 'sha256'

export interface AdminTokenPayload {
  role: 'admin'
  iat: number
  exp: number
}

function b64urlEncode(data: Buffer | string): string {
  return Buffer.from(data).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): Buffer {
  let p = s.replace(/-/g, '+').replace(/_/g, '/')
  while (p.length % 4) p += '='
  return Buffer.from(p, 'base64')
}

function getSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET not configured')
  return s
}

export function signAdminToken(expiresInSeconds = 8 * 3600): string {
  const secret = getSecret()
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminTokenPayload = {
    role: 'admin',
    iat: now,
    exp: now + expiresInSeconds,
  }
  const payloadB64 = b64urlEncode(JSON.stringify(payload))
  const sig = crypto.createHmac(ALGO, secret).update(payloadB64).digest()
  return `${payloadB64}.${b64urlEncode(sig)}`
}

export function verifyAdminToken(token: string | undefined | null): AdminTokenPayload | null {
  if (!token) return null
  let secret: string
  try { secret = getSecret() } catch { return null }
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts

  const expected = crypto.createHmac(ALGO, secret).update(payloadB64).digest()
  let provided: Buffer
  try { provided = b64urlDecode(sigB64) } catch { return null }
  if (expected.length !== provided.length) return null
  if (!crypto.timingSafeEqual(expected, provided)) return null

  let payload: AdminTokenPayload
  try { payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8')) } catch { return null }
  if (payload.role !== 'admin') return null
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null

  return payload
}
