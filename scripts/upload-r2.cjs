const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

// Load .env.local (the project uses .env.local)
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  }
}

const endpoint = process.env.R2_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || ''
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || ''
const BUCKET = process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || ''
const BASE_URL = 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev'

if (!endpoint || !accessKeyId || !secretAccessKey || !BUCKET) {
  console.error('ERRO: Credenciais R2 não encontradas.')
  console.error('Defina em .env.local: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME')
  process.exit(1)
}

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
})

async function uploadFile(filePath, pasta) {
  const ext = path.extname(filePath).toLowerCase()
  const basename = path.basename(filePath)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
  const key = `produtos/${Date.now()}-${pasta.toLowerCase().replace(/\s+/g,'-')}-${basename}`
  const body = fs.readFileSync(filePath)
  const contentType = ext === '.png' ? 'image/png'
    : ext === '.webp' ? 'image/webp'
    : 'image/jpeg'

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: body, ContentType: contentType,
  }))
  return `${BASE_URL}/${key}`
}

async function main() {
  const base = path.join(process.cwd(), '_produtos-novos')
  const pastas = fs.readdirSync(base, { withFileTypes: true })
    .filter(d => d.isDirectory()).map(d => d.name)

  const resultado = {}

  for (const pasta of pastas) {
    const dir = path.join(base, pasta)
    const imgs = fs.readdirSync(dir)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .sort()

    resultado[pasta] = []
    for (const img of imgs) {
      const url = await uploadFile(path.join(dir, img), pasta)
      resultado[pasta].push({ arquivo: img, url })
      console.log(`OK ${pasta}/${img} -> ${url}`)
    }
  }

  fs.writeFileSync('scripts/urls-r2.json', JSON.stringify(resultado, null, 2))
  console.log('\nMapeamento salvo em scripts/urls-r2.json')
  console.log(JSON.stringify(resultado, null, 2))
}
main()
