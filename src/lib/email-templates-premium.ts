import { emailBase, emailBotao, emailDivisor, svg, BRAND } from './sixxis-email-design'

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"
const fmtValor = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function hero({
  eyebrow, titulo, subtitulo, bg = `linear-gradient(135deg, ${BRAND.corEscura}, ${BRAND.corMedia})`,
}: { eyebrow?: string; titulo: string; subtitulo?: string; bg?: string }) {
  return `
    <div class="email-hero-pad" style="background:${bg};padding:44px 40px;text-align:center;">
      ${eyebrow ? `<p style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;font-family:${FONT};">${eyebrow}</p>` : ''}
      <h1 style="color:#ffffff;font-size:26px;font-weight:900;line-height:1.25;margin-bottom:${subtitulo ? '8px' : '0'};font-family:${FONT};">${titulo}</h1>
      ${subtitulo ? `<p style="color:rgba(255,255,255,0.75);font-size:15px;margin:0;font-family:${FONT};">${subtitulo}</p>` : ''}
    </div>`
}

function paragrafo(texto: string) {
  return `<p style="font-size:15px;color:#1f2937;line-height:1.7;margin-bottom:20px;font-family:${FONT};">${texto}</p>`
}

function selosGrid() {
  const selo = (icone: string, titulo: string) => `
    <td width="33%" align="center" class="email-col-half" style="padding:8px;">
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:14px 8px;">
        ${svg(icone, BRAND.corEscura, 22)}
        <p style="font-size:11px;color:${BRAND.corEscura};font-weight:700;margin-top:6px;font-family:${FONT};">${titulo}</p>
      </div>
    </td>`
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
      <tr>
        ${selo('shield', 'SSL seguro')}
        ${selo('truck', 'Frete grátis')}
        ${selo('star', 'Garantia 12m')}
      </tr>
      <tr>
        ${selo('credit', '6x sem juros')}
        ${selo('heart', 'Cashback')}
        ${selo('package', '30 anos')}
      </tr>
    </table>`
}

// ══════════════════════════════════════════════
// 1. BOAS-VINDAS
// ══════════════════════════════════════════════
export function templateBoasVindas({
  nome, siteUrl,
}: { nome: string; siteUrl: string }) {
  const conteudo = `
    ${hero({
      eyebrow: 'Bem-vindo à família',
      titulo: `Olá, ${nome}`,
      subtitulo: 'Seu desconto de 10% já está ativo',
    })}
    <div class="email-content-pad" style="padding:40px 32px;">
      ${paragrafo(`Sua conta na <strong>Sixxis Store</strong> foi criada. Já liberamos um cupom exclusivo de boas-vindas para você usar na sua primeira compra.`)}

      <div style="background:linear-gradient(135deg, ${BRAND.corEscura}, ${BRAND.corMedia});border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
        ${svg('gift', BRAND.corPrincipal, 32)}
        <p style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:10px 0 4px;font-family:${FONT};">Seu cupom de boas-vindas</p>
        <p style="color:${BRAND.corPrincipal};font-size:32px;font-weight:900;letter-spacing:0.08em;margin-bottom:6px;font-family:${FONT};">SIXXIS10</p>
        <p style="color:#ffffff;font-size:14px;margin:0;font-family:${FONT};">10% OFF na primeira compra</p>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        ${emailBotao({ texto: 'Explorar produtos agora', href: `${siteUrl}/produtos` })}
      </div>
      ${selosGrid()}
      ${emailDivisor()}
      ${paragrafo(`Dúvidas? Fale com nossa equipe humana via WhatsApp <strong>(18) 99747-4701</strong>.`)}
    </div>`
  return emailBase({
    assunto: `Bem-vindo à Sixxis, ${nome} — seu desconto de 10% já está ativo`,
    preview: `Sua conta foi criada. Aproveite 10% OFF com SIXXIS10.`,
    conteudo,
  })
}

