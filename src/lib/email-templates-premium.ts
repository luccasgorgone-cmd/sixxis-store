import { emailBase, emailBotao, emailDivisor, BRAND } from './sixxis-email-design'

// ══════════════════════════════════════════════
// 1. BOAS-VINDAS
// ══════════════════════════════════════════════
export function templateBoasVindas({
  nome, siteUrl
}: { nome: string; siteUrl: string }) {
  const conteudo = `
    <!-- HERO -->
    <div class="email-hero-pad" style="background:linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 60%, #3cbfb3 100%);padding:48px 40px;text-align:center;">
      <p style="color:rgba(255,255,255,0.7);font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Bem-vindo à família</p>
      <h1 style="color:#ffffff;font-size:32px;font-weight:900;line-height:1.2;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        Olá, ${nome}!
      </h1>
      <p style="color:rgba(255,255,255,0.7);font-size:16px;margin-bottom:0;">
        Estamos muito felizes em ter você aqui.
      </p>
    </div>

    <!-- CONTEÚDO PRINCIPAL -->
    <div class="email-content-pad" style="padding:40px;">

      <p style="font-size:16px;color:#374151;line-height:1.7;margin-bottom:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        Sua conta na <strong style="color:#0f2e2b;">Sixxis Store</strong> foi criada com sucesso.
        A partir de agora você tem acesso a toda a nossa linha de climatizadores, aspiradores e
        spinning — produtos de alta qualidade, direto de Araçatuba para todo o Brasil.
      </p>

      <!-- Benefícios em destaque -->
      <div style="background:#f8fafc;border-radius:16px;padding:24px;margin-bottom:32px;border:1px solid #e5e7eb;">
        <p style="font-size:12px;font-weight:800;color:#3cbfb3;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">O que você ganha sendo cliente Sixxis</p>
        ${[
          '&#127873; Cupom SIXXIS10 — 10% OFF na primeira compra',
          '&#128176; Cashback de 2% a 6% em todas as compras',
          '&#128666; Frete grátis acima de R$ 500',
          '&#128179; 6x sem juros no cartão de crédito',
          '&#128274; Garantia real de 12 meses em todos os produtos',
          '&#127775; Programa de fidelidade com níveis Cristal &#8594; Esmeralda'
        ].map(item => `
          <div style="margin-bottom:10px;">
            <p style="font-size:14px;color:#374151;margin:0;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${item}</p>
          </div>
        `).join('')}
      </div>

      <!-- CTA Principal -->
      <div style="text-align:center;margin-bottom:32px;">
        ${emailBotao({ texto: '&#9889; Explorar produtos agora', href: siteUrl + '/produtos' })}
        <p style="font-size:12px;color:#9ca3af;margin-top:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          Use o cupom <strong style="color:#3cbfb3;">SIXXIS10</strong> no checkout para 10% OFF!
        </p>
      </div>

      ${emailDivisor()}

      <!-- Categorias -->
      <div style="margin-top:32px;">
        <p style="font-size:14px;font-weight:700;color:#0f2e2b;margin-bottom:16px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Explore nossas categorias</p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td width="33%" align="center" style="padding:8px;">
              <a href="${siteUrl}/produtos?categoria=climatizadores"
                style="display:block;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px 8px;text-decoration:none;">
                <p style="font-size:24px;margin-bottom:6px;">&#10052;&#65039;</p>
                <p style="font-size:12px;font-weight:700;color:#0f2e2b;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Climatizadores</p>
              </a>
            </td>
            <td width="33%" align="center" style="padding:8px;">
              <a href="${siteUrl}/produtos?categoria=aspiradores"
                style="display:block;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px 8px;text-decoration:none;">
                <p style="font-size:24px;margin-bottom:6px;">&#127744;</p>
                <p style="font-size:12px;font-weight:700;color:#0f2e2b;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Aspiradores</p>
              </a>
            </td>
            <td width="33%" align="center" style="padding:8px;">
              <a href="${siteUrl}/produtos?categoria=spinning"
                style="display:block;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px 8px;text-decoration:none;">
                <p style="font-size:24px;margin-bottom:6px;">&#128692;</p>
                <p style="font-size:12px;font-weight:700;color:#0f2e2b;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Spinning</p>
              </a>
            </td>
          </tr>
        </table>
      </div>

    </div>

    <!-- RODAPÉ SECUNDÁRIO -->
    <div style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="font-size:13px;color:#6b7280;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Dúvidas? Fale conosco:</p>
      <a href="https://wa.me/${BRAND.whatsapp}"
        style="display:inline-block;background:#25D366;color:#ffffff;font-weight:700;font-size:13px;
               padding:10px 24px;border-radius:24px;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        &#128172; WhatsApp (18) 99747-4701
      </a>
    </div>
  `

  return emailBase({
    assunto: `Bem-vindo(a) à Sixxis, ${nome}! Seu cupom de boas-vindas está aqui`,
    preview: `Sua conta foi criada. Aproveite 10% OFF na primeira compra com SIXXIS10.`,
    conteudo
  })
}

