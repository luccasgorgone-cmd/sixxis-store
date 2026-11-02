import { describe, expect, it } from 'vitest'
import { buildPlan } from './prepare-packshots-site-2026-11-02.mjs'

const ROOT = '/home/pzxx1010/.openclaw/agents/artes/workspace/output/sixxis-packshots-site-2026-11-02'
const SHA = 'a'.repeat(64)

function asset(slug, kind, sourceIndex) {
  const filename = `${slug}-${kind}-${sourceIndex}.jpg`
  return {
    slug,
    kind,
    source_index: sourceIndex,
    blocked: false,
    path: `${ROOT}/final/${filename}`,
    filename,
    sha256: SHA,
  }
}

function inventory(slug, urls) {
  return urls.map((url, index) => ({ slug, image_index: index + 1, url }))
}

describe('buildPlan packshots', () => {
  it('substitui o primeiro slot pelo hero sem duplicar a gallery-01 e preserva lifestyle', () => {
    const slug = 'produto-a'
    const urls = ['old-1', 'old-2', 'lifestyle-3']
    const plan = buildPlan({
      inventory: inventory(slug, urls),
      deliverables: [asset(slug, 'gallery', 1), asset(slug, 'gallery', 2), asset(slug, 'hero-site', 1)],
      catalog: [{ id: 'a', slug, sku: 'SKU-A', imagens: urls, imagensPorVariacao: null }],
      packageDir: '/pkg',
    })

    const product = plan.products[0]
    expect(product.targetImages).toHaveLength(3)
    expect(product.targetImages[0]).toContain('hero-site-1.jpg')
    expect(product.targetImages[1]).toContain('gallery-2.jpg')
    expect(product.targetImages[2]).toBe('lifestyle-3')
    expect(product.preservedSlots).toEqual([3])
    expect(plan.assets.find((item) => item.filename.endsWith('gallery-1.jpg')).used).toBe(false)
  })

  it('mantém Life preta como hero global e usa o hero branco só na variação Branco', () => {
    const slug = 'spinning-sixxis-life'
    const urls = ['black-1', 'black-2', 'white-3']
    const plan = buildPlan({
      inventory: inventory(slug, urls),
      deliverables: [
        asset(slug, 'gallery', 1),
        asset(slug, 'gallery', 2),
        asset(slug, 'gallery', 3),
        asset(slug, 'hero-site', 3),
      ],
      catalog: [{
        id: 'life',
        slug,
        sku: 'LIFE',
        imagens: urls,
        imagensPorVariacao: { Preto: ['black-1', 'black-2'], Branco: ['white-3'] },
      }],
      catalogMap: [{
        slug,
        hero_source_index: '1',
        hero_site_path: 'final/site-gallery/spinning-sixxis-life/spinning-sixxis-life-gallery-1.jpg',
      }],
      packageDir: '/pkg',
    })

    const product = plan.products[0]
    expect(product.targetImages).toHaveLength(3)
    expect(product.targetImages[0]).toContain('gallery-1.jpg')
    expect(product.targetImages[1]).toContain('gallery-2.jpg')
    expect(product.targetImages[2]).toContain('hero-site-3.jpg')
    expect(product.targetImagesByVariant.Preto[0]).toContain('gallery-1.jpg')
    expect(product.targetImagesByVariant.Branco[0]).toContain('hero-site-3.jpg')
    expect(new Set(product.targetImages).size).toBe(3)
  })

  it('aborta se a galeria ao vivo mudou depois do inventário', () => {
    const slug = 'produto-a'
    expect(() => buildPlan({
      inventory: inventory(slug, ['old-1']),
      deliverables: [asset(slug, 'gallery', 1), asset(slug, 'hero-site', 1)],
      catalog: [{ id: 'a', slug, sku: 'SKU-A', imagens: ['changed-1'], imagensPorVariacao: null }],
      packageDir: '/pkg',
    })).toThrow('slot 1 mudou desde o inventário')
  })

  it('reconhece catálogo já aplicado sem tentar recompor sobre as URLs novas', () => {
    const slug = 'produto-a'
    const urls = ['old-1', 'old-2']
    const input = {
      inventory: inventory(slug, urls),
      deliverables: [asset(slug, 'gallery', 1), asset(slug, 'gallery', 2), asset(slug, 'hero-site', 1)],
      catalog: [{ id: 'a', slug, sku: 'SKU-A', imagens: urls, imagensPorVariacao: null }],
      packageDir: '/pkg',
    }
    const first = buildPlan(input)
    const target = first.products[0].targetImages
    const second = buildPlan({
      ...input,
      catalog: [{ id: 'a', slug, sku: 'SKU-A', imagens: target, imagensPorVariacao: null }],
    })

    expect(second.products[0].alreadyApplied).toBe(true)
    expect(second.products[0].targetImages).toEqual(target)
  })
})
