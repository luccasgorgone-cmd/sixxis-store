import { describe, it, expect } from 'vitest'
import { montarLinkWhatsApp } from './gclid-whatsapp'
import {
  WA_FONE_VENDAS,
  WA_FONE_SUPORTE,
  WA_TEXTO_VENDAS,
  WA_TEXTO_SUPORTE,
  waTextoDuvidaProduto,
} from './wa-touchpoints'

const GCLID = 'CjwKCAjw_eLVBhBEEiwAeaYZfPn2pQ49T6n9HL2PTo0Y7J9gSSyWW8sr1cYQ'

// Mesma regex que o CRM usa pra capturar o marcador da 1ª mensagem.
const CRM_RE = /\[#g:([^\]]+)\]/

function textoDoLink(url: string): string {
  return decodeURIComponent(url.split('text=')[1])
}

describe('touchpoints WhatsApp — contrato de link com gclid', () => {
  // Cada caso trava o fone + texto REAL que o componente emite (via constantes
  // compartilhadas). Mudar número ou texto no touchpoint quebra estes testes.
  const casos: Array<{ nome: string; fone: string; texto: string }> = [
    { nome: 'footer/flutuante/menu — Vendas', fone: WA_FONE_VENDAS, texto: WA_TEXTO_VENDAS },
    { nome: 'footer/flutuante — Suporte',     fone: WA_FONE_SUPORTE, texto: WA_TEXTO_SUPORTE },
    { nome: 'produto — Tire sua dúvida',      fone: WA_FONE_VENDAS, texto: waTextoDuvidaProduto('Climatizador Portátil 220V') },
  ]

  for (const { nome, fone, texto } of casos) {
    it(`${nome}: com gclid → wa.me correto + marcador parseável pelo CRM`, () => {
      const url = montarLinkWhatsApp(fone, texto, GCLID)
      expect(url.startsWith(`https://wa.me/${fone}?text=`)).toBe(true)
      const corpo = textoDoLink(url)
      expect(corpo).toBe(`${texto}\n\n[#g:${GCLID}]`)
      // CRM recupera exatamente o gclid.
      expect(corpo.match(CRM_RE)?.[1]).toBe(GCLID)
    })

    it(`${nome}: sem gclid → link intacto (comportamento de hoje)`, () => {
      const url = montarLinkWhatsApp(fone, texto)
      expect(textoDoLink(url)).toBe(texto)
      expect(url).not.toContain('%5B%23g')
    })
  }

  it('nome de produto com caractere perigoso não corrompe o marcador do CRM', () => {
    // Se o nome do produto tiver ']', o encodeURIComponent protege a URL e a tag
    // do gclid é anexada DEPOIS — o CRM ainda captura só o gclid.
    const texto = waTextoDuvidaProduto('Ventilador ]injetado[ 110V')
    const url = montarLinkWhatsApp(WA_FONE_VENDAS, texto, GCLID)
    const corpo = textoDoLink(url)
    expect(corpo.match(CRM_RE)?.[1]).toBe(GCLID)
    expect(corpo.endsWith(`[#g:${GCLID}]`)).toBe(true)
  })

  it('fones são só dígitos (formato wa.me)', () => {
    expect(WA_FONE_VENDAS).toMatch(/^\d+$/)
    expect(WA_FONE_SUPORTE).toMatch(/^\d+$/)
  })
})
