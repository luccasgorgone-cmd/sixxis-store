import { Prisma } from '@prisma/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_SCOPES, API_VERSION } from './constants'
import { iso, itemEnvelope, listEnvelope, money } from './format'
import { problem } from './problem'
import {
  isForbiddenKey, maskAddress, maskCnpj, maskCpf, maskEmail, maskIdentifier,
  maskIp, maskName, maskPhone, redactValue,
} from './redact'

const full = { allowPii: true, allowMessages: true }
const restricted = { allowPii: false, allowMessages: false }
afterEach(() => vi.useRealTimers())

describe('API v1 wire contracts', () => {
  it('fixes the version and independently lists additive scopes', () => {
    expect(API_VERSION).toBe('1.0.0')
    expect(API_SCOPES).toContain('read:pii')
    expect(API_SCOPES).toContain('read:mensagens')
  })

  it.each([400, 401, 403, 404, 429, 500, 503])('returns RFC 9457 for %i without CORS', async status => {
    const response = problem(status, 'Título', 'Detalhe', 'req-123')
    expect(response.status).toBe(status)
    expect(response.headers.get('content-type')).toBe('application/problem+json; charset=utf-8')
    expect(response.headers.get('x-request-id')).toBe('req-123')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.has('access-control-allow-origin')).toBe(false)
    expect(await response.json()).toEqual({ type: 'about:blank', title: 'Título', status, detail: 'Detalhe', requestId: 'req-123' })
  })

  it('accepts a problem type URI and removes secrets from problem text', async () => {
    const result = await problem(400, 'Inválido', 'falhou: Bearer abcDEF_123456', 'req-1', 'urn:sixxis:invalid-query').json()
    expect(result.type).toBe('urn:sixxis:invalid-query')
    expect(result.detail).not.toContain('abcDEF_123456')
  })

  it('creates the exact list and item envelopes with UTC generation time', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-11-16T15:45:00-03:00'))
    expect(listEnvelope([{ id: 'a' }], { hasMore: true, nextCursor: 'cursor' }, 'req-1')).toEqual({
      data: [{ id: 'a' }], meta: { requestId: 'req-1', count: 1, hasMore: true, nextCursor: 'cursor', generatedAt: '2026-11-16T18:45:00.000Z', apiVersion: '1.0.0' },
    })
    expect(listEnvelope([], { hasMore: false, nextCursor: null }, 'req-2').meta).toMatchObject({ count: 0, hasMore: false, nextCursor: null })
    expect(itemEnvelope({ id: 'a' }, 'req-1')).toEqual({ data: { id: 'a' }, meta: { requestId: 'req-1', generatedAt: '2026-11-16T18:45:00.000Z' } })
  })

  it.each([new Date(), new Prisma.Decimal('1.50'), BigInt(12), NaN, Infinity, undefined])('refuses unformatted non-JSON payload %s', value => {
    expect(() => itemEnvelope({ value }, 'req')).toThrow(TypeError)
    expect(() => listEnvelope([{ value }], { hasMore: false, nextCursor: null }, 'req')).toThrow(TypeError)
  })
})

describe('lossless money and date formatting', () => {
  it.each([
    [new Prisma.Decimal('12.5'), false, '12.50'], [123450, true, '1234.50'],
    [new Prisma.Decimal('123450'), true, '1234.50'], ['9007199254740993.99', false, '9007199254740993.99'],
    [BigInt('900719925474099312345'), true, '9007199254740993123.45'],
    [0, false, '0.00'], [-125, true, '-1.25'], ['1.005', false, '1.01'], ['-1.005', false, '-1.01'],
    ['9.999', false, '10.00'], ['1e-3', false, '0.00'], ['1.2345e5', true, '1234.50'],
    [null, false, null], [undefined, false, null],
  ])('formats %s, cents=%s as %s', (value, cents, expected) => expect(money(value, cents)).toBe(expected))

  it.each([NaN, Infinity, 'not-money', '', {}, '1e999999'])('rejects malformed money %s', value => {
    expect(() => money(value as never)).toThrow()
  })

  it('normalizes UTC and refuses invalid/non-Date inputs', () => {
    expect(iso(new Date('2026-11-16T15:45:00-03:00'))).toBe('2026-11-16T18:45:00.000Z')
    expect(() => iso(new Date('bad'))).toThrow()
    expect(() => iso('2026-11-16' as never)).toThrow()
  })
})