// ══════════════════════════════════════════════
// 2. CONFIRMAÇÃO DE PEDIDO
// ══════════════════════════════════════════════
export function templateConfirmacaoPedido({
  nome, pedidoId, itens, subtotal, frete, total, formaPagamento, enderecoResumo, siteUrl,
}: {
  nome: string
  pedidoId: string
  itens: Array<{ nome: string; qtd: number; preco: number; img?: string }>
  subtotal: number
  frete: number
  total: number
  formaPagamento: string
  enderecoResumo?: string
  siteUrl: string
}) {
  const idCurto = pedidoId.slice(-8).toUpperCase()
  const linhas = itens.map(i => `
    <tr>
      <td width="64" style="padding:8px 0;">
        ${i.img ? `<img src="${i.img}" width="56" height="56" alt="" style="border-radius:8px;background:#f8fafc;object-fit:contain;"/>` : `<div style="width:56px;height:56px;background:#f8fafc;border-radius:8px;"></div>`}
      </td>
      <td style="padding:8px 12px;font-family:${FONT};">
        <p style="font-size:14px;color:${BRAND.corEscura};font-weight:700;margin:0 0 2px;">${i.nome}</p>
        <p style="font-size:12px;color:#6b7280;margin:0;">Qtd ${i.qtd} · ${fmtValor(i.preco)}</p>
      </td>
      <td align="right" style="padding:8px 0;font-family:${FONT};">
        <p style="font-size:14px;color:${BRAND.corEscura};font-weight:800;margin:0;">${fmtValor(i.preco * i.qtd)}</p>
      </td>
    </tr>`).join('')

  const conteudo = `
    ${hero({
      eyebrow: 'Pedido confirmado',
      titulo: `Obrigado pela compra, ${nome}`,
      subtitulo: `Pedido #${idCurto} · ${formaPagamento}`,
    })}
    <div class="email-content-pad" style="padding:40px 32px;">
      ${paragrafo(`Recebemos seu pagamento e seu pedido entrou na fila de separação. Em breve você receberá o código de rastreio.`)}

      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:20px 16px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${linhas}</table>
        <div style="height:1px;background:#e5e7eb;margin:12px 0;"></div>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-family:${FONT};">
          <tr><td style="font-size:13px;color:#6b7280;padding:2px 0;">Subtotal</td><td align="right" style="font-size:13px;color:${BRAND.corEscura};padding:2px 0;">${fmtValor(subtotal)}</td></tr>
          <tr><td style="font-size:13px;color:#6b7280;padding:2px 0;">Frete</td><td align="right" style="font-size:13px;color:${BRAND.corEscura};padding:2px 0;">${fmtValor(frete)}</td></tr>
          <tr><td style="font-size:14px;color:${BRAND.corEscura};font-weight:800;padding-top:8px;">Total</td><td align="right" style="font-size:18px;color:${BRAND.corEscura};font-weight:900;padding-top:8px;">${fmtValor(total)}</td></tr>
        </table>
      </div>

      ${enderecoResumo ? `
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:14px 16px;margin-bottom:24px;">
          <p style="font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;font-family:${FONT};">Endereço de entrega</p>
          <p style="font-size:13px;color:${BRAND.corEscura};line-height:1.5;margin:0;font-family:${FONT};">${enderecoResumo}</p>
        </div>` : ''}

      <div style="text-align:center;margin-bottom:24px;">
        ${emailBotao({ texto: 'Acompanhar pedido', href: `${siteUrl}/minha-conta/pedidos/${pedidoId}` })}
      </div>
    </div>`
  return emailBase({
    assunto: `Pedido #${idCurto} confirmado — em breve no seu endereço`,
    preview: `Seu pedido foi confirmado. Total: ${fmtValor(total)}.`,
    conteudo,
  })
}

