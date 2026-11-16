import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function fonte(caminho: string): string {
  return readFileSync(join(process.cwd(), caminho), 'utf8')
}

describe('wiring gclid nos links de WhatsApp de alta intenção', () => {
  it('usa o link rastreável no CTA Tire sua dúvida da PDP', () => {
    const codigo = fonte('src/components/produto/InfoProdutoCB.tsx')

    expect(codigo).toContain("import WhatsAppTrackedLink from '@/components/analytics/WhatsAppTrackedLink'")
    expect(codigo).toContain('<WhatsAppTrackedLink')
    expect(codigo).not.toContain('href={`https://wa.me/5518997474701')
  })

  it('usa o link rastreável nos três atalhos do rodapé', () => {
    const codigo = fonte('src/components/layout/Footer.tsx')

    expect(codigo).toContain("import WhatsAppTrackedLink from '@/components/analytics/WhatsAppTrackedLink'")
    expect(codigo.match(/<WhatsAppTrackedLink/g)).toHaveLength(3)
    expect(codigo).not.toContain('href={`https://wa.me/${whatsappVendas}`')
    expect(codigo).not.toContain('href={`https://wa.me/${whatsappSuporte}`')
    expect(codigo).not.toContain('href="https://wa.me/5518997474701"')
  })
})
