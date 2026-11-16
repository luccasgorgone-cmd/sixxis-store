import { isIP } from 'node:net'
import { assertJsonValue } from './format'
import type { JsonValue, RedactionOptions } from './types'

export const REDACTED = '[REDACTED]'

const normalizedKey = (key: string) => key.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase()
const forbidden = /(?:senha|password|passwd|secret|token|hash|salt|apikey|privatekey|authorization|cookie|credential|credencial|cvv|cvc|cardnumber|numerocartao|^pan$|pannumber|qrcode|pixcopiaecola|pixcopiacola|rawresponse|proximaacao|idempotencykey|instanceid|apiurl|pagamentoemprocessamentoem)/
export function isForbiddenKey(key: string): boolean {
  const normalized = normalizedKey(key)
  // Only the optional numeric usage counter is exempt; walk/redactAssignments enforce its value type.
  return normalized !== 'tokens' && forbidden.test(normalized)
}

/** Exact schema-owned non-secret preference key, never a generic cookie exemption. */
export function isSafePreferenceKey(key: string): boolean { return key === 'cookieCategs' }

type Mask = (value: unknown) => string | null
function scalarMask(format: (value: string) => string): Mask {
  return value => {
    if (value === null || value === undefined) return null
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return REDACTED
    return format(String(value))
  }
}
export const maskIdentifier: Mask = value => value === null || value === undefined ? null : REDACTED
export const maskAddress: Mask = maskIdentifier
export const maskIp: Mask = maskIdentifier
export const maskName = scalarMask(value => {
  const trimmed = value.trim()
  return trimmed ? `${Array.from(trimmed)[0]}***` : REDACTED
})
export const maskEmail = scalarMask(value => {
  const match = /^([^@\s])[^@\s]*@([a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,})$/i.exec(value)
  return match ? `${match[1]}***@${match[2]}` : REDACTED
})
export const maskPhone = scalarMask(value => {
  // Preserve only our complete canonical mask, never a prefix or arbitrary asterisks.
  if (/^\(\d{2}\) \d?\*{4}-\d{4}$/.test(value)) return value
  let digits = value.replace(/\D/g, '')
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2)
  if (digits.length !== 10 && digits.length !== 11) return REDACTED
  return `(${digits.slice(0, 2)}) ${digits.length === 11 ? `${digits[2]}****` : '****'}-${digits.slice(-4)}`
})
export const maskCpf = scalarMask(value => {
  if (/^\*{3}\.\*{3}\.\*{3}-\d{2}$/.test(value)) return value
  const digits = value.replace(/\D/g, '')
  return digits.length === 11 ? `***.***.***-${digits.slice(-2)}` : REDACTED
})
export const maskCnpj = scalarMask(value => {
  if (/^\*{2}\.\*{3}\.\*{3}\/\*{4}-\d{2}$/.test(value)) return value
  const digits = value.replace(/\D/g, '')
  return digits.length === 14 ? `**.***.***/****-${digits.slice(-2)}` : REDACTED
})

