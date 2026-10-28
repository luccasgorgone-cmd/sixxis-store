// ════════════════════════════════════════════════════════════════════════════
// SIXXIS — Contratos dos touchpoints WhatsApp pré-venda (fonte única)
// ════════════════════════════════════════════════════════════════════════════
// Fone + texto base de cada ponto que abre WhatsApp antes da venda. Centralizado
// aqui pra: (1) não duplicar literal em cada componente, (2) os testes travarem
// o VALOR REAL que o componente emite (regressão: mudar número/texto quebra teste).
//
// Todos passam por montarLinkWhatsApp (gclid-whatsapp.ts), que embute o gclid
// consent-gated. Fone = só dígitos (ex. 5518997474701).
//
// Nota: o footer usa fones vindos da config (whatsappVendas/whatsappSuporte do
// banco), então só COMPARTILHA os textos daqui — os fones dele são dinâmicos.
// Os demais pontos (botão flutuante, menu mobile, link de produto) usam estes
// números fixos.

export const WA_FONE_VENDAS = '5518997474701'
export const WA_FONE_SUPORTE = '5511934102621'

export const WA_TEXTO_VENDAS = 'Olá! Vim pelo site Sixxis e gostaria de mais informações.'
export const WA_TEXTO_SUPORTE = 'Olá! Vim pelo site Sixxis e preciso de suporte técnico.'

// "Tire sua dúvida" no produto — texto depende do nome do produto.
export function waTextoDuvidaProduto(nomeProduto: string): string {
  return `Olá! Tenho uma dúvida sobre ${nomeProduto}`
}
