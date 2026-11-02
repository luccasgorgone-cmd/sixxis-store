#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { prepareLivePlan } from './prepare-packshots-site-2026-11-02.mjs'

const APPLY_FLAG = '--apply'
const CONFIRMATION_VALUE = 'PACKSHOTS-2026-11-02'

function jsonEqual(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} não está definido.`)
  return value
}

function fileSha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

async function uploadAssets(plan) {
  const { HeadObjectCommand, PutObjectCommand, S3Client } = await import('@aws-sdk/client-s3')
  const bucket = requireEnv('R2_BUCKET_NAME')
  const publicUrl = requireEnv('R2_PUBLIC_URL').replace(/\/$/, '')
  const expectedPublicUrl = plan.assets[0]?.url.split('/produtos/')[0]
  if (publicUrl !== expectedPublicUrl) {
    throw new Error(`R2_PUBLIC_URL inesperada: ${publicUrl} (plano usa ${expectedPublicUrl}).`)
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: requireEnv('R2_ENDPOINT'),
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
  })

  const receipt = []
  for (const asset of plan.assets.filter((item) => item.used)) {
    const actualSha = fileSha256(asset.sourcePath)
    if (actualSha !== asset.sha256) throw new Error(`${asset.filename}: SHA-256 mudou antes do upload.`)

    let exists = false
    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: asset.key }))
      const remoteSha = head.Metadata?.sha256
      if (remoteSha !== asset.sha256) {
        throw new Error(`${asset.key}: objeto já existe com hash diferente ou sem metadata.`)
      }
      exists = true
    } catch (error) {
      const status = error?.$metadata?.httpStatusCode
      if (status !== 404 && error?.name !== 'NotFound' && error?.name !== 'NoSuchKey') throw error
    }

    if (!exists) {
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: asset.key,
        Body: readFileSync(asset.sourcePath),
        ContentType: 'image/jpeg',
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: { sha256: asset.sha256 },
      }))
    }
    receipt.push({ key: asset.key, sha256: asset.sha256, status: exists ? 'already-present' : 'uploaded' })
  }
  return receipt
}

async function updateCatalog(plan) {
  const { prisma } = await import('../src/lib/prisma.ts')
  const alreadyApplied = new Set()
  try {
    await prisma.$transaction(async (tx) => {
      for (const product of plan.products) {
        const live = await tx.produto.findUnique({
          where: { id: product.id },
          select: { id: true, slug: true, imagens: true, imagensPorVariacao: true },
        })
        if (!live || live.slug !== product.slug) throw new Error(`${product.slug}: produto mudou ou não existe.`)
        const liveAlreadyApplied = jsonEqual(live.imagens, product.targetImages) &&
          jsonEqual(live.imagensPorVariacao, product.targetImagesByVariant)
        if (liveAlreadyApplied) {
          alreadyApplied.add(product.slug)
          continue
        }
        if (!jsonEqual(live.imagens, product.currentImages)) {
          throw new Error(`${product.slug}: imagens mudaram depois do dry-run; transação abortada.`)
        }
        if (!jsonEqual(live.imagensPorVariacao, product.currentImagesByVariant)) {
          throw new Error(`${product.slug}: imagensPorVariacao mudou depois do dry-run; transação abortada.`)
        }

        await tx.produto.update({
          where: { id: product.id },
          data: {
            imagens: product.targetImages,
            imagensPorVariacao: product.targetImagesByVariant,
          },
        })
        await tx.auditLog.create({
          data: {
            actor: 'jarvis-site',
            action: 'produto.packshots-2026-11-02',
            target: product.id,
            metadata: {
              slug: product.slug,
              beforeCount: product.currentImages.length,
              afterCount: product.targetImages.length,
              heroSourceIndex: product.heroSourceIndex,
              preservedSlots: product.preservedSlots,
            },
          },
        })
      }
    }, { isolationLevel: 'Serializable', timeout: 60_000 })

    const verified = []
    for (const product of plan.products) {
      const live = await prisma.produto.findUnique({
        where: { id: product.id },
        select: { slug: true, imagens: true, imagensPorVariacao: true },
      })
      if (!jsonEqual(live?.imagens, product.targetImages)) throw new Error(`${product.slug}: verificação pós-update falhou.`)
      if (!jsonEqual(live?.imagensPorVariacao, product.targetImagesByVariant)) {
        throw new Error(`${product.slug}: verificação pós-update de variações falhou.`)
      }
      verified.push({
        slug: product.slug,
        imageCount: product.targetImages.length,
        hero: product.targetImages[0],
        status: alreadyApplied.has(product.slug) ? 'already-applied' : 'updated',
      })
    }
    return verified
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  const { summary, plan } = await prepareLivePlan()
  console.log(JSON.stringify(summary, null, 2))

  if (!process.argv.includes(APPLY_FLAG)) {
    console.log('DRY-RUN: use --apply somente após autorização direta do Luccas.')
    return
  }
  if (process.env.PACKSHOTS_APPLY_CONFIRM !== CONFIRMATION_VALUE) {
    throw new Error(`Aplicação bloqueada: defina PACKSHOTS_APPLY_CONFIRM=${CONFIRMATION_VALUE}.`)
  }

  requireEnv('DATABASE_URL')
  const uploads = await uploadAssets(plan)
  const products = await updateCatalog(plan)
  console.log(JSON.stringify({
    appliedAt: new Date().toISOString(),
    uploads,
    products,
    blocked: plan.blocked,
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
