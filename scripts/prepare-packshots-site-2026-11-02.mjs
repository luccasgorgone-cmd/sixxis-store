#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'

const PACKAGE_NAME = 'artes-packshots-site-2026-11-02'
const PUBLIC_CATALOG_URL = 'https://www.sixxis.com.br/api/produtos?limit=100'
const R2_PUBLIC_URL = 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev'

function findPackageDir() {
  const candidates = [
    process.env.PACKSHOTS_DIR,
    resolve(process.cwd(), '..', 'inbound', PACKAGE_NAME),
    resolve(process.cwd(), '..', '..', 'inbound', PACKAGE_NAME),
  ].filter(Boolean)

  const found = candidates.find((candidate) => existsSync(join(candidate, 'DELIVERABLES.json')))
  if (!found) {
    throw new Error(`Pacote ${PACKAGE_NAME} não encontrado. Defina PACKSHOTS_DIR.`)
  }
  return found
}

function findInventoryPath(packageDir) {
  const candidates = [
    join(packageDir, 'inventory-live.json'),
    process.env.PACKSHOTS_INVENTORY,
    '/home/pzxx1010/.openclaw/agents/artes/workspace/output/sixxis-packshots-site-2026-11-02/inventory-live.json',
  ].filter(Boolean)

  const found = candidates.find((candidate) => existsSync(candidate))
  if (!found) {
    throw new Error('inventory-live.json não encontrado no pacote nem no workspace da Artes.')
  }
  return found
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function validateManifest(packageDir) {
  const manifestPath = join(packageDir, '_MANIFEST.sha256')
  const lines = readFileSync(manifestPath, 'utf8').split(/\r?\n/).filter(Boolean)
  const failures = []

  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i)
    if (!match) throw new Error(`Linha inválida no manifesto: ${line}`)
    const [, expected, fileName] = match
    const filePath = join(packageDir, fileName)
    if (!existsSync(filePath)) failures.push(`${fileName}: ausente`)
    else if (sha256(filePath) !== expected) failures.push(`${fileName}: SHA-256 divergente`)
  }

  if (failures.length) throw new Error(`Manifesto falhou:\n${failures.join('\n')}`)
  return lines.length
}

function r2Key(asset) {
  const digest = asset.sha256.slice(0, 12)
  return `produtos/packshots/2026-11-02/${asset.slug}/${digest}-${asset.filename}`
}

function groupBy(items, key) {
  const result = new Map()
  for (const item of items) {
    const value = item[key]
    if (!result.has(value)) result.set(value, [])
    result.get(value).push(item)
  }
  return result
}

function jsonEqual(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

function parseCatalogMap(csv) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/)
  const headers = headerLine.split(',')
  return lines.filter(Boolean).map((line) => {
    const values = line.split(',')
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  })
}

function replaceVariantImages(value, replacements) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value ?? null
  return Object.fromEntries(
    Object.entries(value).map(([name, urls]) => [
      name,
      Array.isArray(urls) ? urls.map((url) => replacements.get(url) ?? url) : urls,
    ]),
  )
}

