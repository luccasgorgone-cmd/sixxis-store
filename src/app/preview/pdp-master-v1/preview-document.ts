import path from 'node:path'
import { readFile } from 'node:fs/promises'

const PROTOTYPE_DIR = path.join(
  process.cwd(),
  'src/app/preview/pdp-master-v1/prototype',
)

const ASSETS = [
  ['assets/inter-latin.woff2', 'font/woff2'],
  ['assets/logo-sixxis.png', 'image/png'],
  ['assets/sx120-prime-branco-01-frontal-1600-canonical-v3.jpg', 'image/jpeg'],
  ['assets/sx120-prime-branco-02-controles-1600-canonical-v3.jpg', 'image/jpeg'],
  ['assets/sx120-prime-branco-03-reservatorio-1600-canonical-v3.jpg', 'image/jpeg'],
] as const

export async function buildPreviewDocument() {
  const [html, css, script, ...assetBuffers] = await Promise.all([
    readFile(path.join(PROTOTYPE_DIR, 'index.html'), 'utf8'),
    readFile(path.join(PROTOTYPE_DIR, 'styles.css'), 'utf8'),
    readFile(path.join(PROTOTYPE_DIR, 'script.js'), 'utf8'),
    ...ASSETS.map(([assetPath]) => readFile(path.join(PROTOTYPE_DIR, assetPath))),
  ])

  const dataUris = new Map(
    ASSETS.map(([assetPath, mime], index) => [
      assetPath,
      `data:${mime};base64,${assetBuffers[index].toString('base64')}`,
    ]),
  )

  let embeddedCss = css
  let embeddedScript = script
  let document = html

  for (const [assetPath, dataUri] of dataUris) {
    embeddedCss = embeddedCss.replaceAll(assetPath, dataUri)
    embeddedScript = embeddedScript.replaceAll(assetPath, dataUri)
    document = document.replaceAll(assetPath, dataUri)
  }

  return document
    .replace('<link rel="stylesheet" href="styles.css">', `<style>${embeddedCss}</style>`)
    .replace('<script src="script.js"></script>', `<script>${embeddedScript.replaceAll('</script>', '<\\/script>')}</script>`)
}