// ══════════════════════════════════════════════
// 2. CONFIRMAÇÃO DE PEDIDO
// ══════════════════════════════════════════════
export function templateConfirmacaoPedido({
  nome, pedidoId, itens, subtotal, frete, total, formaPagamento, siteUrl
}: {
  nome: string
  pedidoId: string
  itens: Array<{nome: string; qtd: number; preco: number; img?: string}>
  subtotal: number
  frete: number
  total: number
  formaPagamento: string
  siteUrl: string
}) {
  const fmtValor = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const idCurto = pedidoId.slice(-8).toUpperCase()

  const conteudo = `
    <!-- HERO SUCCESS -->
    <div class="email-hero-pad" style="background:linear-gradient(135deg, #0f2e2b, #1a4f4a);padding:40px;text-align:center;">
      <p style="font-size:40px;margin-bottom:12px;">&#9989;</p>
      <p style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Pedido confirmado</p>
      <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        Pedido #${idCurto}
      </h1>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        Recebemos seu pedido e já estamos preparando tudo.
      </p>
    </div>

    <div class="email-content-pad" style="padding:40px;">

      <p style="font-size:16px;color:#374151;line-height:1.7;margin-bottom:28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        Olá, <strong>${nome}</strong>! Seu pedido foi confirmado com sucesso.
        Você receberá uma notificação assim que ele for enviado.
      </p>

      <!-- Itens do pedido -->
      <div style="background:#f8fafc;border-radius:16px;padding:24px;margin-bottom:28px;border:1px solid #e5e7eb;">
        <p style="font-size:12px;font-weight:800;color:#3cbfb3;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Resumo do pedido</p>
        ${itens.map(item => `
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-bottom:1px solid #e5e7eb;margin-bottom:8px;padding-bottom:8px;">
            <tr>
              ${item.img ? `<td width="56" style="padding-right:12px;vertical-align:middle;"><img src="${item.img}" width="48" height="48" style="border-radius:8px;object-fit:contain;background:#fff;border:1px solid #e5e7eb;display:block;" alt="${item.nome}"/></td>` : ''}
              <td style="vertical-align:middle;">
                <p style="font-size:14px;font-weight:600;color:#1a202c;margin-bottom:2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${item.nome}</p>
                <p style="font-size:12px;color:#9ca3af;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Qtd: ${item.qtd}</p>
              </td>
              <td align="right" style="vertical-align:middle;">
                <p style="font-size:14px;font-weight:700;color:#1a202c;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${fmtValor(item.preco * item.qtd)}</p>
              </td>
            </tr>
          </table>
        `).join('')}

        <!-- Totais -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;">
          <tr>
            <td style="font-size:13px;color:#6b7280;padding:3px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Subtotal</td>
            <td align="right" style="font-size:13px;color:#374151;padding:3px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${fmtValor(subtotal)}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#6b7280;padding:3px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Frete</td>
            <td align="right" style="font-size:13px;color:${frete === 0 ? '#059669' : '#374151'};padding:3px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${frete === 0 ? '&#127881; Grátis' : fmtValor(frete)}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#6b7280;padding:3px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Pagamento</td>
            <td align="right" style="font-size:13px;color:#374151;padding:3px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${formaPagamento}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:12px;border-top:2px solid #e5e7eb;"></td>
          </tr>
          <tr>
            <td style="font-size:16px;font-weight:900;color:#0f2e2b;padding:3px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Total</td>
            <td align="right" style="font-size:18px;font-weight:900;color:#3cbfb3;padding:3px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${fmtValor(total)}</td>
          </tr>
        </table>
      </div>

      <!-- O que acontece agora -->
      <div style="margin-bottom:32px;">
        <p style="font-size:14px;font-weight:800;color:#0f2e2b;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">O que acontece agora?</p>
        ${[
          { num: '01', titulo: 'Preparação', desc: 'Seu pedido está sendo separado com cuidado.' },
          { num: '02', titulo: 'Envio', desc: 'Você receberá o código de rastreamento por e-mail.' },
          { num: '03', titulo: 'Entrega', desc: 'Produto chega em 3 a 8 dias úteis.' },
        ].map(step => `
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:12px;">
            <tr>
              <td width="40" style="vertical-align:top;">
                <div style="width:32px;height:32px;border-radius:50%;background:#3cbfb3;text-align:center;line-height:32px;">
                  <span style="font-size:11px;font-weight:900;color:#0f2e2b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${step.num}</span>
                </div>
              </td>
              <td style="vertical-align:top;padding-left:8px;">
                <p style="font-size:14px;font-weight:700;color:#1a202c;margin-bottom:2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${step.titulo}</p>
                <p style="font-size:13px;color:#6b7280;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${step.desc}</p>
              </td>
            </tr>
          </table>
        `).join('')}
      </div>

      <!-- CTA -->
      <div style="text-align:center;">
        ${emailBotao({ texto: '&#128230; Acompanhar pedido', href: `${siteUrl}/minha-conta/pedidos` })}
      </div>

    </div>
  `
  return emailBase({
    assunto: `Pedido #${idCurto} confirmado — Obrigado, ${nome}!`,
    preview: `Seu pedido foi recebido. Acompanhe em tempo real.`,
    conteudo
  })
}

