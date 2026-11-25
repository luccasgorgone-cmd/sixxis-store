// Capa só de vitrine: usa uma foto oficial da própria galeria para manter os
// climatizadores na mesma direção. Não altera a ordem salva nem o feed.
const CAPA_LATERAL_POR_SLUG: Record<string, string> = {
  'sx100-trend': 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1785262376861-8vi6jj4.jpg',
  'sx120-prime': 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/catalog/sx120-card-cover-2026-11-25/sx120-prime/4b3c4e95be63322c-sx120-prime-branco-3q-card-1600.jpg',
}

export function capaVitrine(slug: string, imagens: unknown): string | null {
  const lista = Array.isArray(imagens)
    ? imagens.filter((url): url is string => typeof url === 'string' && url.length > 0)
    : []
  const lateral = CAPA_LATERAL_POR_SLUG[slug]
  if (lateral && lista.includes(lateral)) return lateral
  return lista[0] ?? null
}

export function galeriaVitrine(slug: string, imagens: string[]): string[] {
  const capa = capaVitrine(slug, imagens)
  if (!capa || capa === imagens[0]) return imagens
  return [capa, ...imagens.filter((url) => url !== capa)]
}
