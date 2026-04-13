import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

let resend: Resend | null = null
function getResend(): Resend {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  return resend
}

const FROM = process.env.EMAIL_FROM ?? 'noreply@sixxis.com.br'
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'Sixxis Store'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sixxis.com.br'
const LOGO_URL = `${SITE_URL}/logo-sixxis.png`

// ─── Template helpers ────────────────────────────────────────────────────────

export function renderTemplate(corpo: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((html, [key, val]) => {
    return html.replaceAll(`{{${key}}}`, val ?? '')
  }, corpo)
}

async function getTemplate(tipo: string) {
  try {
    const t = await prisma.emailTemplate.findUnique({ where: { tipo } })
    if (!t || !t.ativo) return null
    return t
  } catch {
    return null
  }
}

// ─── Hardcoded fallback layout ───────────────────────────────────────────────

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sixxis Store</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#0f1f1e;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
            <img src="${LOGO_URL}" alt="Sixxis" width="140" style="filter:brightness(0) invert(1);display:block;margin:0 auto;" />
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px 32px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background:#f8f9fa;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Sixxis Store — Araçatuba, SP</p>
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              <a href="${SITE_URL}" style="color:#3cbfb3;text-decoration:none;">Visitar loja</a>
              &nbsp;·&nbsp;
              <a href="https://wa.me/5518997474701" style="color:#3cbfb3;text-decoration:none;">WhatsApp</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(text: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background:#3cbfb3;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;margin-top:8px;">${text}</a>`
}