// ══════════════════════════════════════════════
// 3. PEDIDO ENVIADO
// ══════════════════════════════════════════════
export function templatePedidoEnviado({
  nome, pedidoId, codigoRastreio, transportadora, previsaoEntrega, linkRastreio, siteUrl
}: {
  nome: string
  pedidoId: string
  codigoRastreio: string
  transportadora: string
  previsaoEntrega: string
  linkRastreio: string
  siteUrl: string
}) {
  const idCurto = pedidoId.slice(-8).toUpperCase()

  const conteudo = `
    <!-- HERO ENVIO -->
    <div class="email-hero-pad" style="background:linear-gradient(135deg, #0f2e2b, #1a4f4a);padding:40px;text-align:center;">
      <p style="font-size:40px;margin-bottom:12px;">&#128666;</p>
      <p style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Em trânsito</p>
      <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Seu pedido saiu!</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Previsão de entrega: <strong style="color:#3cbfb3;">${previsaoEntrega}</strong></p>
    </div>

    <div class="email-content-pad" style="padding:40px;">
      <p style="font-size:16px;color:#374151;line-height:1.7;margin-bottom:28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        Ótima notícia, <strong>${nome}</strong>! Seu pedido <strong>#${idCurto}</strong>
        foi enviado e já está a caminho.
      </p>

      <!-- Box de rastreamento -->
      <div style="background:#f8fafc;border:2px solid #3cbfb3;border-radius:16px;padding:24px;margin-bottom:32px;text-align:center;">
        <p style="font-size:12px;font-weight:800;color:#3cbfb3;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Código de rastreamento</p>
        <p style="font-size:24px;font-weight:900;color:#0f2e2b;font-family:monospace;letter-spacing:0.15em;margin-bottom:16px;">${codigoRastreio}</p>
        <p style="font-size:13px;color:#6b7280;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Transportadora: <strong>${transportadora}</strong></p>
        ${emailBotao({ texto: '&#128269; Rastrear meu pedido', href: linkRastreio })}
      </div>

      <!-- Timeline visual -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
        ${[
          { icon: '&#9989;', label: 'Pedido confirmado', status: 'done' },
          { icon: '&#128230;', label: 'Em preparação', status: 'done' },
          { icon: '&#128666;', label: 'Enviado — em trânsito', status: 'active' },
          { icon: '&#127968;', label: 'Aguardando entrega', status: 'pending' },
        ].map(step => `
          <tr>
            <td width="20" style="vertical-align:middle;padding:6px 0;">
              <div style="width:14px;height:14px;border-radius:50%;background:${step.status === 'done' ? '#3cbfb3' : step.status === 'active' ? '#f59e0b' : '#e5e7eb'};"></div>
            </td>
            <td style="vertical-align:middle;padding:6px 0 6px 12px;">
              <p style="font-size:14px;font-weight:${step.status === 'active' ? '700' : '500'};
                         color:${step.status === 'pending' ? '#9ca3af' : '#374151'};margin:0;
                         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                ${step.icon} ${step.label}
              </p>
            </td>
          </tr>
        `).join('')}
      </table>

      <div style="text-align:center;">
        ${emailBotao({ texto: 'Ver meus pedidos', href: `${siteUrl}/minha-conta/pedidos` })}
      </div>
    </div>
  `
  return emailBase({
    assunto: `Seu pedido #${idCurto} está a caminho!`,
    preview: `Seu produto está a caminho. Rastreie agora.`,
    conteudo
  })
}

