// ═══════════════════════════════════════════════════
// SIXXIS — TEMPLATES DE WHATSAPP
// ═══════════════════════════════════════════════════
// WhatsApp markdown: *negrito*, _itálico_, ~riscado~
// Emojis usados estrategicamente (não excessivamente)
// Tom: profissional, caloroso, direto

export const WA_TEMPLATES = {

  // ── 1. BOAS-VINDAS ──────────────────────────────
  boasVindas: ({ nome }: { nome: string }) => `
Olá, *${nome}*! 👋

Bem-vindo(a) à *Sixxis Store* — somos especialistas em climatização há mais de 30 anos.

✅ Sua conta foi criada com sucesso.

🎁 *Presente de boas-vindas:* use o cupom *SIXXIS10* e ganhe *10% OFF* na sua primeira compra.

Precisa de ajuda para escolher o produto certo? É só responder aqui! Nossa equipe está pronta para te atender.

_Sixxis · Qualidade e Conforto para o Seu Ambiente_
`.trim(),

  // ── 2. CONFIRMAÇÃO DE PEDIDO ─────────────────────
  confirmacaoPedido: ({ nome, pedidoId, total }: { nome: string; pedidoId: string; total: string }) => `
*${nome}*, seu pedido foi confirmado! ✅

📦 *Pedido:* #${pedidoId.slice(-8).toUpperCase()}
💰 *Total:* ${total}

Agora é com a gente! Seu produto será preparado e enviado em breve.

Você receberá uma mensagem quando o pedido sair para entrega. 🚚

Dúvidas? Estamos aqui.
_Equipe Sixxis_
`.trim(),

  // ── 3. PEDIDO ENVIADO ────────────────────────────
  pedidoEnviado: ({ nome, pedidoId, codigo, previsao, link }: {
    nome: string; pedidoId: string; codigo: string; previsao: string; link: string
  }) => `
🚚 *Seu pedido saiu para entrega, ${nome}!*

📦 *Pedido:* #${pedidoId.slice(-8).toUpperCase()}
🔍 *Código de rastreio:* \`${codigo}\`
📅 *Previsão de entrega:* ${previsao}

Rastreie aqui: ${link}

Qualquer dúvida, é só chamar! 😊
_Sixxis_
`.trim(),

  // ── 4. ABANDONO DE CARRINHO ──────────────────────
  abandonoCarrinho: ({ nome, valorCarrinho, cupom }: {
    nome: string; valorCarrinho: string; cupom?: string
  }) => `
Oi, *${nome}*! 👋

Você deixou um carrinho de *${valorCarrinho}* esperando na Sixxis. 🛒

${cupom ? `🎁 Criamos um cupom *exclusivo* para você finalizar hoje:\n*Código:* ${cupom}\n\n` : ''}Finalize sua compra agora e aproveite:
✅ Parcele em até *6x sem juros*
✅ Envio em até 24h para todo Brasil
✅ *12 meses* de garantia Sixxis

Posso te ajudar com alguma dúvida?
_Equipe Sixxis_
`.trim(),

  // ── 5. CUPOM ESPECIAL ────────────────────────────
  cupomEspecial: ({ nome, codigo, desconto, validade }: {
    nome: string; codigo: string; desconto: string; validade: string
  }) => `
🎁 *${nome}, um presente exclusivo para você!*

Criamos um cupom especial com *${desconto} de desconto*:

┌──────────────────┐
│   *${codigo}*   │
│  ${desconto} OFF  │
└──────────────────┘

📅 *Válido até:* ${validade}

Use no checkout da loja Sixxis. É só aplicar o código! 🛒

_Sixxis · Qualidade e Conforto_
`.trim(),

  // ── 6. CAMPANHA GERAL (livre) ─────────────────────
  campanhaMarketing: ({ nome, mensagem, ctaTexto, ctaLink }: {
    nome: string; mensagem: string; ctaTexto?: string; ctaLink?: string
  }) => `
Olá, *${nome}*! 👋

${mensagem}

${ctaTexto && ctaLink ? `👉 ${ctaTexto}\n${ctaLink}\n` : ''}
_Sixxis Store · ${new Date().getFullYear()}_
`.trim(),

  // ── 7. REATIVAÇÃO (cliente inativo) ──────────────
  reativacao: ({ nome, diasSemCompra }: { nome: string; diasSemCompra: number }) => `
Sentimos sua falta, *${nome}*! 😊

Faz ${diasSemCompra} dias que você não visita a *Sixxis Store*.

Temos *novidades* e *ofertas exclusivas* esperando por você:
🌟 Novos modelos de climatizadores
🏷️ Promoções por tempo limitado
🎁 Cashback em dobro essa semana

Que tal dar uma olhada? 👇
_Sixxis · sixxis-store-production.up.railway.app_
`.trim(),

  // ── 8. AVALIAÇÃO PÓS-ENTREGA ─────────────────────
  solicitacaoAvaliacao: ({ nome, produto, linkAvaliacao }: {
    nome: string; produto: string; linkAvaliacao: string
  }) => `
Oi, *${nome}*! Tudo bem com seu(sua) *${produto}*? ⭐

Sua opinião é muito importante para nós e para outros clientes.

Avalie sua compra aqui (leva menos de 1 minuto):
${linkAvaliacao}

Como agradecimento, você ganha pontos extras no programa de fidelidade! 🎁

_Equipe Sixxis_
`.trim(),

}

// ──────────────────────────────────────────────────
// Função helper para personalizar template com variáveis
// ──────────────────────────────────────────────────
export function personalizarTemplate(template: string, variaveis: Record<string, string>): string {
  let resultado = template
  for (const [chave, valor] of Object.entries(variaveis)) {
    resultado = resultado.replace(new RegExp(`\\{\\{${chave}\\}\\}`, 'g'), valor)
  }
  return resultado
}
