import { describe, expect, it } from 'vitest'
import { sanitizarHtmlRico } from './sanitize-html'

describe('sanitizarHtmlRico', () => {
  it('remove <script>', () => {
    expect(sanitizarHtmlRico('<p>oi</p><script>alert(1)</script>')).toBe('<p>oi</p>')
  })

  it('remove handler inline (onerror/onclick)', () => {
    expect(sanitizarHtmlRico('<img src=x onerror="alert(1)">')).not.toContain('onerror')
    expect(sanitizarHtmlRico('<p onclick="alert(1)">oi</p>')).not.toContain('onclick')
  })

  it('remove href javascript:', () => {
    const out = sanitizarHtmlRico('<a href="javascript:alert(1)">clique</a>')
    expect(out).not.toContain('javascript:')
  })

  it('mantém formatação básica permitida (negrito, link, lista)', () => {
    const html = '<p><strong>Negrito</strong> e <a href="https://sixxis.com.br">link</a></p><ul><li>item</li></ul>'
    expect(sanitizarHtmlRico(html)).toBe(html)
  })

  it('mantém div/section com class (wrapper estrutural real do site)', () => {
    const html = '<div class="produto-hero"><h2>T</h2></div><section><p>x</p></section>'
    expect(sanitizarHtmlRico(html)).toBe(html)
  })

  it('remove tag não permitida (iframe) mas mantém o texto interno seguro', () => {
    const out = sanitizarHtmlRico('<iframe src="https://evil.example"></iframe><p>ok</p>')
    expect(out).not.toContain('iframe')
    expect(out).toContain('<p>ok</p>')
  })
})
