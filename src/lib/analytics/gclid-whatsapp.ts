// ════════════════════════════════════════════════════════════════════════════
// SIXXIS — gclid → WhatsApp (lane GOOGLE do Offline Conversion Import)
// ════════════════════════════════════════════════════════════════════════════
// Objetivo: venda que fecha NO WHATSAPP (fora do checkout) hoje perde o vínculo
// com o clique do Google Ads. Aqui embutimos o gclid, de forma parseável e
// discreta, no texto pré-preenchido do link wa.me — o atendente/CRM recupera o
// gclid da 1ª mensagem e devolve a conversão ao Google.
//
// Lane GOOGLE apenas. O Meta resolve WhatsApp por CTWA (ctwa_clid) sozinho; não
// mexemos nisso aqui.
//
// LIMITE conhecido (mesmo do Pedido.gclid): a persistência depende de
// consentimento. Em URL de clique o gclid sempre existe; depois de navegar, só
// sobrevive via cookie `_gcl_aw` (Google tag, sob ad_storage) ou sessionStorage
// `sixxis_utms` (TrackingProvider, sob analytics). Sem consentimento e fora da
// landing, o gclid pode não estar disponível — nesse caso NÃO anexamos nada.

// Formato acordado com o Marketing (parse do lado CRM): sufixo no fim do texto.
const TAG_PREFIX = '[#g:'
const TAG_SUFFIX = ']'

// Charset acordado com o CRM (v1): [A-Za-z0-9_.-]. O CRM captura com
// \[#g:([^\]]+)\] e revalida. Rejeita espaço/quebra/colchete p/ não corromper o
// marcador nem permitir injeção. Inclui ponto porque faz parte do charset combinado.
const GCLID_RE = /^[A-Za-z0-9_.-]{1,200}$/

export function gclidValido(v: string | null | undefined): v is string {
  return !!v && GCLID_RE.test(v)
}

// Monta o marcador parseável. gclid inválido/ausente → string vazia (nada a anexar).
export function montarTagGclid(gclid: string | null | undefined): string {
  return gclidValido(gclid) ? `${TAG_PREFIX}${gclid}${TAG_SUFFIX}` : ''
}

// Anexa o marcador ao texto base, separado por 2 quebras de linha. Sem gclid
// válido, devolve o texto intacto (comportamento de hoje).
export function anexarGclidAoTexto(texto: string, gclid: string | null | undefined): string {
  const tag = montarTagGclid(gclid)
  return tag ? `${texto}\n\n${tag}` : texto
}

// Monta a URL wa.me final. telefone = só dígitos (ex. 5518997474701).
export function montarLinkWhatsApp(
  telefone: string,
  texto: string,
  gclid?: string | null,
): string {
  const textoFinal = anexarGclidAoTexto(texto, gclid)
  return `https://wa.me/${telefone}?text=${encodeURIComponent(textoFinal)}`
}

// Extrai o gclid de um `_gcl_aw` no formato GCL.<timestamp>.<gclid>. Devolve
// undefined se o formato não bater.
export function gclidDeGclAw(valor: string | null | undefined): string | undefined {
  if (!valor) return undefined
  const partes = valor.split('.')
  // GCL . <ts> . <gclid...> — o gclid pode conter pontos? Não (base64url). O
  // último segmento é o gclid.
  const candidato = partes.length >= 3 ? partes.slice(2).join('.') : undefined
  return gclidValido(candidato) ? candidato : undefined
}

function lerCookie(nome: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie.split(';')
    .find((c) => c.trim().startsWith(nome + '='))
    ?.split('=').slice(1).join('=').trim() || undefined
}

// Leitura client do gclid, em ordem de confiança:
//   1) param `gclid` da URL atual — sempre presente no clique
//   2) cookie `_gcl_aw` (GCL.<ts>.<gclid>) — Google tag, sobrevive à navegação
//   3) sessionStorage `sixxis_utms.gclid` — gravado pelo TrackingProvider
// Qualquer fonte inválida é ignorada. Fora do browser → undefined.
//
// v1 = SÓ gclid. gbraid/wbraid (iOS) NÃO entram na v1 — ficam pra v1.1 com
// marcadores próprios, conforme acordo com o Marketing/CRM.
//
// O valor é devolvido CRU (URL-decoded): URLSearchParams.get() já decodifica o
// percent-encoding do param; cookie/sessionStorage guardam o gclid sem encode.
export function lerGclidClient(): string | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    const sp = new URLSearchParams(window.location.search)
    const daUrl = sp.get('gclid') // v1: apenas gclid (já URL-decoded)
    if (gclidValido(daUrl)) return daUrl
  } catch { /* ignora */ }

  const doCookie = gclidDeGclAw(lerCookie('_gcl_aw'))
  if (doCookie) return doCookie

  try {
    const raw = window.sessionStorage.getItem('sixxis_utms')
    if (raw) {
      const obj = JSON.parse(raw) as { gclid?: string }
      if (gclidValido(obj.gclid)) return obj.gclid
    }
  } catch { /* ignora */ }

  return undefined
}
