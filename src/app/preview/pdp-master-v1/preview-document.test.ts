import { describe, expect, it } from 'vitest'
import { buildPreviewDocument } from './preview-document'

describe('PDP Master preview document', () => {
  it('incorpora CSS, JavaScript e todos os assets usados pelo carrossel', async () => {
    const document = await buildPreviewDocument()

    expect(document).toContain('<style>')
    expect(document).toContain('<script>')
    expect(document).toContain('data:font/woff2;base64,')
    expect(document).toContain('data:image/jpeg;base64,')
    expect(document).not.toContain('href="styles.css"')
    expect(document).not.toContain('src="script.js"')
    expect(document).not.toContain('assets/')
  })
})