// ══════════════════════════════════════════════
// 3. PEDIDO ENVIADO
// ══════════════════════════════════════════════
export function templatePedidoEnviado({
  nome, pedidoId, codigoRastreio, transportadora, urlRastreio, prazoEstimado, siteUrl,
}: {
  nome: string
  pedidoId: string
  codigoRastreio: string
  transportadora: string
  urlRastreio?: string
  prazoEstimado?: string
  siteUrl: string
}) {
  const idCurto = pedidoId.slice(-8).toUpperCase()
  const conteudo = `
    ${hero({
      eyebrow: 'Pedido a caminho',
      titulo: `${nome}, seu pedido saiu para entrega`,
      subtitulo: `Pedido #${idCurto}`,
    })}
    <div class="email-content-pad" style="padding:40px 32px;">
      ${paragrafo(`Despachamos seu pedido pela <strong>${transportadora}</strong>. Use o código abaixo para acompanhar em tempo real.`)}

      <div style="background:#0f2e2b;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
        ${svg('truck', BRAND.corPrincipal, 28)}
        <p style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:10px 0 6px;font-family:${FONT};">Código de rastreio</p>
        <p style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:0.1em;margin:0 0 4px;font-family:${FONT};">${codigoRastreio}</p>
        ${prazoEstimado ? `<p style="color:${BRAND.corPrincipal};font-size:13px;margin:6px 0 0;font-family:${FONT};">Previsão: ${prazoEstimado}</p>` : ''}
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        ${emailBotao({ texto: 'Rastrear entrega', href: urlRastreio || `${siteUrl}/minha-conta/pedidos/${pedidoId}` })}
      </div>

      ${paragrafo(`Fique atento aos próximos dias. Se precisar de ajuda, responda este email ou chame no WhatsApp.`)}
    </div>`
  return emailBase({
    assunto: `Seu pedido #${idCurto} saiu para entrega`,
    preview: `Rastreio: ${codigoRastreio} · ${transportadora}`,
    conteudo,
  })
}

