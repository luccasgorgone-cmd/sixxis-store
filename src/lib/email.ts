import { prisma } from '@/lib/prisma'
import { getResend } from './email-resend'
import {
  templateBoasVindas,
  templateConfirmacaoPedido,
  templatePedidoEnviado,
  templateAbandonoCarrinho,
  templateFollowupEntrega,
  templateCupomEspecial,
  templateVoltaEstoque,
  templateSolicitacaoAvaliacao,
} from './email-templates-premium'

const FROM = process.env.EMAIL_FROM ?? 'noreply@sixxis.com.br'
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'Sixxis Store'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sixxis-store-production.up.railway.app'
const LOGO_URL = `${SITE_URL}/logo-sixxis.png`

// ─── gerarHtmlTemplate — escolhe o template premium pelo tipo ─────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function gerarHtmlTemplate(tipo: string, variaveis: Record<string, any>): string {
  const siteUrl = SITE_URL

  switch (tipo) {
    case 'boas_vindas':
      return templateBoasVindas({ nome: variaveis.nome || 'Cliente', siteUrl })

    case 'confirmacao_pedido':
      return templateConfirmacaoPedido({
        nome: variaveis.nome || 'Cliente',
        pedidoId: variaveis.pedido_id || variaveis.pedidoId || 'PEDIDO',
        itens: variaveis.itens || [],
        subtotal: Number(variaveis.subtotal) || 0,
        frete: Number(variaveis.frete) || 0,
        total: Number(variaveis.total) || 0,
        formaPagamento: variaveis.forma_pagamento || variaveis.formaPagamento || 'Cartão',
        siteUrl,
      })

    case 'pedido_enviado':
      return templatePedidoEnviado({
        nome: variaveis.nome || 'Cliente',
        pedidoId: variaveis.pedido_id || variaveis.pedidoId || 'PEDIDO',
        codigoRastreio: variaveis.codigo_rastreio || variaveis.codigoRastreio || 'Em processamento',
        transportadora: variaveis.transportadora || 'Correios',
        prazoEstimado: variaveis.previsao_entrega || variaveis.previsaoEntrega || '5 a 8 dias úteis',
        urlRastreio: variaveis.link_rastreio || variaveis.linkRastreio || `${siteUrl}/minha-conta/pedidos`,
        siteUrl,
      })

    case 'abandono_carrinho': {
      const primeiroItem = (variaveis.itens && variaveis.itens[0]) || {}
      const totalCarrinho = Number(variaveis.total_carrinho) || Number(variaveis.totalCarrinho) || Number(primeiroItem.preco) || 0
      return templateAbandonoCarrinho({
        nome: variaveis.nome || 'Cliente',
        produto: primeiroItem.nome || variaveis.produto || 'seu produto',
        imagemProduto: primeiroItem.img || variaveis.produto_img,
        preco: totalCarrinho,
        carrinhoUrl: `${siteUrl}/carrinho`,
        cupom: variaveis.cupom || 'SIXXIS10',
      })
    }

    case 'followup_entrega':
      return templateFollowupEntrega({
        nome: variaveis.nome || 'Cliente',
        produto: variaveis.produto || 'seu produto',
        produtoSlug: variaveis.produto_slug || variaveis.produtoSlug || '',
        siteUrl,
      })

    case 'cupom_especial':
      return templateCupomEspecial({
        nome: variaveis.nome || 'Cliente',
        codigoCupom: variaveis.cupom_codigo || variaveis.cupomCodigo || variaveis.codigo || '',
        percentualDesconto: Number(String(variaveis.desconto ?? variaveis.cupom_desconto ?? '10').replace(/\D/g, '')) || 10,
        validade: variaveis.validade || variaveis.cupom_validade || '7 dias',
        siteUrl,
      })

    case 'volta_estoque':
      return templateVoltaEstoque({
        nome: variaveis.nome || 'Cliente',
        produto: variaveis.produto_nome || variaveis.produtoNome || variaveis.produto || '',
        produtoSlug: variaveis.produto_slug || variaveis.produtoSlug || '',
        imagemProduto: variaveis.produto_img || variaveis.produtoImg,
        preco: Number(String(variaveis.produto_preco ?? variaveis.produtoPreco ?? 0).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
        siteUrl,
      })

    case 'solicitacao_avaliacao':
      return templateSolicitacaoAvaliacao({
        nome: variaveis.nome || 'Cliente',
        produto: variaveis.produto || 'seu produto',
        produtoSlug: variaveis.produto_slug || variaveis.produtoSlug || '',
        siteUrl,
      })

    default:
      return variaveis.corpo || ''
  }
}

// ─── Template helpers ────────────────────────────────────────────────────────