const messageKeys = new Set(['mensagem', 'mensagens', 'conteudo', 'content', 'copy', 'message', 'messages'])
export function isPrivateIdentityKey(key: string): boolean {
  const normalized = normalizedKey(key)
  return /^(?:sessionid|sessaoid|userid|useragent|gclid|fbclid|gbraid|wbraid|fbc|fbp|clientid|actor|actorid|identity|identidade|user|usuario|usuarioid|idusuario|iduser|customer|customerid|idcustomer|cliente|clienteid|idcliente|target|targetid|subject|subjectid|principalid|visitorid|visitanteid|createdby|updatedby)$/.test(normalized)
    || /^(?:[a-z]+)?(?:user|usuario|cliente|customer|client|actor|session|sessao|identity|identidade|visitor|visitante)(?:id|identifier)$/.test(normalized)
}
const maskRecipient: Mask = value => typeof value === 'string' && value.includes('@') ? maskEmail(value) : maskPhone(value)
function piiMask(key: string): Mask | null {
  if (/^(?:destinatario|recipient)$/.test(key)) return maskRecipient
  if (/^(?:email|emailautor|emailcliente|payeremail)$/.test(key)) return maskEmail
  if (/^(?:telefone|celular|phone|whatsapp|whatsappnumero|payerphone)$/.test(key)) return maskPhone
  if (/^(?:cpf|payercpf)$/.test(key)) return maskCpf
  if (/^(?:cnpj|payercnpj)$/.test(key)) return maskCnpj
  if (/^(?:nome|nomecompleto|nomeautor|nomecliente|nomefantasia|razaosocial|payername|payernome|criadopor)$/.test(key)) return maskName
  if (/^(?:endereco|address|logradouro|complemento|bairro|cep|cidadeuf|inscricaoestadual)$/.test(key)) return maskAddress
  if (/^(?:ip|clientip|ultimoip|ipaddress)$/.test(key)) return maskIp
  if (isPrivateIdentityKey(key)) return maskIdentifier
  if (/^(?:url|uri|href|path|pathname|route|rota|page|pagina|paginaorigem|landingpage|referer|referrer|link|linkdestino|[a-z]+url|[a-z]+uri|[a-z]+path)$/.test(key)) return maskIdentifier
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

const isUsageCounter = (value: unknown): value is number | null => value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)

