// scripts/upload-imagens.cjs
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Usa as variáveis do .env.local (R2_* sem prefixo CLOUDFLARE_)
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID     || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID     || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET   = process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || ''
const BASE_URL = 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev'

// Mapeamento pasta → slug do produto no banco
const MAPA_PASTAS = {
  'SX040':               'SX040',
  'M45':                 'm45-trend',
  'sx060':               'sx060-prime',
  'SX70':                'sx070-trend',    // <-- pasta está como SX70 (sem zero)
  'SX100':               'sx100-trend',
  'SX120':               'sx120-prime',
  'SX200 PRIME':         'sx200-prime',
  'SX200 Prime - Preto': 'sx200-prime-preto',
  'SX200 Trend':         'sx200-trend',
  'ASPIRADOR':           'asp-bravo',
  'BIKE LIFE':           'spinning-sixxis-life',
}

async function uploadFile(filePath, pasta) {
  const ext      = path.extname(filePath).toLowerCase()
  const basename = path.basename(filePath)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.\-_]/g, '')

  const key = `produtos/${Date.now()}-${pasta.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')}-${basename}`
  const body = fs.readFileSync(filePath)
  const contentType =
    ext === '.png'  ? 'image/png'  :
    ext === '.webp' ? 'image/webp' :
    ext === '.gif'  ? 'image/gif'  : 'image/jpeg'

  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }))

  const url = `${BASE_URL}/${key}`
  process.stdout.write(`  ✅ ${path.basename(filePath)} → ${url}\n`)
  return url
}

async function main() {
  // Validar credenciais
  const endpoint = process.env.R2_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT
  if (!endpoint || endpoint === '' || endpoint === '""') {
    console.error('\n❌ ERRO: R2_ENDPOINT está vazio no .env.local')
    console.error('   Preencha as credenciais R2 e execute novamente.\n')
    process.exit(1)
  }

  console.log(`\n🔑 Endpoint: ${endpoint}`)
  console.log(`📦 Bucket: ${BUCKET}\n`)

  const base = path.join(process.cwd(), '_produtos-novos')
  if (!fs.existsSync(base)) {
    console.error('❌ Pasta _produtos-novos não encontrada!')
    process.exit(1)
  }

  const resultado = {}
  const pastas = fs.readdirSync(base, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  console.log(`📂 Pastas: ${pastas.join(', ')}\n`)

  for (const pasta of pastas) {
    const slug = MAPA_PASTAS[pasta]
    if (!slug) {
      console.log(`⚠️  Pasta "${pasta}" não mapeada — pulando`)
      continue
    }

    const dir     = path.join(base, pasta)
    const imagens = fs.readdirSync(dir)
      .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .sort((a, b) => {
        const nA = parseInt(a.match(/\d+/)?.[0] || '0')
        const nB = parseInt(b.match(/\d+/)?.[0] || '0')
        return nA - nB
      })

    if (!imagens.length) { console.log(`⚠️  "${pasta}" sem imagens`); continue }

    console.log(`\n📦 Uploading "${pasta}" (${imagens.length} imagens)...`)
    resultado[slug] = []

    for (let i = 0; i < imagens.length; i++) {
      try {
        const url = await uploadFile(path.join(dir, imagens[i]), pasta)
        resultado[slug].push({ arquivo: imagens[i], url, index: i })
        if (i > 0 && i % 5 === 0) await new Promise(r => setTimeout(r, 500))
      } catch (err) {
        console.error(`  ❌ Erro em ${imagens[i]}: ${err.message}`)
      }
    }

    console.log(`  ✓ ${resultado[slug].length}/${imagens.length} enviadas`)
  }

  fs.writeFileSync(
    path.join(process.cwd(), 'scripts/urls-r2.json'),
    JSON.stringify(resultado, null, 2)
  )

  console.log('\n\n📋 RESUMO:')
  for (const [slug, imgs] of Object.entries(resultado)) {
    console.log(`  ${slug}: ${imgs.length} imagens`)
  }
  console.log('\n✅ Upload concluído! URLs salvas em scripts/urls-r2.json')
}

main().catch(err => { console.error('Erro fatal:', err); process.exit(1) })
