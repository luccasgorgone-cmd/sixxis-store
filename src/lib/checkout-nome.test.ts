import { describe, expect, it } from 'vitest'
import { deveSincronizarNomeCadastro } from './checkout-nome'

describe('deveSincronizarNomeCadastro', () => {
  const base = { pedidoClienteId: 'cli_1', payerNome: 'Maria Souza', nomeAtual: 'MARIA' }

  it('sincroniza quando o dono do pedido está logado', () => {
    expect(deveSincronizarNomeCadastro({ ...base, clienteSessaoId: 'cli_1' })).toBe(true)
  })

  it('NÃO sincroniza só com token de posse (convidado sem sessão)', () => {
    expect(deveSincronizarNomeCadastro({ ...base, clienteSessaoId: null })).toBe(false)
  })

  it('NÃO sincroniza com sessão de outro cliente', () => {
    expect(deveSincronizarNomeCadastro({ ...base, clienteSessaoId: 'cli_2' })).toBe(false)
  })

  it('não faz nada sem nome novo ou com nome igual', () => {
    expect(deveSincronizarNomeCadastro({ ...base, clienteSessaoId: 'cli_1', payerNome: undefined })).toBe(false)
    expect(deveSincronizarNomeCadastro({ ...base, clienteSessaoId: 'cli_1', payerNome: 'MARIA' })).toBe(false)
  })
})