export function buildPlan({ inventory, deliverables, catalog, catalogMap = [], packageDir }) {
  const catalogBySlug = new Map(catalog.map((product) => [product.slug, product]))
  const rulesBySlug = new Map(catalogMap.map((rule) => [rule.slug, rule]))
  const inventoryBySlug = groupBy(inventory, 'slug')
  const readyAssets = deliverables.filter(
    (asset) => !asset.blocked && (asset.kind === 'gallery' || asset.kind === 'hero-site'),
  )
  const assetsBySlug = groupBy(readyAssets, 'slug')
  const products = []

  for (const [slug, assets] of assetsBySlug) {
    if (slug === 'sx070-trend') throw new Error('SX070 apareceu entre os assets liberados.')
    const live = catalogBySlug.get(slug)
    if (!live) throw new Error(`${slug}: produto não encontrado no catálogo ao vivo.`)

    const baseline = (inventoryBySlug.get(slug) ?? []).sort((a, b) => a.image_index - b.image_index)
    const baselineImages = baseline.map((row) => row.url)
    const currentImages = Array.isArray(live.imagens) ? live.imagens : []
    if (baseline.length !== currentImages.length) {
      throw new Error(`${slug}: contagem mudou (${baseline.length} inventariadas, ${currentImages.length} ao vivo).`)
    }

    const gallery = assets.filter((asset) => asset.kind === 'gallery')
    const rule = rulesBySlug.get(slug)
    const hero = rule
      ? assets.find((asset) => asset.filename === basename(rule.hero_site_path))
      : assets.find((asset) => asset.kind === 'hero-site')
    if (!hero) throw new Error(`${slug}: hero primário indicado no CATALOG-MAP ausente.`)
    const heroSourceIndex = rule ? Number(rule.hero_source_index) : hero.source_index
    if (hero.source_index !== heroSourceIndex) {
      throw new Error(`${slug}: source_index do hero diverge do CATALOG-MAP.`)
    }

    const outputUrl = (asset) => `${R2_PUBLIC_URL}/${r2Key(asset)}`
    const replacements = new Map()
    for (const asset of gallery) {
      const source = baseline.find((row) => row.image_index === asset.source_index)
      if (!source) throw new Error(`${slug}: source_index ${asset.source_index} fora do inventário.`)
      replacements.set(source.url, outputUrl(asset))
    }

    // Heroes de variante também substituem seu source_index. Na Life, por
    // exemplo, o hero branco (source 10) fica só em Branco, enquanto o hero
    // global/card/feed continua sendo gallery-01 da variante Preto.
    for (const variantHero of assets.filter((asset) => asset.kind === 'hero-site')) {
      const source = baseline.find((row) => row.image_index === variantHero.source_index)
      if (!source) throw new Error(`${slug}: hero source_index ${variantHero.source_index} fora do inventário.`)
      replacements.set(source.url, outputUrl(variantHero))
    }

    const heroSource = baseline.find((row) => row.image_index === heroSourceIndex)
    if (!heroSource) throw new Error(`${slug}: hero source_index ${heroSourceIndex} fora do inventário.`)
    replacements.set(heroSource.url, outputUrl(hero))

    let targetImages = baselineImages.map((url) => replacements.get(url) ?? url)
    if (heroSourceIndex !== 1) {
      targetImages = [
        outputUrl(hero),
        ...targetImages.filter((_, index) => index !== heroSourceIndex - 1),
      ]
    }

    if (targetImages.length !== currentImages.length) {
      throw new Error(`${slug}: o plano alterou a quantidade de imagens.`)
    }
    if (targetImages[0] !== outputUrl(hero)) {
      throw new Error(`${slug}: hero não ficou no primeiro slot.`)
    }
    if (new Set(targetImages).size !== targetImages.length) {
      throw new Error(`${slug}: o plano introduziu URL duplicada na galeria principal.`)
    }
    if (!jsonEqual(currentImages, baselineImages) && !jsonEqual(currentImages, targetImages)) {
      const changedSlot = currentImages.findIndex(
        (url, index) => url !== baselineImages[index] && url !== targetImages[index],
      )
      const detail = changedSlot >= 0
        ? `slot ${changedSlot + 1} mudou desde o inventário`
        : 'galeria está em estado parcial/misto'
      throw new Error(`${slug}: ${detail}; plano abortado.`)
    }

    const targetImagesByVariant = replaceVariantImages(live.imagensPorVariacao, replacements)
    const alreadyApplied = jsonEqual(currentImages, targetImages) &&
      jsonEqual(live.imagensPorVariacao ?? null, targetImagesByVariant)
    products.push({
      id: live.id,
      slug,
      sku: live.sku,
      heroSourceIndex,
      currentImages,
      targetImages,
      currentImagesByVariant: live.imagensPorVariacao ?? null,
      targetImagesByVariant,
      alreadyApplied,
      preservedSlots: baseline
        .filter((row) => !gallery.some((asset) => asset.source_index === row.image_index))
        .map((row) => row.image_index),
    })
  }

  products.sort((a, b) => a.slug.localeCompare(b.slug))

  const referencedUrls = new Set(
    products.flatMap((product) => [
      ...product.targetImages,
      ...Object.values(product.targetImagesByVariant ?? {}).flat(),
    ]),
  )
  const assets = readyAssets.map((asset) => {
    const sourcePath = join(packageDir, relative(
      '/home/pzxx1010/.openclaw/agents/artes/workspace/output/sixxis-packshots-site-2026-11-02',
      asset.path,
    ))
    const key = r2Key(asset)
    const url = `${R2_PUBLIC_URL}/${key}`
    return {
      slug: asset.slug,
      kind: asset.kind,
      sourceIndex: asset.source_index,
      filename: asset.filename,
      sourcePath,
      sha256: asset.sha256,
      key,
      url,
      used: referencedUrls.has(url),
    }
  })

  const sx070 = catalogBySlug.get('sx070-trend')
  return {
    generatedAt: new Date().toISOString(),
    catalogUrl: PUBLIC_CATALOG_URL,
    packageDir,
    products,
    assets,
    blocked: {
      slug: 'sx070-trend',
      untouched: true,
      currentImageCount: Array.isArray(sx070?.imagens) ? sx070.imagens.length : null,
    },
  }
}

export async function prepareLivePlan() {
  const packageDir = findPackageDir()
  const inventoryPath = findInventoryPath(packageDir)
  const manifestFiles = validateManifest(packageDir)
  const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'))
  const deliverables = JSON.parse(readFileSync(join(packageDir, 'DELIVERABLES.json'), 'utf8'))
  const catalogMap = parseCatalogMap(readFileSync(join(packageDir, 'CATALOG-MAP.csv'), 'utf8'))

  const response = await fetch(PUBLIC_CATALOG_URL)
  if (!response.ok) throw new Error(`Catálogo respondeu HTTP ${response.status}.`)
  const body = await response.json()
  const catalog = Array.isArray(body.produtos) ? body.produtos : []
  const plan = buildPlan({ inventory, deliverables, catalog, catalogMap, packageDir })

  const summary = {
    manifestFiles,
    inventoryRows: inventory.length,
    catalogProducts: catalog.length,
    readyProducts: plan.products.length,
    blockedProducts: 1,
    currentImagesChecked: plan.products.reduce((sum, item) => sum + item.currentImages.length, 0),
    preservedLifestyleOrPromo: plan.products.reduce((sum, item) => sum + item.preservedSlots.length, 0),
    alreadyAppliedProducts: plan.products.filter((item) => item.alreadyApplied).length,
    uploadAssetsUsed: plan.assets.filter((asset) => asset.used).length,
    unusedGeneratedAssets: plan.assets.filter((asset) => !asset.used).map((asset) => basename(asset.sourcePath)),
  }

  return { summary, plan }
}

async function main() {
  const { summary, plan } = await prepareLivePlan()

  if (process.argv.includes('--json')) console.log(JSON.stringify({ summary, plan }, null, 2))
  else {
    console.log(JSON.stringify(summary, null, 2))
    for (const product of plan.products) {
      console.log(
        `${product.slug}: ${product.currentImages.length} slots; hero source=${product.heroSourceIndex}; ` +
        `preservados=${product.preservedSlots.join(',') || 'nenhum'}`,
      )
    }
    console.log('DRY-RUN: nenhuma escrita em R2, banco ou catálogo foi executada.')
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