// ══════════════════════════════════════════════
// 4. ABANDONO DE CARRINHO
// ══════════════════════════════════════════════
export function templateAbandonoCarrinho({
  nome, itens, totalCarrinho, cupom, siteUrl
}: {
  nome: string
  itens: Array<{nome: string; preco: number; img?: string}>
  totalCarrinho: number
  cupom?: string
  siteUrl: string
}) {
  const fmtValor = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const conteudo = `
    <!-- HERO -->
    <div class="email-hero-pad" style="background:linear-gradient(135deg, #0f2e2b, #1a4f4a);padding:40px;text-align:center;">
      <p style="font-size:40px;margin-bottom:12px;">&#128722;</p>
      <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${nome}, você esqueceu algo!</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Seu carrinho ainda está esperando por você.</p>
    </div>

    <div class="email-content-pad" style="padding:40px;">

      <!-- Itens do carrinho -->
      <p style="font-size:14px;font-weight:800;color:#0f2e2b;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Os itens no seu carrinho:</p>
      <div style="background:#f8fafc;border-radius:16px;padding:20px;margin-bottom:24px;border:1px solid #e5e7eb;">
        ${itens.slice(0, 3).map(item => `
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:8px;">
            <tr>
              ${item.img ? `<td width="56" style="padding-right:12px;vertical-align:middle;"><img src="${item.img}" width="48" height="48" style="border-radius:8px;object-fit:contain;display:block;" alt="${item.nome}"/></td>` : ''}
              <td style="vertical-align:middle;">
                <p style="font-size:14px;font-weight:600;color:#1a202c;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${item.nome}</p>
              </td>
              <td align="right" style="vertical-align:middle;">
                <p style="font-size:14px;font-weight:700;color:#3cbfb3;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${fmtValor(item.preco)}</p>
              </td>
            </tr>
          </table>
        `).join('')}
        <div style="text-align:right;margin-top:12px;">
          <p style="font-size:15px;font-weight:900;color:#0f2e2b;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Total: ${fmtValor(totalCarrinho)}</p>
        </div>
      </div>

      ${cupom ? `
        <!-- Cupom de urgência -->
        <div style="background:linear-gradient(135deg, #3cbfb3, #2a9d8f);border-radius:16px;padding:20px;margin-bottom:28px;text-align:center;">
          <p style="color:rgba(255,255,255,0.9);font-size:13px;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">&#127873; Criamos um cupom exclusivo para você:</p>
          <p style="color:#ffffff;font-size:22px;font-weight:900;font-family:monospace;letter-spacing:0.15em;margin-bottom:4px;">${cupom}</p>
          <p style="color:rgba(255,255,255,0.8);font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Use no checkout e ganhe desconto exclusivo!</p>
        </div>
      ` : ''}

      <!-- Urgência -->
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin-bottom:28px;text-align:center;">
        <p style="font-size:13px;color:#c2410c;font-weight:600;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">&#9200; Atenção: seu carrinho pode expirar em breve!</p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        ${emailBotao({ texto: '&#128722; Finalizar minha compra', href: `${siteUrl}/checkout` })}
      </div>

      <!-- Garantias -->
      <div style="text-align:center;">
        <p style="font-size:12px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">&#128274; Compra segura · &#128666; Frete grátis acima de R$500 · &#11088; 12 meses de garantia</p>
      </div>

    </div>
  `
  return emailBase({
    assunto: `${nome}, seu carrinho ainda está esperando`,
    preview: `Você deixou itens no carrinho. Finalize agora com frete grátis.`,
    conteudo
  })
}

