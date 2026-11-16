import { isIP } from 'node:net'
import { assertJsonValue } from './format'
import type { JsonValue, RedactionOptions } from './types'

export const REDACTED = '[REDACTED]'

const normalizedKey = (key: string) => key.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase()
const forbidden = /(?:senha|password|passwd|secret|token|hash|salt|apikey|privatekey|authorization|cookie|credential|credencial|cvv|cvc|cardnumber|numerocartao|^pan$|pannumber|qrcode|pixcopiaecola|pixcopiacola|rawresponse|proximaacao|idempotencykey|instanceid|apiurl|pagamentoemprocessamentoem)/
export function isForbiddenKey(key: string): boolean {
  const normalized = normalizedKey(key)
  // LunaMensagem.tokens is a usage counter, not a credential.
  return normalized !== 'tokens' && forbidden.test(normalized)
}

type Mask = (value: unknown) => string | null
const text = (value: unknown) => value === null || value === undefined ? null : String(value)
export const maskIdentifier: Mask = value => text(value) === null ? null : REDACTED
export const maskAddress: Mask = maskIdentifier
export const maskIp: Mask = maskIdentifier
export const maskName: Mask = value => {
  const valueText = text(value)?.trim()
  return valueText === undefined ? null : valueText ? `${Array.from(valueText)[0]}***` : REDACTED
}
export const maskEmail: Mask = value => {
  const valueText = text(value)
  if (valueText === null) return null
  const match = /^([^@\s])[^@\s]*@([a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,})$/i.exec(valueText)
  return match ? `${match[1]}***@${match[2]}` : REDACTED
}
export const maskPhone: Mask = value => {
  const valueText = text(value)
  if (valueText === null) return null
  let digits = valueText.replace(/\D/g, '')
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2)
  if (digits.length !== 10 && digits.length !== 11) return REDACTED
  return `(${digits.slice(0, 2)}) ${digits.length === 11 ? `${digits[2]}****` : '****'}-${digits.slice(-4)}`
}
export const maskCpf: Mask = value => {
  const valueText = text(value)
  return valueText === null ? null : valueText.replace(/\D/g, '').length === 11 ? `***.***.***-${valueText.replace(/\D/g, '').slice(-2)}` : REDACTED
}
export const maskCnpj: Mask = value => {
  const valueText = text(value)
  return valueText === null ? null : valueText.replace(/\D/g, '').length === 14 ? `**.***.***/****-${valueText.replace(/\D/g, '').slice(-2)}` : REDACTED
}

const messageKeys = new Set(['mensagem', 'mensagens', 'conteudo', 'content', 'copy', 'message', 'messages'])
function piiMask(key: string): Mask | null {
  if (/^(?:email|emailautor|emailcliente|payeremail|destinatario|recipient)$/.test(key)) return maskEmail
  if (/^(?:telefone|celular|phone|whatsapp|whatsappnumero|payerphone)$/.test(key)) return maskPhone
  if (/^(?:cpf|payercpf)$/.test(key)) return maskCpf
  if (/^(?:cnpj|payercnpj)$/.test(key)) return maskCnpj
  if (/^(?:nome|nomecompleto|nomeautor|nomecliente|nomefantasia|razaosocial|payername|payernome|criadopor)$/.test(key)) return maskName
  if (/^(?:endereco|address|logradouro|complemento|bairro|cep|cidadeuf|inscricaoestadual)$/.test(key)) return maskAddress
  if (/^(?:ip|clientip|ultimoip|ipaddress)$/.test(key)) return maskIp
  if (/^(?:sessionid|sessaoid|userid|useragent|gclid|fbclid|gbraid|wbraid|fbc|fbp|clientid)$/.test(key)) return maskIdentifier
  return null
}

// Detect provider identifiers rather than guessing arbitrary high-entropy strings (UUIDs, SKUs, ids).
const secretPatterns = [
  /\bBearer\s+[a-z0-9._~+\/-]+=*/gi,
  /\bBasic\s+[a-z0-9+/]+={0,2}/gi,
  /\bsx[sc]_live_[a-z0-9_-]{20,}/gi,
  /\bsk-(?:(?:proj|ant|live|test)-)?[a-z0-9_-]{20,}/gi,
  /\b(?:gh[pousr]_[a-z0-9]{20,}|github_pat_[a-z0-9_]{20,})/gi,
  /\bxox[baprs]-[a-z0-9-]{10,}/gi,
  /\b(?:APP_USR|TEST)-[a-z0-9_-]{20,}/gi,
  /\bAIza[a-z0-9_-]{30,}/gi,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  /\beyJ[a-z0-9_-]{5,}\.[a-z0-9_-]{5,}\.[a-z0-9_-]{5,}/gi,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
]

function luhn(digits: string): boolean {
  let sum = 0
  let twice = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i])
    if (twice) { digit *= 2; if (digit > 9) digit -= 9 }
    sum += digit
    twice = !twice
  }
  return sum % 10 === 0 && !/^(\d)\1+$/.test(digits)
}

