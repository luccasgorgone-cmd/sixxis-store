import { prisma } from '@/lib/prisma'

// ─── Google Merchant Center — feed de produtos (RSS 2.0 + namespace g:) ───────
// URL pública estável: https://www.sixxis.com.br/merchant-feed.xml
// Substitui o feed MORTO do WooCommerce antigo. Sem auth; o único "redirect"
// possível é o canônico apex→www do proxy.ts (registre a URL com www no MC).
// force-dynamic (lê o DB no request, como o resto do app) + Cache-Control
// s-maxage=1h: o CDN/borda guarda o XML por ~1h sem depender do DB no build.

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sixxis.com.br'

// Mapa categoria interna → (google_product_category [texto oficial], product_type).
// google_product_category é best-effort: se o texto não casar 100%, o Google
// apenas auto-categoriza (não reprova). product_type é a nossa taxonomia livre.
const CATEGORIA_MAP: Record<string, { google: string; tipo: string }> = {
  climatizadores: {
    google: 'Home & Garden > Household Appliances > Climate Control Appliances > Evaporative Coolers',
    tipo: 'Climatizadores',
  },
  aspiradores: {
    google: 'Home & Garden > Household Appliances > Vacuums',
    tipo: 'Aspiradores',
  },
  spinning: {
    google: 'Sporting Goods > Exercise & Fitness > Cardio > Exercise Bikes',
    tipo: 'Spinning & Fitness',
  },
}
const CATEGORIA_FALLBACK = { google: 'Home & Garden > Household Appliances', tipo: 'Produtos' }