export function renderTemplate(corpo: string, vars: Record<string, string>): string {
  const varsComAno = { ano: String(new Date().getFullYear()), ...vars }
  return Object.entries(varsComAno).reduce((html, [key, val]) => {
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
    html = templateConfirmacaoPedido({
      nome: nomeCliente,
      pedidoId,
      itens: itens.map(i => ({ nome: i.nome, qtd: i.quantidade, preco: Number(i.precoUnitario) })),
      subtotal,
      frete,
      total,
      formaPagamento,
      siteUrl: SITE_URL,
    })
    assunto = `Pedido #${idCurto} confirmado — Obrigado, ${nomeCliente}!`
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
    html = templatePedidoEnviado({
      nome: nomeCliente,
      pedidoId,
      codigoRastreio,
      transportadora: 'Correios',
      prazoEstimado: '5 a 10 dias úteis',
      urlRastreio: 'https://www.correios.com.br/rastreamento',
      siteUrl: SITE_URL,
    })
    assunto = `Seu pedido #${idCurto} está a caminho!`
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
    html = templateBoasVindas({ nome: nomeCliente, siteUrl: SITE_URL })
    assunto = `Bem-vindo(a) à Sixxis, ${nomeCliente}! Seu cupom de boas-vindas está aqui`
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
    const totalCarrinho = itens.reduce((s, i) => s + i.preco * i.quantidade, 0)
    const primeiro = itens[0]
    html = templateAbandonoCarrinho({
      nome: nomeCliente,
      produto: primeiro?.nome ?? 'seu produto',
      preco: totalCarrinho,
      carrinhoUrl: `${SITE_URL}/carrinho`,
      cupom: 'SIXXIS10',
    })
    assunto = `${nomeCliente}, seu carrinho ainda está esperando`
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
    html = templateVoltaEstoque({
      nome: 'Cliente',
      produto: nomeProduto,
      produtoSlug: slugProduto,
      preco: 0,
      siteUrl: SITE_URL,
    })
    assunto = `${nomeProduto} está disponível novamente!`
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
    html = templateFollowupEntrega({
      nome: nomeCliente,
      produto: itens[0]?.nome ?? 'seu produto',
      produtoSlug: itens[0]?.slug ?? '',
      siteUrl: SITE_URL,
    })
    assunto = `Como foi a entrega do seu pedido, ${nomeCliente}?`
  }

  await getResend().emails.send({ from: `${FROM_NAME} <${FROM}>`, to: para, subject: assunto, html })
}

// ─── Envio de teste via template premium ─────────────────────────────────────

export async function enviarEmailTeste(tipo: string, emailDestino: string): Promise<void> {
  const dadosFalsos = {
    nome:             'João Silva',
    pedido_id:        'TEST12345678',
    total:            599.90,
    subtotal:         599.90,
    frete:            0,
    forma_pagamento:  'Cartão de Crédito',
    status:           'Confirmado',
    endereco:         'Rua das Flores, 123 - Araçatuba-SP',
    codigo_rastreio:  'BR123456789BR',
    link_rastreio:    'https://www.correios.com.br',
    previsao_entrega: '5 a 10 dias úteis',
    transportadora:   'Correios',
    produto:          'Climatizador Sixxis Pro',
    produto_nome:     'Climatizador Sixxis Pro',
    produto_slug:     'climatizador-sixxis-pro',
    produto_preco:    'R$ 599,90',
    produto_url:      `${SITE_URL}/produtos/climatizador-sixxis-pro`,
    cupom_codigo:     'SIXXIS15',
    desconto:         '15% OFF',
    cupom_desconto:   '15%',
    validade:         '07/05/2026',
    cupom_validade:   '07/05/2026',
    total_carrinho:   599.90,
    itens: [{ nome: 'Climatizador Sixxis Pro', qtd: 1, preco: 599.90 }],
    site_url:         SITE_URL,
  }

  const htmlFinal = gerarHtmlTemplate(tipo, dadosFalsos)

  // fallback: se o tipo não tem template premium, usar o banco
  if (!htmlFinal) {
    const template = await prisma.emailTemplate.findUnique({ where: { tipo } })
    if (!template) throw new Error(`Template "${tipo}" não encontrado`)
    await getResend().emails.send({
      from:    `${FROM_NAME} <${FROM}>`,
      to:      emailDestino,
      subject: `[TESTE] ${renderTemplate(template.assunto, { nome: 'João Silva', pedido_id: 'TEST12345678' })}`,
      html:    renderTemplate(template.corpo, dadosFalsos as unknown as Record<string, string>),
    })
    return
  }

  const assuntosFalsos: Record<string, string> = {
    boas_vindas:          'Bem-vindo(a) à Sixxis, João Silva!',
    confirmacao_pedido:   'Pedido #TEST1234 confirmado — Obrigado, João!',
    pedido_enviado:       'Seu pedido #TEST1234 está a caminho!',
    abandono_carrinho:    'João, seu carrinho ainda está esperando',
    followup_entrega:     'Como foi a entrega do seu pedido, João?',
    cupom_especial:       'Um cupom exclusivo para você, João',
    volta_estoque:        'Climatizador Sixxis Pro está disponível novamente!',
    solicitacao_avaliacao:'Avalie seu pedido TEST1234 e ajude outros clientes',
  }

  await getResend().emails.send({
    from:    `${FROM_NAME} <${FROM}>`,
    to:      emailDestino,
    subject: `[TESTE] ${assuntosFalsos[tipo] ?? tipo}`,
    html:    htmlFinal,
  })
}