// ══════════════════════════════════════════════
// 5. FOLLOW-UP PÓS-ENTREGA
// ══════════════════════════════════════════════
export function templateFollowupEntrega({
  nome, pedidoId, produto, siteUrl
}: {
  nome: string
  pedidoId: string
  produto: string
  siteUrl: string
}) {
  const idCurto = pedidoId.slice(-8).toUpperCase()

  const conteudo = `
    <div class="email-hero-pad" style="background:linear-gradient(135deg, #0f2e2b, #1a4f4a);padding:40px;text-align:center;">
      <p style="font-size:40px;margin-bottom:12px;">&#127968;</p>
      <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Chegou tudo bem?</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Queremos saber como foi a sua experiência.</p>
    </div>

    <div class="email-content-pad" style="padding:40px;">
      <p style="font-size:16px;color:#374151;line-height:1.7;margin-bottom:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        Olá, <strong>${nome}</strong>! Seu pedido <strong>#${idCurto}</strong> —
        <em>${produto}</em> — foi entregue.
        Esperamos que esteja amando seu produto!
      </p>

      <p style="font-size:15px;font-weight:700;color:#0f2e2b;margin-bottom:16px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        Como foi a sua experiência?
      </p>

      <!-- Estrelas clicáveis -->
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 28px;">
        <tr>
          ${[5,4,3,2,1].map(n => `
            <td style="padding:0 6px;">
              <a href="${siteUrl}/minha-conta/avaliar?pedido=${pedidoId}&nota=${n}"
                style="display:block;width:48px;height:48px;background:#fef9c3;border-radius:12px;
                       font-size:24px;text-align:center;line-height:48px;text-decoration:none;
                       border:2px solid #fde68a;">
                &#11088;
              </a>
            </td>
          `).join('')}
        </tr>
        <tr>
          ${[5,4,3,2,1].map(n => `
            <td style="padding:4px 6px;text-align:center;font-size:10px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${n}&#9733;</td>
          `).join('')}
        </tr>
      </table>

      <div style="text-align:center;margin-bottom:28px;">
        ${emailBotao({ texto: '&#9997;&#65039; Deixar uma avaliação', href: `${siteUrl}/minha-conta/avaliar?pedido=${pedidoId}` })}
      </div>

      ${emailDivisor()}

      <div style="margin-top:28px;text-align:center;">
        <p style="font-size:14px;color:#374151;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Gostou? Confira outros produtos:</p>
        ${emailBotao({ texto: 'Ver produtos', href: `${siteUrl}/produtos`, cor: BRAND.corEscura, corTexto: '#ffffff' })}
      </div>
    </div>
  `
  return emailBase({
    assunto: `Como foi a entrega do seu pedido, ${nome}?`,
    preview: `Avalie sua experiência e ajude outros clientes.`,
    conteudo
  })
}

