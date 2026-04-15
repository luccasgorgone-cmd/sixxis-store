const mammoth = require('mammoth')
const fs = require('fs')
const path = require('path')

async function main() {
  const base = path.join(process.cwd(), '_produtos-novos')
  const pastas = fs.readdirSync(base, { withFileTypes: true })
    .filter(d => d.isDirectory()).map(d => d.name)

  for (const pasta of pastas) {
    const dir = path.join(base, pasta)
    const docx = fs.readdirSync(dir).find(f => f.endsWith('.docx'))
    if (!docx) { console.log(`\n=== ${pasta}: SEM .docx ===\n`); continue }
    const result = await mammoth.extractRawText({ path: path.join(dir, docx) })
    console.log(`\n${'='.repeat(60)}`)
    console.log(`PASTA: ${pasta}`)
    console.log(`DOCX: ${docx}`)
    console.log('-'.repeat(60))
    console.log(result.value)
    console.log('='.repeat(60))
  }
}
main()