describe('deterministic masks', () => {
  it.each([
    [maskPhone, '+55 (11) 91234-5678', '(11) 9****-5678'],
    [maskPhone, '1134561234', '(11) ****-1234'],
    [maskCpf, '529.982.247-25', '***.***.***-25'],
    [maskCnpj, '11.222.333/0001-81', '**.***.***/****-81'],
  ] as const)('preserves only canonical masks across repeated passes: %s', (mask, raw, masked) => {
    expect(mask(raw)).toBe(masked)
    expect(mask(masked)).toBe(masked)
    for (const tainted of [`${masked} token=secret`, `${masked} 4111111111111111`, `prefix ${masked}`, masked.replace('*', '1')]) expect(mask(tainted)).toBe('[REDACTED]')
  })

  it('redacts secrets and PAN while preserving useful PII masks on a second recursive pass', () => {
    const input = { telefone: '+55 (11) 91234-5678', cpf: '529.982.247-25', cnpj: '11.222.333/0001-81', nested: [{ telefone: '(11) 9****-5678', cpf: '***.***.***-25', cnpj: '**.***.***/****-81', token: 'DO-NOT-LEAK', detalhe: 'token=DO-NOT-LEAK 4111111111111111' }] }
    const expected = { telefone: '(11) 9****-5678', cpf: '***.***.***-25', cnpj: '**.***.***/****-81', nested: [{ telefone: '(11) 9****-5678', cpf: '***.***.***-25', cnpj: '**.***.***/****-81', detalhe: '[REDACTED] [REDACTED]' }] }
    const once = redactValue(input, restricted)
    expect(once).toEqual(expected)
    expect(redactValue(once, restricted)).toEqual(expected)
  })

  it.each([
    ['telefone=11912345678', 'telefone=(11) 9****-5678'],
    ['telefone (11) 91234-5678', 'telefone (11) 9****-5678'],
  ])('also preserves a complete phone mask in labeled free text: %s', (input, expected) => {
    const once = redactValue(`${input}; token=DO-NOT-LEAK; 4111111111111111`, restricted)
    expect(once).toBe(`${expected}; [REDACTED]; [REDACTED]`)
    expect(redactValue(once, restricted)).toBe(once)
  })

  it('masks email, phone, documents, name, address, IP and correlation identifiers', () => {
    expect(maskEmail('joao@gmail.com')).toBe('j***@gmail.com')
    expect(maskPhone('+55 (11) 91234-5678')).toBe('(11) 9****-5678')
    expect(maskPhone('1134561234')).toBe('(11) ****-1234')
    expect(maskCpf('529.982.247-25')).toBe('***.***.***-25')
    expect(maskCnpj('11.222.333/0001-81')).toBe('**.***.***/****-81')
    expect(maskName('João Silva')).toBe('J***')
    for (const result of [maskAddress('Rua A, 123'), maskIp('192.0.2.1'), maskIdentifier('session-customer-abc')]) expect(result).toBe('[REDACTED]')
    expect(maskEmail(null)).toBeNull()
    expect(maskPhone('invalid')).toBe('[REDACTED]')
  })

  it('treats PII and message permission as independent flags recursively', () => {
    const input = { email: 'joao@gmail.com', mensagem: 'Contato: joao@gmail.com', children: [{ cpf: '529.982.247-25', ip: '192.0.2.1', sessionId: 'abc' }] }
    expect(redactValue(input, restricted)).toEqual({ email: 'j***@gmail.com', children: [{ cpf: '***.***.***-25', ip: '[REDACTED]', sessionId: '[REDACTED]' }] })
    expect(redactValue(input, { allowPii: true, allowMessages: false })).toEqual({ email: input.email, children: input.children })
    expect(redactValue(input, { allowPii: false, allowMessages: true })).toMatchObject({ mensagem: 'Contato: j***@gmail.com' })
    expect(redactValue(input, full)).toEqual(input)
  })

  it('masks entire address objects without leaking nested location, identity or house number', () => {
    expect(redactValue({ endereco: { logradouro: 'Rua A', numero: '123', cidade: 'Araçatuba', id: 'addr-1' }, nome: 'João' }, restricted)).toEqual({ endereco: '[REDACTED]', nome: 'J***' })
  })

  it('masks PII embedded in free text/JSON without damaging dates or money', () => {
    const text = 'email joao@gmail.com; CPF 529.982.247-25; CNPJ 11.222.333/0001-81; tel (11) 91234-5678; IP 192.0.2.1; em 2026-11-16T18:45:00.000Z por 1234.50'
    const result = String(redactValue(text, restricted))
    for (const pii of ['joao@gmail.com', '529.982.247-25', '11.222.333/0001-81', '91234-5678', '192.0.2.1']) expect(result).not.toContain(pii)
    expect(result).toContain('2026-11-16T18:45:00.000Z por 1234.50')
    expect(JSON.parse(String(redactValue('{"email":"joao@gmail.com","senha":"hidden","ok":true}', restricted)))).toEqual({ email: 'j***@gmail.com', ok: true })
  })
})

