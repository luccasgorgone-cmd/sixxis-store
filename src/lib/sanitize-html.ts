import DOMPurify from 'isomorphic-dompurify'

// Sanitiza HTML rico digitado pelo admin (descrição de produto, popup inicial)
// ANTES de gravar no banco — sai script/onerror/href="javascript:" etc, mas
// mantém formatação básica (negrito, link, lista, título). Roda no write
// path (não no read path): todo consumidor futuro do campo já recebe HTML
// limpo, sem precisar lembrar de sanitizar de novo em cada novo lugar que
// renderiza com dangerouslySetInnerHTML.
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li', 'a', 'span',
  'h1', 'h2', 'h3', 'h4', 'blockquote',
]
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class']

export function sanitizarHtmlRico(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}
