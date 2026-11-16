import { describe, expect, it } from 'vitest'
import { escaparHtml, normalizarSolicitacao } from './revendedor-solicitacao'

describe('escaparHtml', () => {
  it('neutraliza tags e atributos', () => {
    expect(escaparHtml('<a href="x">oi</a> & \'')).toBe('&lt;a href=&quot;x&quot;&gt;oi&lt;/a&gt; &amp; &#39;')
  })
})

describe('normalizarSolicitacao', () => {
  const ok = { nome: 'Ana Lima', email: 'Ana@Exemplo.com ', telefone: '18999999999' }

  it('aceita o payload da página seja-revendedor e normaliza o e-mail', () => {
    const r = normalizarSolicitacao({ ...ok, tipo: 'pj', nomeFantasia: 'Loja X', mensagem: 'Olá' })
    expect(r.ok).toBe(true)
    if (r.ok && r.dados) {
      expect(r.dados.email).toBe('ana@exemplo.com')
      expect(r.dados.nomeFantasia).toBe('Loja X')
    }
  })

  it('descarta campos desconhecidos (não entram no e-mail do SAC)', () => {
    const r = normalizarSolicitacao({ ...ok, '<img src=x>': 'y', extra: 'z' })
    expect(r.ok && Object.keys(r.dados ?? {})).toEqual(['nome', 'email', 'telefone'])
  })

  it('recusa e-mail inválido, lista de destinatários e campos não-texto', () => {
    expect(normalizarSolicitacao({ ...ok, email: 'nao-e-email' }).ok).toBe(false)
    expect(normalizarSolicitacao({ ...ok, email: ['a@x.com', 'b@y.com'] }).ok).toBe(false)
    expect(normalizarSolicitacao({ ...ok, nome: { $ne: 1 } }).ok).toBe(false)
  })

  it('recusa campo gigante e aponta obrigatórios faltando', () => {
    expect(normalizarSolicitacao({ ...ok, nome: 'a'.repeat(201) }).ok).toBe(false)
    const r = normalizarSolicitacao({ email: 'a@b.com' })
    expect(r.ok).toBe(false)
    expect(r.faltando).toEqual(['nome', 'telefone'])
  })
})