// ══════════════════════════════════════════════
// 4. FOLLOW-UP PÓS-ENTREGA (3 dias)
// ══════════════════════════════════════════════
export function templateFollowupEntrega({
  nome, produto, produtoSlug, siteUrl, valorCashback = 10,
}: {
  nome: string
  produto: string
  produtoSlug: string
  siteUrl: string
  valorCashback?: number
}) {
  const conteudo = `
    ${hero({
      eyebrow: 'Queremos saber',
      titulo: `${nome}, tá gostando do seu Sixxis?`,
      subtitulo: `Sua opinião ajuda outros clientes e te dá cashback`,
    })}
    <div class="email-content-pad" style="padding:40px 32px;">
      ${paragrafo(`Já faz alguns dias que o <strong>${produto}</strong> chegou aí. Conta pra gente: tá atendendo suas expectativas? Sua avaliação honesta vale R$ ${valorCashback} em cashback na próxima compra.`)}

      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
        ${svg('star', BRAND.corPrincipal, 28)}
        <p style="font-size:14px;color:${BRAND.corEscura};font-weight:700;margin:10px 0 4px;font-family:${FONT};">Avaliar em 30 segundos</p>
        <p style="font-size:12px;color:#6b7280;margin-bottom:16px;font-family:${FONT};">Você ganha R$ ${valorCashback} em cashback ao publicar</p>
        ${emailBotao({ texto: 'Avaliar produto', href: `${siteUrl}/produtos/${produtoSlug}#avaliacoes` })}
      </div>

      ${paragrafo(`Se algo não saiu como esperava, responda este email. Nosso time resolve rápido.`)}
    </div>`
  return emailBase({
    assunto: `${nome}, tá gostando do seu Sixxis? Queremos saber`,
    preview: `Sua avaliação honesta vale R$ ${valorCashback} em cashback.`,
    conteudo,
  })
}

// ══════════════════════════════════════════════
// 5. ABANDONO DE CARRINHO (1h)
// ══════════════════════════════════════════════
export function templateAbandonoCarrinho({
  nome, produto, imagemProduto, preco, carrinhoUrl, cupom = 'SIXXIS10',
}: {
  nome: string
  produto: string
  imagemProduto?: string
  preco: number
  carrinhoUrl: string
  cupom?: string
}) {
  const conteudo = `
    ${hero({
      eyebrow: 'Seu carrinho',
      titulo: `${nome}, esqueceu algo?`,
      subtitulo: `Guardamos seu ${produto} por algumas horas`,
    })}
    <div class="email-content-pad" style="padding:40px 32px;">
      ${paragrafo(`Seu carrinho te espera. Para facilitar, liberamos um cupom exclusivo para você finalizar hoje.`)}

      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:20px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td width="96" style="vertical-align:top;">
              ${imagemProduto ? `<img src="${imagemProduto}" width="88" height="88" alt="" style="border-radius:12px;background:#ffffff;object-fit:contain;"/>` : `<div style="width:88px;height:88px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;"></div>`}
            </td>
            <td style="padding-left:16px;font-family:${FONT};">
              <p style="font-size:15px;color:${BRAND.corEscura};font-weight:800;margin:0 0 6px;">${produto}</p>
              <p style="font-size:18px;color:${BRAND.corPrincipal};font-weight:900;margin:0 0 4px;">${fmtValor(preco)}</p>
              <p style="font-size:11px;color:#6b7280;margin:0;">Use o cupom <strong style="color:${BRAND.corEscura};">${cupom}</strong> e ganhe 10% OFF</p>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        ${emailBotao({ texto: 'Voltar ao carrinho', href: carrinhoUrl })}
      </div>
      ${paragrafo(`Estoque limitado. Não deixe para depois.`)}
    </div>`
  return emailBase({
    assunto: `${nome}, esqueceu algo no carrinho? Guardamos para você`,
    preview: `Finalize seu pedido com ${cupom} e ganhe 10% OFF.`,
    conteudo,
  })
}

// ══════════════════════════════════════════════
// 6. VOLTA AO ESTOQUE
// ══════════════════════════════════════════════
export function templateVoltaEstoque({
  nome, produto, produtoSlug, imagemProduto, preco, siteUrl,
}: {
  nome: string
  produto: string
  produtoSlug: string
  imagemProduto?: string
  preco: number
  siteUrl: string
}) {
  const conteudo = `
    ${hero({
      eyebrow: 'Disponível de novo',
      titulo: `${produto} voltou ao estoque`,
      subtitulo: `${nome}, corre que voa`,
      bg: `linear-gradient(135deg, ${BRAND.corPrincipal}, ${BRAND.corEscura})`,
    })}
    <div class="email-content-pad" style="padding:40px 32px;">
      ${paragrafo(`Você pediu para avisarmos quando este produto voltasse — ele está disponível por tempo limitado.`)}

      <div style="background:#ffffff;border:2px solid ${BRAND.corPrincipal};border-radius:16px;padding:20px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td width="120" style="vertical-align:top;">
              ${imagemProduto ? `<img src="${imagemProduto}" width="110" height="110" alt="" style="border-radius:12px;object-fit:contain;"/>` : `<div style="width:110px;height:110px;background:#f8fafc;border-radius:12px;"></div>`}
            </td>
            <td style="padding-left:16px;font-family:${FONT};">
              <p style="font-size:16px;color:${BRAND.corEscura};font-weight:900;margin:0 0 8px;">${produto}</p>
              <p style="font-size:22px;color:${BRAND.corPrincipal};font-weight:900;margin:0 0 10px;">${fmtValor(preco)}</p>
              <p style="font-size:11px;color:#6b7280;margin:0;">Estoque limitado</p>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;">
        ${emailBotao({ texto: 'Garantir o meu agora', href: `${siteUrl}/produtos/${produtoSlug}` })}
      </div>
    </div>`
  return emailBase({
    assunto: `${produto} disponível de novo — corre que voa`,
    preview: `Você foi avisado. Garanta o seu antes que esgote de novo.`,
    conteudo,
  })
}

// ══════════════════════════════════════════════
// 7. CUPOM ESPECIAL
// ══════════════════════════════════════════════
export function templateCupomEspecial({
  nome, codigoCupom, percentualDesconto, validade, siteUrl, descricao,
}: {
  nome: string
  codigoCupom: string
  percentualDesconto: number
  validade: string
  siteUrl: string
  descricao?: string
}) {
  const conteudo = `
    ${hero({
      eyebrow: 'Cupom exclusivo',
      titulo: `${nome}, este é só para você`,
      subtitulo: `Válido até ${validade}`,
      bg: `linear-gradient(135deg, ${BRAND.corEscura}, ${BRAND.corPrincipal})`,
    })}
    <div class="email-content-pad" style="padding:40px 32px;">
      ${paragrafo(descricao || `Um cupom especial saiu do nosso sistema direto para você. Use onde quiser da loja.`)}

      <div style="background:${BRAND.corEscura};border:2px dashed ${BRAND.corPrincipal};border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;">
        ${svg('tag', BRAND.corPrincipal, 28)}
        <p style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:10px 0 6px;font-family:${FONT};">Código</p>
        <p style="color:${BRAND.corPrincipal};font-size:28px;font-weight:900;letter-spacing:0.12em;margin:0 0 6px;font-family:${FONT};">${codigoCupom}</p>
        <p style="color:#ffffff;font-size:15px;margin:0;font-family:${FONT};"><strong>${percentualDesconto}% OFF</strong></p>
      </div>

      <div style="text-align:center;margin-bottom:20px;">
        ${emailBotao({ texto: 'Usar cupom agora', href: `${siteUrl}/produtos` })}
      </div>
      <p style="font-size:11px;color:#9ca3af;text-align:center;font-family:${FONT};">Válido até ${validade}. Não cumulativo com outros cupons.</p>
    </div>`
  return emailBase({
    assunto: `${nome}, seu cupom exclusivo de ${percentualDesconto}% — válido até ${validade}`,
    preview: `Use ${codigoCupom} e ganhe ${percentualDesconto}% OFF.`,
    conteudo,
  })
}

// ══════════════════════════════════════════════
// 8. SOLICITAÇÃO DE AVALIAÇÃO (7 dias)
// ══════════════════════════════════════════════
export function templateSolicitacaoAvaliacao({
  nome, produto, produtoSlug, siteUrl, valorCashback = 10,
}: {
  nome: string
  produto: string
  produtoSlug: string
  siteUrl: string
  valorCashback?: number
}) {
  const conteudo = `
    ${hero({
      eyebrow: 'Sua opinião vale dinheiro',
      titulo: `Sua opinião vale R$ ${valorCashback} em cashback`,
      subtitulo: `${nome}, conta como foi sua experiência`,
    })}
    <div class="email-content-pad" style="padding:40px 32px;">
      ${paragrafo(`Você recebeu seu <strong>${produto}</strong> semana passada. Uma avaliação honesta ajuda novos clientes a decidirem, e te rende crédito de volta para usar aqui.`)}

      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;margin-bottom:10px;">${svg('star', '#f59e0b', 24)} ${svg('star', '#f59e0b', 24)} ${svg('star', '#f59e0b', 24)} ${svg('star', '#f59e0b', 24)} ${svg('star', '#f59e0b', 24)}</div>
        <p style="font-size:13px;color:${BRAND.corEscura};font-weight:700;margin:0 0 4px;font-family:${FONT};">Leva menos de 30 segundos</p>
        <p style="font-size:12px;color:#6b7280;margin:0 0 16px;font-family:${FONT};">Texto + nota. Fotos são bônus.</p>
        ${emailBotao({ texto: `Avaliar e ganhar R$ ${valorCashback}`, href: `${siteUrl}/produtos/${produtoSlug}#avaliacoes` })}
      </div>
    </div>`
  return emailBase({
    assunto: `Sua opinião vale R$ ${valorCashback} em cashback`,
    preview: `Avalie seu ${produto} e ganhe R$ ${valorCashback} de cashback.`,
    conteudo,
  })
}

// ══════════════════════════════════════════════
// 9. UPGRADE DE NÍVEL
// ══════════════════════════════════════════════
const NIVEL_CORES: Record<string, { grad: string; cashback: string; icone: string }> = {
  Cristal:   { grad: 'linear-gradient(135deg,#9ca3af,#4b5563)', cashback: '2%', icone: 'sparkles' },
  Topázio:   { grad: 'linear-gradient(135deg,#f59e0b,#d97706)', cashback: '3%', icone: 'star' },
  Safira:    { grad: 'linear-gradient(135deg,#2563eb,#1e40af)', cashback: '4%', icone: 'sparkles' },
  Diamante:  { grad: 'linear-gradient(135deg,#06b6d4,#0891b2)', cashback: '5%', icone: 'sparkles' },
  Esmeralda: { grad: 'linear-gradient(135deg,#10b981,#047857)', cashback: '6%', icone: 'crown' },
}

export function templateUpgradeNivel({
  nome, nivelAnterior, nivelNovo, totalGasto, siteUrl,
}: {
  nome: string
  nivelAnterior: string
  nivelNovo: string
  totalGasto: number
  siteUrl: string
}) {
  const cfg = NIVEL_CORES[nivelNovo] ?? NIVEL_CORES.Cristal
  const conteudo = `
    <div class="email-hero-pad" style="background:${cfg.grad};padding:48px 40px;text-align:center;">
      <div style="background:rgba(255,255,255,0.15);width:96px;height:96px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        ${svg(cfg.icone, '#ffffff', 48)}
      </div>
      <p style="color:rgba(255,255,255,0.75);font-size:12px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;font-family:${FONT};">Parabéns, ${nome}</p>
      <h1 style="color:#ffffff;font-size:30px;font-weight:900;line-height:1.2;margin:0;font-family:${FONT};">Você virou ${nivelNovo} na Sixxis Club</h1>
    </div>
    <div class="email-content-pad" style="padding:40px 32px;">
      ${paragrafo(`Com <strong>${fmtValor(totalGasto)}</strong> em compras acumuladas, você passou de ${nivelAnterior} para <strong>${nivelNovo}</strong>. Seu cashback automático também subiu.`)}

      <div style="background:${cfg.grad};border-radius:20px;padding:28px;text-align:center;margin-bottom:24px;">
        <p style="color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;font-family:${FONT};">Seu novo cashback</p>
        <p style="color:#ffffff;font-size:48px;font-weight:900;line-height:1;margin:0;font-family:${FONT};">${cfg.cashback}</p>
        <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;font-family:${FONT};">em todas as suas compras</p>
      </div>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:20px;margin-bottom:24px;">
        <p style="font-size:11px;font-weight:800;color:${BRAND.corPrincipal};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;font-family:${FONT};">Novos benefícios</p>
        <p style="font-size:13px;color:${BRAND.corTexto};margin:0 0 8px;font-family:${FONT};">${svg('check', BRAND.corPrincipal, 16)} &nbsp; Cashback de ${cfg.cashback} em toda compra</p>
        <p style="font-size:13px;color:${BRAND.corTexto};margin:0 0 8px;font-family:${FONT};">${svg('check', BRAND.corPrincipal, 16)} &nbsp; Acesso prioritário a lançamentos</p>
        <p style="font-size:13px;color:${BRAND.corTexto};margin:0;font-family:${FONT};">${svg('check', BRAND.corPrincipal, 16)} &nbsp; Ofertas exclusivas de nível</p>
      </div>

      <div style="text-align:center;">
        ${emailBotao({ texto: 'Ver meus benefícios', href: `${siteUrl}/minha-conta/cashback` })}
      </div>
    </div>`
  return emailBase({
    assunto: `Parabéns ${nome}, você virou ${nivelNovo} na Sixxis Club`,
    preview: `Novo nível: ${nivelNovo}. Cashback subiu para ${cfg.cashback}.`,
    conteudo,
  })
}