// ══════════════════════════════════════════════
// 6. CUPOM ESPECIAL
// ══════════════════════════════════════════════
export function templateCupomEspecial({
  nome, cupomCodigo, desconto, validade, pedidoMinimo, siteUrl
}: {
  nome: string
  cupomCodigo: string
  desconto: string
  validade: string
  pedidoMinimo?: string
  siteUrl: string
}) {
  const conteudo = `
    <div class="email-hero-pad" style="background:linear-gradient(135deg, #0f2e2b, #1a4f4a);padding:40px;text-align:center;">
      <p style="font-size:40px;margin-bottom:12px;">&#127873;</p>
      <p style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Exclusivo para você</p>
      <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Presente especial, ${nome}!</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Um cupom exclusivo está esperando por você.</p>
    </div>

    <div class="email-content-pad" style="padding:40px;">

      <!-- Box do cupom -->
      <div style="text-align:center;margin-bottom:32px;">
        <p style="font-size:14px;color:#6b7280;margin-bottom:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Seu cupom exclusivo:</p>
        <div style="background:linear-gradient(135deg, #3cbfb3, #2a9d8f);border-radius:20px;padding:28px 32px;">
          <p style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">USE O CÓDIGO</p>
          <p style="color:#ffffff;font-size:32px;font-weight:900;font-family:monospace;letter-spacing:0.2em;margin-bottom:8px;">${cupomCodigo}</p>
          <p style="color:rgba(255,255,255,0.9);font-size:20px;font-weight:900;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${desconto} de desconto</p>
        </div>
      </div>

      <!-- Detalhes do cupom -->
      <div style="background:#f8fafc;border-radius:16px;padding:20px;margin-bottom:32px;border:1px solid #e5e7eb;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="font-size:13px;color:#6b7280;padding:6px 0;border-bottom:1px solid #e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Desconto</td>
            <td align="right" style="font-size:13px;font-weight:700;color:#3cbfb3;padding:6px 0;border-bottom:1px solid #e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${desconto}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#6b7280;padding:6px 0;border-bottom:1px solid #e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Válido até</td>
            <td align="right" style="font-size:13px;font-weight:700;color:#374151;padding:6px 0;border-bottom:1px solid #e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${validade}</td>
          </tr>
          ${pedidoMinimo ? `
          <tr>
            <td style="font-size:13px;color:#6b7280;padding:6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Pedido mínimo</td>
            <td align="right" style="font-size:13px;font-weight:700;color:#374151;padding:6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${pedidoMinimo}</td>
          </tr>` : ''}
        </table>
      </div>

      <div style="text-align:center;margin-bottom:16px;">
        ${emailBotao({ texto: '&#128717; Usar cupom agora', href: `${siteUrl}/produtos` })}
      </div>
      <p style="font-size:12px;color:#9ca3af;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">O desconto é aplicado automaticamente no checkout.</p>
    </div>
  `
  return emailBase({
    assunto: `Um cupom exclusivo para você, ${nome}`,
    preview: `${desconto} de desconto até ${validade}. Use o código ${cupomCodigo}.`,
    conteudo
  })
}

// ══════════════════════════════════════════════
// 7. VOLTA AO ESTOQUE
// ══════════════════════════════════════════════
export function templateVoltaEstoque({
  nome, produtoNome, produtoImg, produtoPreco, produtoUrl, siteUrl: _siteUrl
}: {
  nome: string
  produtoNome: string
  produtoImg?: string
  produtoPreco: string
  produtoUrl: string
  siteUrl: string
}) {
  const conteudo = `
    <div class="email-hero-pad" style="background:linear-gradient(135deg, #0f2e2b, #1a4f4a);padding:40px;text-align:center;">
      <p style="font-size:40px;margin-bottom:12px;">&#9889;</p>
      <p style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Está de volta!</p>
      <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Produto disponível!</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${nome}, você pediu para ser avisado.</p>
    </div>

    <div class="email-content-pad" style="padding:40px;">
      <p style="font-size:16px;color:#374151;line-height:1.7;margin-bottom:28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        O produto que você estava acompanhando voltou ao estoque e está disponível para compra!
        Aproveite antes que esgote novamente.
      </p>

      <!-- Card do produto -->
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:20px;margin-bottom:28px;text-align:center;">
        ${produtoImg ? `<img src="${produtoImg}" width="160" height="160" style="border-radius:12px;object-fit:contain;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" alt="${produtoNome}"/>` : ''}
        <p style="font-size:16px;font-weight:800;color:#0f2e2b;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${produtoNome}</p>
        <p style="font-size:22px;font-weight:900;color:#3cbfb3;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${produtoPreco}</p>
        ${emailBotao({ texto: '&#128722; Comprar agora', href: produtoUrl })}
      </div>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px;text-align:center;">
        <p style="font-size:13px;color:#c2410c;font-weight:600;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">&#9888;&#65039; Estoque limitado — corra!</p>
      </div>
    </div>
  `
  return emailBase({
    assunto: `${produtoNome} está disponível novamente!`,
    preview: `${nome}, o produto que você esperava voltou ao estoque!`,
    conteudo
  })
}

