// IP do cliente para controles de segurança (bloqueio de força bruta, auditoria).
//
// A loja roda atrás do edge do Railway (server: railway-hikari), SEM Cloudflare
// na frente. Logo `cf-connecting-ip` NÃO é setado por nenhum proxy confiável:
// chega exatamente como o cliente mandou. Confiar nele deixava qualquer um
// trocar de "IP" a cada requisição e nunca cair no bloqueio de tentativas do
// login admin. Aqui só usamos os headers que o edge do Railway preenche — a
// mesma fonte do rate-limit (getClientIp em ratelimit.ts).
//
// Se um dia a loja passar a ficar atrás do Cloudflare, reavaliar: aí o header
// confiável passa a ser o do CF, e o origin deve aceitar só IPs do Cloudflare.
export function ipDoCliente(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const primeiro = xff.split(',')[0].trim()
    if (primeiro) return primeiro
  }
  const xri = headers.get('x-real-ip')?.trim()
  if (xri) return xri
  return 'unknown'
}