function itemRow(nome: string, variacao: string | null, qtd: number, preco: number) {
  const total = (preco * qtd).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const unitario = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return `<tr>
    <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${nome}${variacao ? ` <span style="color:#3cbfb3;">(${variacao})</span>` : ''}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">${qtd}x ${unitario}</p>
    </td>
    <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#111827;font-size:14px;">${total}</td>
  </tr>`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemEmail {
  nome: string
  variacaoNome?: string | null
  quantidade: number
  precoUnitario: number
}

// ─── Email functions ──────────────────────────────────────────────────────────

export async function enviarEmailConfirmacaoPedido(para: string, opts: {
  nomeCliente:    string
  pedidoId:       string
  itens:          ItemEmail[]
  frete:          number
  desconto:       number
  total:          number
  formaPagamento: string
  endereco:       string
}) {
  if (!process.env.RESEND_API_KEY) return

  const { nomeCliente, pedidoId, itens, frete, desconto, total, formaPagamento, endereco } = opts
  const idCurto = pedidoId.slice(-8).toUpperCase()
  const template = await getTemplate('confirmacao_pedido')

  let html: string
  let assunto: string

  if (template) {
    const itensHtml = itens.map((i) => `
      <div style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
        <p style="margin:0;font-weight:600;color:#0a0a0a;">${i.nome}${i.variacaoNome ? ` (${i.variacaoNome})` : ''}</p>
        <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Qtd: ${i.quantidade} × ${Number(i.precoUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
      </div>
    `).join('')

    html = renderTemplate(template.corpo, {
      nome:            nomeCliente,
      pedido_id:       idCurto,
      total:           total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      forma_pagamento: formaPagamento,
      status:          'Confirmado',
      endereco,
      site_url:        SITE_URL,
      ITENS_PEDIDO:    itensHtml,
    })
    assunto = renderTemplate(template.assunto, { nome: nomeCliente, pedido_id: idCurto })
  } else {
    const subtotal = total - frete + desconto
    const rows = itens.map((i) => itemRow(i.nome, i.variacaoNome ?? null, i.quantidade, Number(i.precoUnitario))).join('')
    html = layout(`
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#111827;">Pedido confirmado! 🎉</h1>
      <p style="margin:0 0 24px;color:#6b7280;">Olá, <strong>${nomeCliente}</strong>. Seu pedido foi recebido e está sendo processado.</p>
      <div style="background:#f0fdf9;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#065f46;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Número do Pedido</p>
        <p style="margin:8px 0 0;font-size:26px;font-weight:800;color:#059669;letter-spacing:0.1em;">#${idCurto}</p>
      </div>
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Itens do Pedido</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        ${rows}
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;">Subtotal</td>
          <td style="padding:8px 0;text-align:right;font-size:13px;color:#6b7280;">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280;">Frete</td>
          <td style="padding:4px 0;text-align:right;font-size:13px;color:#6b7280;">${frete === 0 ? 'Grátis' : frete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        </tr>
        ${desconto > 0 ? `<tr><td style="padding:4px 0;font-size:13px;color:#059669;">Desconto (cupom)</td><td style="padding:4px 0;text-align:right;font-size:13px;color:#059669;">-${desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>` : ''}
        <tr>
          <td style="padding:12px 0 0;font-size:16px;font-weight:800;color:#111827;border-top:2px solid #e5e7eb;">Total</td>
          <td style="padding:12px 0 0;text-align:right;font-size:16px;font-weight:800;color:#3cbfb3;border-top:2px solid #e5e7eb;">${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        </tr>
      </table>
      <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;">Entrega</p>
        <p style="margin:0;font-size:14px;color:#6b7280;">${endereco}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">Forma de pagamento: <strong style="color:#374151;">${formaPagamento}</strong></p>
      </div>
      <div style="text-align:center;">${btn('Acompanhar Pedido →', `${SITE_URL}/pedidos`)}</div>
    `)
    assunto = `✅ Pedido #${idCurto} confirmado!`
  }

  await getResend().emails.send({ from: `${FROM_NAME} <${FROM}>`, to: para, subject: assunto, html })
}

export async function enviarEmailRastreio(para: string, opts: {
  nomeCliente:    string
  pedidoId:       string
  codigoRastreio: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const { nomeCliente, pedidoId, codigoRastreio } = opts
  const idCurto = pedidoId.slice(-8).toUpperCase()
  const template = await getTemplate('pedido_enviado')

  let html: string
  let assunto: string

  if (template) {
    html = renderTemplate(template.corpo, {
      nome:             nomeCliente,
      pedido_id:        idCurto,
      codigo_rastreio:  codigoRastreio,
      link_rastreio:    'https://www.correios.com.br/rastreamento',
      previsao_entrega: '5 a 10 dias úteis',
      site_url:         SITE_URL,
    })
    assunto = renderTemplate(template.assunto, { nome: nomeCliente, pedido_id: idCurto })
  } else {
    html = layout(`
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#111827;">Seu pedido está a caminho! 🚚</h1>
      <p style="margin:0 0 24px;color:#6b7280;">Olá, <strong>${nomeCliente}</strong>! Seu pedido foi enviado.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#1d4ed8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Código de Rastreio</p>
        <p style="margin:12px 0;font-size:24px;font-weight:800;color:#1e3a8a;letter-spacing:0.15em;font-family:monospace;">${codigoRastreio}</p>
        <a href="https://www.correios.com.br/rastreamento" style="font-size:13px;color:#3b82f6;">Rastrear nos Correios →</a>
      </div>
      <div style="text-align:center;">${btn('Ver Meu Pedido →', `${SITE_URL}/pedidos`)}</div>
    `)
    assunto = `📦 Seu pedido #${idCurto} foi enviado!`
  }

  await getResend().emails.send({ from: `${FROM_NAME} <${FROM}>`, to: para, subject: assunto, html })
}

export async function enviarEmailBoasVindas(para: string, nomeCliente: string) {
  if (!process.env.RESEND_API_KEY) return

  const template = await getTemplate('boas_vindas')

  let html: string
  let assunto: string

  if (template) {
    html = renderTemplate(template.corpo, { nome: nomeCliente, site_url: SITE_URL })
    assunto = renderTemplate(template.assunto, { nome: nomeCliente })
  } else {
    html = layout(`
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#111827;">Bem-vindo à Sixxis! 🎉</h1>
      <p style="margin:0 0 24px;color:#6b7280;">Olá, <strong>${nomeCliente}</strong>! Sua conta foi criada com sucesso.</p>
      <div style="margin-bottom:24px;">
        ${[
          ['🚚', 'Frete grátis', 'Para compras acima de R$500 para todo o Brasil'],
          ['💳', 'Parcele em até 12x', 'Sem juros no cartão de crédito'],
          ['🏆', 'Garantia Sixxis', 'Todos os produtos com garantia total'],
          ['📞', 'Suporte especializado', 'Equipe pronta para te ajudar'],
        ].map(([icon, title, desc]) => `
          <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #f3f4f6;">
            <span style="font-size:20px;">${icon}</span>
            <div>
              <p style="margin:0;font-weight:700;font-size:14px;color:#111827;">${title}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${desc}</p>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;">${btn('Explorar Produtos →', `${SITE_URL}/produtos`)}</div>
    `)
    assunto = `🎉 Bem-vindo à Sixxis, ${nomeCliente}!`
  }

  await getResend().emails.send({ from: `${FROM_NAME} <${FROM}>`, to: para, subject: assunto, html })
}

export async function enviarEmailAbandonoCarrinho(para: string, opts: {
  nomeCliente: string
  itens:       Array<{ nome: string; preco: number; quantidade: number }>
}) {
  if (!process.env.RESEND_API_KEY) return

  const { nomeCliente, itens } = opts
  const template = await getTemplate('abandono_carrinho')

  const itensHtml = itens.map((i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">
        ${i.nome} <span style="color:#9ca3af;">×${i.quantidade}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#111827;">
        ${(i.preco * i.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </td>
    </tr>
  `).join('')

  let html: string
  let assunto: string

  if (template) {
    html = renderTemplate(template.corpo, {
      nome:          nomeCliente,
      site_url:      SITE_URL,
      ITENS_CARRINHO: `<table width="100%" cellpadding="0" cellspacing="0">${itensHtml}</table>`,
    })
    assunto = renderTemplate(template.assunto, { nome: nomeCliente })
  } else {
    html = layout(`
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#111827;">Você esqueceu algo! 🛒</h1>
      <p style="margin:0 0 24px;color:#6b7280;">Olá, <strong>${nomeCliente}</strong>! Você deixou itens no carrinho.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${itensHtml}</table>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Esses produtos podem sair de estoque. Finalize sua compra agora!</p>
      <div style="text-align:center;">${btn('Finalizar Compra →', `${SITE_URL}/carrinho`)}</div>
    `)
    assunto = `🛒 ${nomeCliente}, você esqueceu itens no carrinho!`
  }

  await getResend().emails.send({ from: `${FROM_NAME} <${FROM}>`, to: para, subject: assunto, html })
}

export async function enviarEmailVoltaEstoque(para: string, opts: {
  nomeProduto: string
  slugProduto: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const { nomeProduto, slugProduto } = opts
  const template = await getTemplate('volta_estoque')

  let html: string
  let assunto: string

  if (template) {
    html = renderTemplate(template.corpo, {
      nome:         '',
      produto_nome: nomeProduto,
      produto_slug: slugProduto,
      produto_url:  `${SITE_URL}/produtos/${slugProduto}`,
      site_url:     SITE_URL,
      PRODUTO_CARD: `<div style="background:#f9fafb;border-radius:12px;padding:20px;text-align:center;">
        <p style="margin:0;font-weight:700;font-size:16px;color:#0a0a0a;">${nomeProduto}</p>
        <p style="margin:8px 0 0;color:#3cbfb3;font-size:14px;">Disponível agora!</p>
      </div>`,
    })
    assunto = renderTemplate(template.assunto, { produto_nome: nomeProduto })
  } else {
    html = layout(`
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#111827;">Produto disponível! ⚡</h1>
      <p style="margin:0 0 24px;color:#6b7280;">Uma boa notícia! O produto que você estava aguardando voltou ao estoque.</p>
      <div style="background:#f0fdf9;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:18px;font-weight:700;color:#059669;">${nomeProduto}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">Disponível agora — mas pode esgotar rápido!</p>
      </div>
      <div style="text-align:center;">${btn('Comprar Agora →', `${SITE_URL}/produtos/${slugProduto}`)}</div>
    `)
    assunto = `⚡ ${nomeProduto} voltou ao estoque!`
  }

  await getResend().emails.send({ from: `${FROM_NAME} <${FROM}>`, to: para, subject: assunto, html })
}

export async function enviarEmailFollowUp(para: string, opts: {
  nomeCliente: string
  pedidoId:    string
  itens:       Array<{ nome: string; slug: string }>
}) {
  if (!process.env.RESEND_API_KEY) return

  const { nomeCliente, pedidoId, itens } = opts
  const idCurto = pedidoId.slice(-8).toUpperCase()
  const template = await getTemplate('followup_entrega')

  let html: string
  let assunto: string

  if (template) {
    html = renderTemplate(template.corpo, {
      nome:         nomeCliente,
      pedido_id:    idCurto,
      produto_slug: itens[0]?.slug ?? '',
      site_url:     SITE_URL,
    })
    assunto = renderTemplate(template.assunto, { nome: nomeCliente, pedido_id: idCurto })
  } else {
    html = layout(`
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#111827;">Como foi sua experiência? ⭐</h1>
      <p style="margin:0 0 24px;color:#6b7280;">Olá, <strong>${nomeCliente}</strong>! Seu pedido <strong>#${idCurto}</strong> foi entregue. O que achou?</p>
      <div style="margin-bottom:24px;">
        ${itens.map((i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f3f4f6;">
            <span style="font-size:14px;color:#374151;">${i.nome}</span>
            <a href="${SITE_URL}/produtos/${i.slug}#avaliacoes" style="font-size:13px;color:#3cbfb3;font-weight:600;text-decoration:none;">Avaliar →</a>
          </div>
        `).join('')}
      </div>
      <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#374151;">Ficou com alguma dúvida?</p>
        <a href="https://wa.me/5518997474701" style="display:inline-block;margin-top:12px;background:#25d366;color:#fff;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;">💬 Falar no WhatsApp</a>
      </div>
    `)
    assunto = `⭐ ${nomeCliente}, avalie sua compra!`
  }

  await getResend().emails.send({ from: `${FROM_NAME} <${FROM}>`, to: para, subject: assunto, html })
}

// ─── Envio de teste via template do banco ────────────────────────────────────

export async function enviarEmailTeste(tipo: string, emailDestino: string): Promise<void> {
  const template = await prisma.emailTemplate.findUnique({ where: { tipo } })
  if (!template) throw new Error(`Template "${tipo}" não encontrado`)

  const dadosFalsos: Record<string, string> = {
    nome:             'João Silva',
    pedido_id:        'ABC12345',
    total:            'R$ 599,90',
    forma_pagamento:  'Cartão de Crédito',
    status:           'Confirmado',
    endereco:         'Rua das Flores, 123 - Araçatuba-SP',
    codigo_rastreio:  'BR123456789BR',
    link_rastreio:    'https://www.correios.com.br',
    previsao_entrega: '5 a 10 dias úteis',
    produto_nome:     'Climatizador Sixxis Pro',
    produto_slug:     'climatizador-sixxis-pro',
    produto_url:      `${SITE_URL}/produtos/climatizador-sixxis-pro`,
    cupom_codigo:     'SIXXIS15',
    cupom_desconto:   '15%',
    cupom_validade:   '31/12/2025',
    site_url:         SITE_URL,
    ITENS_PEDIDO: `<div style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
      <p style="margin:0;font-weight:600;">Climatizador Sixxis Pro</p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Qtd: 1 × R$ 599,90</p>
    </div>`,
    ITENS_CARRINHO: `<div style="padding:12px;background:#f9fafb;border-radius:8px;margin-bottom:8px;">
      <p style="margin:0;font-weight:600;">Climatizador Sixxis Pro</p>
      <p style="margin:4px 0 0;color:#3cbfb3;font-weight:700;">R$ 599,90</p>
    </div>`,
    PRODUTO_CARD: `<div style="background:#f9fafb;border-radius:12px;padding:20px;">
      <p style="margin:0;font-weight:700;font-size:16px;">Climatizador Sixxis Pro</p>
      <p style="margin:8px 0 0;color:#3cbfb3;font-size:18px;font-weight:700;">R$ 599,90</p>
    </div>`,
  }

  await getResend().emails.send({
    from:    `${FROM_NAME} <${FROM}>`,
    to:      emailDestino,
    subject: `[TESTE] ${renderTemplate(template.assunto, dadosFalsos)}`,
    html:    renderTemplate(template.corpo, dadosFalsos),
  })
}