// ══════════════════════════════════════════════
// 8. SOLICITAÇÃO DE AVALIAÇÃO
// ══════════════════════════════════════════════
export function templateSolicitacaoAvaliacao({
  nome, pedidoId, produto, siteUrl
}: {
  nome: string
  pedidoId: string
  produto: string
  siteUrl: string
}) {
  const idCurto = pedidoId.slice(-8).toUpperCase()

  const conteudo = `
    <div class="email-hero-pad" style="background:linear-gradient(135deg, #0f2e2b, #1a4f4a);padding:40px;text-align:center;">
      <p style="font-size:40px;margin-bottom:12px;">&#11088;</p>
      <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Sua opinião importa!</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Ajude outros clientes a fazer a escolha certa.</p>
    </div>

    <div class="email-content-pad" style="padding:40px;">
      <p style="font-size:16px;color:#374151;line-height:1.7;margin-bottom:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        Olá, <strong>${nome}</strong>! O que achou do <strong>${produto}</strong>?
        Sua avaliação ajuda outros clientes a fazer a melhor escolha — e é muito importante para nós!
      </p>

      <!-- Como avaliar -->
      <div style="background:#f8fafc;border-radius:16px;padding:24px;margin-bottom:28px;border:1px solid #e5e7eb;text-align:center;">
        <p style="font-size:14px;font-weight:700;color:#0f2e2b;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Clique para avaliar seu produto:</p>
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 16px;">
          <tr>
            ${[
              { nota: 5, emoji: '&#128525;', label: 'Amei!' },
              { nota: 4, emoji: '&#128522;', label: 'Gostei' },
              { nota: 3, emoji: '&#128528;', label: 'Regular' },
              { nota: 2, emoji: '&#128533;', label: 'Ruim' },
              { nota: 1, emoji: '&#128542;', label: 'Péssimo' },
            ].map(r => `
              <td style="padding:0 6px;text-align:center;">
                <a href="${siteUrl}/minha-conta/avaliar?pedido=${pedidoId}&nota=${r.nota}"
                  style="display:block;text-decoration:none;">
                  <div style="width:52px;height:52px;border-radius:14px;background:#f0fffe;border:2px solid #3cbfb3;font-size:24px;text-align:center;line-height:52px;margin-bottom:4px;">
                    ${r.emoji}
                  </div>
                  <p style="font-size:10px;color:#6b7280;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${r.label}</p>
                </a>
              </td>
            `).join('')}
          </tr>
        </table>
        ${emailBotao({ texto: '&#9997;&#65039; Escrever avaliação completa', href: `${siteUrl}/minha-conta/avaliar?pedido=${pedidoId}` })}
      </div>

      <p style="font-size:13px;color:#9ca3af;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        &#127873; Avalie e acumule pontos no programa de fidelidade Sixxis!
      </p>
    </div>
  `
  return emailBase({
    assunto: `Avalie seu pedido ${idCurto} e ajude outros clientes`,
    preview: `Como foi a sua experiência? Sua opinião vale muito.`,
    conteudo
  })
}

// ══════════════════════════════════════════════
// 9. UPGRADE DE NÍVEL — GEMAS
// ══════════════════════════════════════════════