/** Consume scalar assignments with escaped quotes intact; discard ambiguous structures. */
function redactAssignments(value: string, options: RedactionOptions): string {
  // Match the whole label (including combining marks and JSON Unicode escapes)
  // before normalizing it; an ASCII suffix match can silently miss its policy.
  const assignments = /(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|(?:\\*["'])?((?:\\u[0-9a-f]{4}|[\p{L}_])(?:\\u[0-9a-f]{4}|[\p{L}\p{M}\p{N}\p{Cf}_.-]){0,200})(?:\\*["'])?)\s*[:=]\s*/giu
  let result = ''
  let consumed = 0
  for (const match of value.matchAll(assignments)) {
    const start = match.index!
    if (start < consumed) continue
    const key = (match[1] ?? match[2] ?? match[3]).replace(/\\u([0-9a-f]{4})/gi, (_escape, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    const normalized = normalizedKey(key), leaf = normalizedKey(key.split('.').at(-1)!)
    const secret = isForbiddenKey(key) || normalized === 'tokens'
    const message = !options.allowMessages && (messageKeys.has(normalized) || messageKeys.has(leaf))
    const mask = !options.allowPii ? piiMask(normalized) ?? piiMask(leaf) : null
    if (!secret && !message && !mask) continue
    const from = start + match[0].length
    const first = value[from]
    // No partial replacement of object/array payloads or escaped outer JSON: a
    // regex cannot establish their complete value boundary without interpreting it.
    if (match[0].includes('\\') || first === '{' || first === '[' || first === '\\' || first === undefined) return REDACTED
    // Unquoted message prose has no unambiguous value boundary (commas/newlines
    // may belong to the message). Fail closed for this text, not sibling JSON fields.
    if (message && first !== '"' && first !== "'") return REDACTED
    // Names, identities and addresses can contain spaces/punctuation. Taking
    // only the first token would leave the rest of an unquoted identity raw.
    if ((mask === maskIdentifier || mask === maskName) && first !== '"' && first !== "'") return REDACTED
    let end = from, scalar: string
    if (first === '"' || first === "'") {
      end++
      while (end < value.length && value[end] !== first) end += value[end] === '\\' ? 2 : 1
      if (end >= value.length) return REDACTED
      end++
      scalar = value.slice(from + 1, end - 1)
    } else {
      scalar = (mask ? /^(?:\(\d{2}\) \d?\*{4}-\d{4}|[^\s,;&}<>\]]+)/ : /^[^\s,;&}<>\]]+/).exec(value.slice(from))?.[0] ?? ''
      if (!scalar.trim()) return REDACTED
      end += scalar.length
      if (normalized === 'tokens' && /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(scalar) && isUsageCounter(Number(scalar))) continue
    }
    result += value.slice(consumed, start) + (!secret && !message && mask ? `${key}=${mask(scalar)}` : REDACTED)
    consumed = end
  }
  return result + value.slice(consumed)
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
  result = redactAssignments(result, options)

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
    result = result.replace(/(["']?)([a-z][a-z0-9_.-]{0,70})\1\s*[:=]\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|(\(\d{2}\) \d?\*{4}-\d{4}|[^\s,;&}<>]+))/gi,
      (whole, _quote: string, key: string, double: string, single: string, bare: string) => {
        const mask = piiMask(normalizedKey(key))
        return mask ? `${key}=${mask(double ?? single ?? bare)}` : whole
      })
    result = result.replace(/\b(cpf|cnpj|telefone|celular|phone|sessaoId|sessionId|gclid|fbclid)\s+(\(\d{2}\) \d?\*{4}-\d{4}|\+?[\w().-]+)/gi,
      (whole, key: string, value: string) => {
        const mask = piiMask(normalizedKey(key))
        return mask ? `${key} ${mask(value)}` : whole
      })
  }
  return result
}

function walk(value: JsonValue, options: RedactionOptions, depth: number, safeRootKeys: readonly string[] = []): JsonValue {
  if (depth > 32) throw new TypeError('Redaction nesting is too deep')
  if (typeof value === 'string') return sanitizeText(value, options, depth)
  if (typeof value === 'number' && looksLikePan(String(value))) return REDACTED
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(child => walk(child, options, depth + 1))
  const result: Record<string, JsonValue> = {}
  for (const [key, child] of Object.entries(value)) {
    if (isForbiddenKey(key) && !(depth === 0 && safeRootKeys.includes(key))) continue
    const normalized = normalizedKey(key)
    if (normalized === 'tokens' && !isUsageCounter(child)) continue
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
export function redactValue(value: unknown, options: RedactionOptions, safeRootKeys: readonly string[] = []): unknown {
  if (safeRootKeys.some(key => !isSafePreferenceKey(key))) throw new TypeError('Invalid safe preference key')
  assertJsonValue(value)
  return walk(value as JsonValue, options, 0, safeRootKeys)
}

/** Only declared structural joins may restore opaque IDs at the resource root.
 * This never propagates into arbitrary JSON or bypasses secret/PAN sanitization. */
export function restoreStructuralIds(raw: Record<string, unknown>, safe: Record<string, unknown>, fields: readonly string[] = [], options: RedactionOptions): void {
  for (const field of fields) {
    if (field !== 'clienteId') throw new TypeError('Invalid structural identifier field')
    if (!Object.hasOwn(raw, field)) continue
    const value = raw[field]
    safe[field] = value === null ? null : options.allowPii || (typeof value === 'string' && /^(?:c[a-z0-9]{24}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(value))
      ? redactValue(value, { ...options, allowPii: true }) : REDACTED
  }
}

/** Definition-owned flat array/object/string leaves only; never a client path expression. */
export type PublicJsonFields = Readonly<Record<string, readonly string[]>>
export function restorePublicJsonFields(raw: Record<string, unknown>, safe: Record<string, unknown>, policy: PublicJsonFields = {}, options: RedactionOptions = { allowPii: false, allowMessages: false }): void {
  for (const [root, leaves] of Object.entries(policy)) {
    if (leaves.some(isPrivateIdentityKey)) throw new TypeError('Invalid public JSON identity policy')
    const source = raw[root], target = safe[root]
    if (source === undefined || source === null) continue
    if (!Array.isArray(source) || !Array.isArray(target) || source.length !== target.length) throw new TypeError('Invalid public JSON value')
    source.forEach((item, index) => {
      const output = target[index]
      if (!item || typeof item !== 'object' || Array.isArray(item) || !output || typeof output !== 'object' || Array.isArray(output)) throw new TypeError('Invalid public JSON value')
      for (const leaf of leaves) if (Object.hasOwn(item, leaf)) {
        const value = (item as Record<string, unknown>)[leaf]
        if (value !== null && typeof value !== 'string') throw new TypeError('Invalid public JSON value')
        Object.defineProperty(output, leaf, { value: redactValue(value, { ...options, allowPii: true }), enumerable: true, configurable: true, writable: true })
      }
    })
  }
}