describe('absolute secret and payment redaction', () => {
  it.each([
    'conteúdo=PRIVATE-MESSAGE', 'debug {"conteúdo":"PRIVATE-MESSAGE", malformed',
    String.raw`debug {"\u006densagem":"PRIVATE-MESSAGE", malformed`,
    String.raw`debug {"conte\u00fado":"PRIVATE-MESSAGE", malformed`,
    String.raw`debug {"\u006d\u0065\u006e\u0073\u0061\u0067\u0065\u006d":"PRIVATE-MESSAGE", malformed`,
    'conteu\u0301do=PRIVATE-MESSAGE', 'ｃｏｎｔｅúｄｏ=PRIVATE-MESSAGE',
    'debug {"con teúdo":"PRIVATE-MESSAGE", malformed', 'con\u200bteúdo=PRIVATE-MESSAGE',
  ])('round 2: normalizes Unicode/escaped assignment labels without elevating scopes: %s', input => {
    for (const allowPii of [false, true]) for (const allowMessages of [false, true]) {
      const output = String(redactValue(`${input}; token=DO-NOT-LEAK; 4111111111111111`, { allowPii, allowMessages }))
      expect(output).not.toMatch(/DO-NOT-LEAK|4111111111111111/)
      expect(output.includes('PRIVATE-MESSAGE')).toBe(allowMessages)
    }
  })
  it.each(['actor=Maria da Silva; status=ok', 'nome=Maria da Silva; status=ok', 'identity=Maria da Silva; status=ok', String.raw`\u0061ctor=Maria da Silva; status=ok`, String.raw`debug {"\u0061ctor":"Maria da Silva", malformed`])('round 2: never leaves trailing words of ambiguous PII assignments: %s', input => {
    for (const allowPii of [false, true]) for (const allowMessages of [false, true]) {
      const output = String(redactValue(`${input}; token=DO-NOT-LEAK; 4111111111111111`, { allowPii, allowMessages }))
      expect(output).not.toMatch(/DO-NOT-LEAK|4111111111111111/)
      if (allowPii) expect(output).toContain('Maria da Silva')
      else expect(output).not.toMatch(/Maria|Silva/)
    }
  })
  it.each(['actor', 'actorId', 'clienteId', 'customerId', 'clientId', 'user', 'usuario', 'customer', 'cliente', 'identity', 'identidade', 'idUsuario', 'idCliente', 'target', 'url', 'landingPage', 'redirectUrl', 'requestUrl', 'path', 'pagina', 'referer', 'referrer'])('round 1: protects nominal identity/URL key recursively: %s', key => {
    const value = 'PRIVATE-IDENTITY token=DO-NOT-LEAK 4111111111111111'
    const payload = { sibling: 'operational', nested: [{ [key]: value, count: 3, produtoId: 'public-product' }] }
    expect(redactValue(payload, restricted)).toEqual({ sibling: 'operational', nested: [{ [key]: '[REDACTED]', count: 3, produtoId: 'public-product' }] })
    expect(redactValue(payload, full)).toEqual({ sibling: 'operational', nested: [{ [key]: 'PRIVATE-IDENTITY [REDACTED] [REDACTED]', count: 3, produtoId: 'public-product' }] })
    expect(JSON.parse(String(redactValue(JSON.stringify(payload), restricted)))).toEqual(redactValue(payload, restricted))
  })
  it.each([
    'mensagem=PRIVATE-MESSAGE', 'MESSAGE: "PRIVATE-MESSAGE"; status=ok', "conteudo='PRIVATE-MESSAGE'; status=ok",
    'copy=PRIVATE-MESSAGE with several words; status=ok', 'payload.messages=PRIVATE-MESSAGE',
    'debug {"mensagem":"PRIVATE-MESSAGE", malformed', 'debug {"content": {"text":"PRIVATE-MESSAGE"}}',
    'debug {\\"message\\":\\"PRIVATE-MESSAGE\\"}', 'mensagem="PRIVATE-MESSAGE\\" tail"', 'mensagem="PRIVATE-MESSAGE unterminated',
    'mensagem=first words, PRIVATE-MESSAGE; status=ok', 'mensagem=first line\nPRIVATE-MESSAGE; status=ok',
  ])('round 1: protects textual/malformed message assignments without additive scope: %s', input => {
    expect(String(redactValue(input, { allowPii: true, allowMessages: false }))).not.toContain('PRIVATE-MESSAGE')
    expect(String(redactValue(input, full))).toContain('PRIVATE-MESSAGE')
    expect(String(redactValue(`${input}; token=DO-NOT-LEAK 4111111111111111`, full))).not.toMatch(/DO-NOT-LEAK|4111111111111111/)
  })
  it('round 1: message redaction does not erase ordinary public product prose', () => {
    const value = 'Produto Sixxis: descrição pública, copy comercial de verão; status=ativo'
    expect(redactValue(value, restricted)).toBe(value)
  })
  it.each(['senha', 'password', 'passwordHash', 'hash', 'salt', 'token', 'tokenAcesso', 'accessToken', 'refresh_token', 'api-key', 'webhookSecret', 'clientSecret', 'authorization', 'cookie', 'privateKey', 'cardNumber', 'numeroCartao', 'pan', 'cvv', 'cvc', 'pixQrCode', 'rawResponse', 'proximaAcao', 'visitorHash', 'idempotencyKey', 'apiUrl', 'instanceId', 'pagamentoEmProcessamentoEm'])('removes prohibited key %s at every depth, even with full permissions', key => {
    expect(isForbiddenKey(key)).toBe(true)
    expect(redactValue({ [key]: 'hidden', nested: [{ [key]: 'hidden', id: 'safe' }] }, full)).toEqual({ nested: [{ id: 'safe' }] })
  })

  it.each([
    'Bearer abcDEF-123456._~+/=', 'sxs_live_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
    'sxc_live_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG', 'ghp_abcdefghijklmnopqrstuvwxyz0123456789',
    'sk-proj-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
    'APP_USR-1234567890123456-abcdef1234567890abcdef1234567890-123456789',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjdXN0b21lciJ9.c2lnbmF0dXJl',
    '4111 1111 1111 1111', '4222222222222', '378282246310005', '4000000000000000006',
    'apiKey="arbitrary-high-entropy-value"', 'password: veryPrivate',
  ])('removes high-confidence secret/card %s from text and nested JSON', value => {
    const result = redactValue({ detalhe: `before ${value} after`, nested: JSON.stringify({ detalhe: value }) }, full)
    expect(JSON.stringify(result)).not.toContain(value)
    expect((result as { detalhe: string }).detalhe).toContain('before ')
    expect((result as { detalhe: string }).detalhe).toContain(' after')
  })

  it('removes a labeled PAN even with an invalid check digit and embedded forbidden keys in prose', () => {
    const result = redactValue('falhou {"accessToken":"short-value"}; cardNumber=1234567890123456 fim', full)
    expect(result).not.toContain('short-value')
    expect(result).not.toContain('accessToken')
    expect(result).not.toContain('1234567890123456')
  })

  it('preserves legitimate scalars, dates, ordinary identifiers, money and token usage counts', () => {
    const input = { id: 'cm1abcdefghijk1234567890', requestId: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: '2026-11-16T18:45:00.000Z', valor: '1234567890123.50', reference: '1234567890123456',
      tokens: 128, quantidade: 10, ativo: true, nulo: null, sku: 'SIXXIS-M45-220V', apiVersion: '1.0.0' }
    expect(redactValue(input, full)).toEqual(input)
    // These ordinary ids/timestamps happen to pass Luhn, but have no payment-card issuer prefix.
    expect(redactValue({ id: '1234567890123452', epochMs: 1731776300005 }, full)).toEqual({ id: '1234567890123452', epochMs: 1731776300005 })
  })

  it('is immutable and rejects raw types/cycles rather than serializing them implicitly', () => {
    const input = { safe: [{ senha: 'hidden', email: 'joao@gmail.com' }] }
    const before = JSON.stringify(input)
    redactValue(input, restricted)
    expect(JSON.stringify(input)).toBe(before)
    for (const value of [new Date(), new Prisma.Decimal('1'), BigInt(1), NaN]) expect(() => redactValue(value, full)).toThrow(TypeError)
    const cycle: Record<string, unknown> = {}; cycle.self = cycle
    expect(() => redactValue(cycle, full)).toThrow(TypeError)
  })

  it('removes numeric PANs, doubly encoded JSON secrets and secrets hidden in PII fields', () => {
    expect(redactValue({ value: 4111111111111111 }, full)).toEqual({ value: '[REDACTED]' })
    const encoded = JSON.stringify(JSON.stringify({ accessToken: 'private-short-token', id: 'safe' }))
    expect(JSON.stringify(redactValue(encoded, full))).not.toContain('private-short-token')
    const payload = { email: 'j@sxs_live_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG.com' }
    expect(JSON.stringify(redactValue(payload, restricted))).not.toContain('sxs_live_')
  })

  it('masks payer PII and labeled bare PII in text without requiring message permission', () => {
    expect(redactValue({ payerCpf: '52998224725', payerNome: 'João Silva' }, restricted)).toEqual({ payerCpf: '***.***.***-25', payerNome: 'J***' })
    const result = String(redactValue('CPF 52998224725; CNPJ 11222333000181; telefone 11912345678', { allowPii: false, allowMessages: true }))
    for (const value of ['52998224725', '11222333000181', '11912345678']) expect(result).not.toContain(value)
  })

  it('keeps duplicate object references valid, blocks prototype tricks and rejects excessive nesting', () => {
    const shared = { id: 'safe' }
    expect(redactValue([shared, shared], full)).toEqual([shared, shared])
    const result = redactValue(JSON.parse('{"__proto__":{"token":"hidden"},"id":"safe"}'), full)
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(JSON.stringify(result)).not.toContain('hidden')
    let nested: unknown = 'leaf'
    for (let index = 0; index < 70; index++) nested = { child: nested }
    expect(() => redactValue(nested, full)).toThrow(TypeError)
  })

  it('removes Basic credentials and escaped forbidden JSON keys embedded in prose', () => {
    expect(redactValue('header Basic dXNlcjpwYXNzd29yZA== end', full)).not.toContain('dXNlcjpwYXNzd29yZA==')
    const input = 'debug response=' + JSON.stringify(JSON.stringify({ apiKey: 'private-credential' })) + ' end'
    expect(redactValue(input, full)).not.toContain('private-credential')
  })

  it.each([
    'debug {"accessToken": { "value": "private-credential" }}',
    'debug {"accessToken": ["private-credential", {"value":"private-credential"}]}',
    'debug {"password":"prefix\\"suffix"}',
    'debug {"password":"prefix\\\\suffix"}',
    'debug {"password":"prefix\\"suffix',
    'debug {\\"accessToken\\": { \\"value\\": \\"private-credential\\" }}',
    'debug {\\"password\\":\\"prefix\\\\\\"suffix\\"}',
  ])('fix round 1: removes complete ambiguous or escaped secret assignment: %s', input => {
    const result = String(redactValue(input, full))
    for (const secret of ['private-credential', 'prefix', 'suffix', 'accessToken', 'password']) expect(result).not.toContain(secret)
  })

  it.each(['private-credential', '128', { value: 'private-credential' }, ['private-credential'], -1, 0.5])('fix round 1: excludes non-counter tokens value %s', tokens => {
    expect(redactValue({ tokens, nested: [{ tokens }], id: 'safe' }, full)).toEqual({ nested: [{}], id: 'safe' })
    const prose = `debug ${JSON.stringify({ tokens })} end`
    expect(String(redactValue(prose, full))).not.toContain('tokens')
  })

  it.each([0, 128, Number.MAX_SAFE_INTEGER])('fix round 1: preserves safe nonnegative integer usage count %s', tokens => {
    expect(redactValue({ tokens }, full)).toEqual({ tokens })
  })

  it('preserves null for the optional Luna usage counter, never a credential value', () => {
    expect(redactValue({ tokens: null, nested: { tokens: null, token: 'private-credential' } }, full)).toEqual({ tokens: null, nested: { tokens: null } })
  })

  it.each([maskName, maskEmail, maskPhone, maskCpf, maskCnpj, maskAddress, maskIp, maskIdentifier])('fix round 1: mask never coerces a PII object or array', mask => {
    expect(mask({ toString: 'x', valueOf: 'x' })).toBe('[REDACTED]')
    expect(mask(['private-credential', '52998224725'])).toBe('[REDACTED]')
  })

  it('fix round 1: masks malformed PII containers and safely continues sibling recursion', () => {
    const payload = { nome: { toString: 'x' }, telefone: ['11912345678'], cpf: ['52998224725'], cnpj: ['11222333000181'], email: ['j@gmail.com'],
      nested: [{ nome: ['João', 'Silva'], senha: 'private-credential', id: 'safe' }] }
    expect(redactValue(payload, restricted)).toEqual({ nome: '[REDACTED]', telefone: '[REDACTED]', cpf: '[REDACTED]', cnpj: '[REDACTED]', email: '[REDACTED]', nested: [{ nome: '[REDACTED]', id: 'safe' }] })
  })
})
