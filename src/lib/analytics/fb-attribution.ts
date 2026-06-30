'use client'

// Captura os cookies de atribuição do Meta (_fbp / _fbc) no browser para
// persistir no Pedido e repassar ao CAPI Purchase — é o que liga a compra ao
// clique no anúncio. Se o _fbc ainda não existir mas a URL trouxer ?fbclid=,
// montamos o _fbc no formato oficial fb.1.<timestamp>.<fbclid>.

function lerCookie(nome: string): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp('(?:^|; )' + nome + '=([^;]+)'))
  return m ? decodeURIComponent(m[1]) : ''
}

export function capturarFbpFbc(): { fbp?: string; fbc?: string } {
  if (typeof window === 'undefined') return {}
  const fbp = lerCookie('_fbp') || undefined
  let fbc = lerCookie('_fbc') || undefined
  if (!fbc) {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid')
    if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`
  }
  return { fbp, fbc }
}