// Escapa texto p/ conteúdo XML.
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Remove HTML e normaliza espaços (descrições vêm com markup do editor).
function semHTML(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Garante URL absoluta (imagens já são URLs R2 absolutas; guard defensivo).
function urlAbsoluta(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`
}

function precoBRL(v: number): string {
  return `${v.toFixed(2)} BRL`
}

interface ItemFeed {
  id: string
  title: string
  description: string
  link: string
  imagem: string
  imagensAdicionais: string[]
  disponivel: boolean
  precoRegular: number
  precoPromo: number | null
  itemGroupId?: string
  cor?: string
  googleCategoria: string
  productType: string
  mpn: string
  // Frete por UF (g:shipping). price = custo Normal naquele estado p/ 1 unidade
  // (0 quando frete grátis). Desbloqueia o Shopping (frete configurado no feed).
  shipping: { region: string; price: number }[]
}

function renderItem(it: ItemFeed): string {
  const linhas: string[] = [
    `<g:id>${esc(it.id)}</g:id>`,
    `<g:title>${esc(it.title)}</g:title>`,
    `<g:description>${esc(it.description)}</g:description>`,
    `<g:link>${esc(it.link)}</g:link>`,
    `<g:image_link>${esc(it.imagem)}</g:image_link>`,
    ...it.imagensAdicionais.map((u) => `<g:additional_image_link>${esc(u)}</g:additional_image_link>`),
    `<g:availability>${it.disponivel ? 'in_stock' : 'out_of_stock'}</g:availability>`,
    `<g:price>${esc(precoBRL(it.precoRegular))}</g:price>`,
    ...(it.precoPromo != null ? [`<g:sale_price>${esc(precoBRL(it.precoPromo))}</g:sale_price>`] : []),
    `<g:brand>Sixxis</g:brand>`,
    `<g:condition>new</g:condition>`,
    `<g:google_product_category>${esc(it.googleCategoria)}</g:google_product_category>`,
    `<g:product_type>${esc(it.productType)}</g:product_type>`,
    // Sixxis é a marca e cada produto tem MPN (SKU) → brand+mpn identificam o
    // produto. NÃO enviamos identifier_exists=no (diria "sem identificadores" e
    // anularia o MPN). Sem GTIN real, brand+mpn é o caminho correto pro Google.
    `<g:mpn>${esc(it.mpn)}</g:mpn>`,
    ...(it.itemGroupId ? [`<g:item_group_id>${esc(it.itemGroupId)}</g:item_group_id>`] : []),
    ...(it.cor ? [`<g:color>${esc(it.cor)}</g:color>`] : []),
    // Frete por estado — um bloco g:shipping por UF atendida (serviço "Padrão").
    ...it.shipping.map(
      (s) =>
        `<g:shipping><g:country>BR</g:country><g:region>${esc(s.region)}</g:region>` +
        `<g:service>Padrão</g:service><g:price>${esc(precoBRL(s.price))}</g:price></g:shipping>`,
    ),
  ]
  return `    <item>\n      ${linhas.join('\n      ')}\n    </item>`
}

export async function GET() {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    include: {
      variacoes: { where: { ativo: true }, orderBy: { createdAt: 'asc' } },
      // Frete por UF (fonte única: FreteRegra produto × estado). Só os campos
      // necessários p/ montar o g:shipping de cada estado atendido.
      freteRegras: {
        select: { uf: true, precoNormal: true, freteGratis: true, bloqueado: true, aCombinar: true },
      },
    },
    orderBy: { nome: 'asc' },
  })

  const itens: ItemFeed[] = []

  for (const p of produtos) {
    const imagens = (Array.isArray(p.imagens) ? p.imagens : []).filter(
      (u): u is string => typeof u === 'string' && u.length > 0,
    )
    const imagemPrincipal = imagens[0]
    if (!imagemPrincipal) continue // sem imagem → Google reprovaria; pula

    const cat = CATEGORIA_MAP[p.categoria] ?? CATEGORIA_FALLBACK
    const link = `${SITE_URL}/produtos/${p.slug}`
    const sku = p.sku ?? p.slug
    const descricao =
      semHTML(p.descricao) ||
      `${p.nome} — ${cat.tipo} Sixxis. Garantia de 12 meses, frete para todo o Brasil.`
    const imagensAdicionais = imagens.slice(1, 11).map(urlAbsoluta) // Google: até 10
    const precoBase = Number(p.preco)
    const promoBase = p.precoPromocional != null ? Number(p.precoPromocional) : null

    // Frete por UF: um bloco por estado ATENDIDO. Pula bloqueado/a_combinar
    // (sem preço fixo). Frete grátis (flag ou precoNormal 0) → 0.00. Mesma
    // regra do site (frete-resolver), aqui sempre por 1 unidade.
    const shipping = p.freteRegras
      .filter((r) => !r.bloqueado && !r.aCombinar && (r.freteGratis || r.precoNormal != null))
      .map((r) => ({
        region: r.uf,
        price: r.freteGratis || Number(r.precoNormal) === 0 ? 0 : Number(r.precoNormal),
      }))
      .sort((a, b) => a.region.localeCompare(b.region))

    const base = {
      title: p.nome,
      description: descricao,
      link,
      imagem: urlAbsoluta(imagemPrincipal),
      imagensAdicionais,
      googleCategoria: cat.google,
      productType: cat.tipo,
      shipping,
    }

    // Variações com PREÇO PRÓPRIO (ex.: sx200-prime cor Branco/Preto) → 1 item
    // por variação, agrupados por g:item_group_id e diferenciados por g:color.
    // Voltagem (110V/220V) usa preço base (preco null) → cai no item único.
    const variacoesPrecificadas = p.variacoes.filter((v) => v.preco != null)

    if (variacoesPrecificadas.length > 0) {
      for (const v of p.variacoes) {
        const precoVar = v.preco != null ? Number(v.preco) : precoBase
        itens.push({
          ...base,
          id: v.sku,
          title: `${p.nome} — ${v.nome}`,
          disponivel: v.estoque > 0,
          precoRegular: precoVar,
          precoPromo: null, // não há promo por variação hoje
          itemGroupId: sku,
          cor: v.nome,
          mpn: v.sku,
        })
      }
    } else {
      // Item único por produto. Voltagem não muda preço; estoque do produto já
      // agrega as variações. price=regular, sale_price=promocional (quando há).
      itens.push({
        ...base,
        id: sku,
        disponivel: p.estoque > 0,
        precoRegular: precoBase,
        precoPromo: promoBase,
        mpn: sku,
      })
    }
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n` +
    `  <channel>\n` +
    `    <title>Sixxis — Catálogo</title>\n` +
    `    <link>${esc(SITE_URL)}</link>\n` +
    `    <description>Climatizadores, aspiradores e spinning Sixxis.</description>\n` +
    itens.map(renderItem).join('\n') +
    `\n  </channel>\n` +
    `</rss>\n`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