function looksLikePan(digits: string): boolean {
  // Major card issuer prefixes + checksum avoid treating timestamp/id runs as cards.
  return /^\d{13,19}$/.test(digits) && /^(?:4|[56]\d|2[2-7]|3(?:0[0-5]|[4-9]))/.test(digits) && luhn(digits)
}

function sanitizeText(value: string, options: RedactionOptions, depth: number): string {
  // JSON stored as text must follow the same key policy as actual JSON, not a token-only regex.
  if (depth < 32 && /^\s*[\[{\"]/.test(value)) {
    let parsed: unknown
    try { parsed = JSON.parse(value) } catch { /* Free text, continue with lexical redaction. */ }
    if (parsed !== undefined) return JSON.stringify(walk(parsed as JsonValue, options, depth + 1))
  }
  let result = value
  for (const pattern of secretPatterns) result = result.replace(pattern, REDACTED)

  // Handles credentials inside malformed JSON, prose, URL query strings and header-like text.
  result = result.replace(/(["']?)([a-z][a-z0-9_.-]{0,70})\1\s*[:=]\s*(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;&}<>]+)/gi,
    (whole, _quote: string, key: string) => isForbiddenKey(key) ? REDACTED : whole)
  result = result.replace(/\\["']([a-z][a-z0-9_.-]{0,70})\\["']\s*[:=]\s*\\["'][^\\\r\n]*\\["']/gi,
    (whole, key: string) => isForbiddenKey(key) ? REDACTED : whole)

  // A bare digit run is a PAN only with an issuer prefix and checksum. Numeric business ids
  // would be erased. Labeled card numbers are always removed by the key/assignment policy.
  result = result.replace(/(?<![\w.])\d(?:[ -]?\d){12,18}(?![\w.]|[ -]?\d)/g, candidate => {
    const digits = candidate.replace(/\D/g, '')
    return looksLikePan(digits) ? REDACTED : candidate
  })

  if (!options.allowPii) {
    result = result.replace(/[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, value => maskEmail(value)!)
      .replace(/(?<!\d)\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}(?!\d)/g, value => maskCnpj(value)!)
      .replace(/(?<!\d)\d{3}\.\d{3}\.\d{3}-\d{2}(?!\d)/g, value => maskCpf(value)!)
      .replace(/(?<!\d)(?:\+55[ .-]?)?\(?[1-9]\d\)?[ .-]?9?\d{4}-\d{4}(?!\d)/g, value => maskPhone(value)!)
      .replace(/(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])/g, value => isIP(value) ? REDACTED : value)
      .replace(/(?<![\w:])(?:[a-f0-9]{0,4}:){2,}[a-f0-9:.]*(?![\w:])/gi, value => isIP(value) ? REDACTED : value)
    // Labeled unformatted PII is identifiable; arbitrary bare numbers/names are not.
    result = result.replace(/(["']?)([a-z][a-z0-9_.-]{0,70})\1\s*[:=]\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|([^\s,;&}<>]+))/gi,
      (whole, _quote: string, key: string, double: string, single: string, bare: string) => {
        const mask = piiMask(normalizedKey(key))
        return mask ? `${key}=${mask(double ?? single ?? bare)}` : whole
      })
    result = result.replace(/\b(cpf|cnpj|telefone|celular|phone|sessaoId|sessionId|gclid|fbclid)\s+(\+?[\w().-]+)/gi,
      (whole, key: string, value: string) => {
        const mask = piiMask(normalizedKey(key))
        return mask ? `${key} ${mask(value)}` : whole
      })
  }
  return result
}

function walk(value: JsonValue, options: RedactionOptions, depth: number): JsonValue {
  if (depth > 32) throw new TypeError('Redaction nesting is too deep')
  if (typeof value === 'string') return sanitizeText(value, options, depth)
  if (typeof value === 'number' && looksLikePan(String(value))) return REDACTED
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(child => walk(child, options, depth + 1))
  const result: Record<string, JsonValue> = {}
  for (const [key, child] of Object.entries(value)) {
    if (isForbiddenKey(key)) continue
    const normalized = normalizedKey(key)
    if (!options.allowMessages && messageKeys.has(normalized)) continue
    const mask = !options.allowPii ? piiMask(normalized) : null
    // defineProperty also treats untrusted __proto__ keys as inert data.
    // Sanitize secrets before masking, but do not apply the PII mask twice.
    const safe = walk(child, mask ? { ...options, allowPii: true } : options, depth + 1)
    Object.defineProperty(result, key, { value: mask ? mask(safe) : safe, enumerable: true, writable: true, configurable: true })
  }
  return result
}

/** Defense in depth, never a replacement for a resource-specific field allowlist. */
export function redactValue(value: unknown, options: RedactionOptions): unknown {
  assertJsonValue(value)
  return walk(value as JsonValue, options, 0)
}