const GEM_GRADIENTS: Record<string, string> = {
  Cristal:   'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 60%, #38bdf8 100%)',
  Topázio:   'linear-gradient(135deg, #78350f 0%, #d97706 55%, #fbbf24 100%)',
  Safira:    'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #60a5fa 100%)',
  Diamante:  'linear-gradient(135deg, #3730a3 0%, #818cf8 55%, #e0e7ff 100%)',
  Esmeralda: 'linear-gradient(135deg, #064e3b 0%, #10b981 55%, #6ee7b7 100%)',
}

const GEM_CASHBACK: Record<string, string> = {
  Cristal: '2%', Topázio: '3%', Safira: '4%', Diamante: '5%', Esmeralda: '7%',
}

export function templateUpgradeNivel({
  nome, nivelAnterior, nivelNovo, totalGasto, siteUrl
}: {
  nome: string
  nivelAnterior: string
  nivelNovo: string
  totalGasto: number
  siteUrl: string
}) {
  const gradient = GEM_GRADIENTS[nivelNovo] ?? GEM_GRADIENTS.Cristal
  const cashback = GEM_CASHBACK[nivelNovo] ?? '2%'
  const fmtValor = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const conteudo = `
    <!-- HERO -->
    <div class="email-hero-pad" style="background:${gradient};padding:52px 40px;text-align:center;">
      <p style="color:rgba(255,255,255,0.75);font-size:12px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">&#127775; Parabéns, ${nome}!</p>
      <h1 style="color:#ffffff;font-size:34px;font-weight:900;line-height:1.15;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        Você subiu para<br/>nível <span style="text-shadow:0 0 20px rgba(255,255,255,0.6);">${nivelNovo}</span>!
      </h1>
      <p style="color:rgba(255,255,255,0.7);font-size:15px;margin-bottom:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        De ${nivelAnterior} para ${nivelNovo} — você chegou lá!
      </p>
    </div>

    <!-- CONTEÚDO -->
    <div class="email-content-pad" style="padding:40px;">

      <p style="font-size:16px;color:#374151;line-height:1.7;margin-bottom:28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        Olá, <strong>${nome}</strong>! Com <strong>${fmtValor(totalGasto)}</strong> em compras acumuladas,
        você conquistou o nível <strong style="color:#0f2e2b;">${nivelNovo}</strong> no programa de fidelidade Sixxis.
        Continue comprando para aproveitar ainda mais benefícios!
      </p>

      <!-- Destaque cashback -->
      <div style="background:${gradient};border-radius:20px;padding:28px;margin-bottom:28px;text-align:center;">
        <p style="color:rgba(255,255,255,0.75);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Seu novo cashback</p>
        <p style="color:#ffffff;font-size:52px;font-weight:900;line-height:1;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${cashback}</p>
        <p style="color:rgba(255,255,255,0.75);font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">em todas as suas compras</p>
      </div>

      <!-- Benefícios -->
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-bottom:28px;">
        <p style="font-size:12px;font-weight:800;color:#3cbfb3;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">O que você ganhou</p>
        ${[
          `&#128176; ${cashback} cashback automático em toda compra`,
          '&#128666; Benefícios exclusivos de frete e descontos',
          '&#9889; Acesso prioritário a lançamentos e ofertas',
        ].map(item => `
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
            <p style="font-size:14px;color:#374151;margin:0;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${item}</p>
          </div>
        `).join('')}
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        ${emailBotao({ texto: '&#128722; Aproveitar meu novo nível', href: `${siteUrl}/minha-conta/cashback` })}
      </div>

      <p style="font-size:12px;color:#9ca3af;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        Confira seus benefícios completos em Minha Conta → Cashback.
      </p>
    </div>
  `

  return emailBase({
    assunto: `🎉 Parabéns! Você é ${nivelNovo} na Sixxis, ${nome}!`,
    preview: `De ${nivelAnterior} para ${nivelNovo}! Seu cashback subiu para ${cashback}. Confira seus novos benefícios.`,
    conteudo,
  })
}
