import { describe, expect, it } from 'vitest'
import { ipDoCliente } from './client-ip'

describe('ipDoCliente', () => {
  it('ignora cf-connecting-ip forjado (não há Cloudflare na frente)', () => {
    const h = new Headers({ 'cf-connecting-ip': '6.6.6.6', 'x-forwarded-for': '200.1.2.3' })
    expect(ipDoCliente(h)).toBe('200.1.2.3')
  })

  it('variar cf-connecting-ip não muda o IP usado no bloqueio', () => {
    const a = ipDoCliente(new Headers({ 'cf-connecting-ip': '1.1.1.1', 'x-real-ip': '200.1.2.3' }))
    const b = ipDoCliente(new Headers({ 'cf-connecting-ip': '2.2.2.2', 'x-real-ip': '200.1.2.3' }))
    expect(a).toBe(b)
  })

  it('usa o primeiro hop do x-forwarded-for, depois x-real-ip', () => {
    expect(ipDoCliente(new Headers({ 'x-forwarded-for': '200.1.2.3, 10.0.0.1' }))).toBe('200.1.2.3')
    expect(ipDoCliente(new Headers({ 'x-real-ip': '200.9.9.9' }))).toBe('200.9.9.9')
    expect(ipDoCliente(new Headers())).toBe('unknown')
  })
})
