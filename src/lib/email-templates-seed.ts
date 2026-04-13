// Templates padrão de email — executar via: npx tsx src/lib/email-templates-seed.ts
import { prisma } from './prisma'

const BASE_HEADER = `
  <div style="background:#1a4f4a;padding:32px 40px;text-align:center;">
    <img src="https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/1775754930452-4ixi773.png"
         alt="Sixxis" style="height:48px;object-fit:contain;" />
    <p style="color:#3cbfb3;font-size:13px;margin:8px 0 0;font-weight:600;letter-spacing:.05em;">
      QUALIDADE E INOVAÇÃO
    </p>
  </div>
`

const BASE_FOOTER = `
  <div style="background:#111827;padding:24px 40px;text-align:center;">
    <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;">
      © 2025 Sixxis — CNPJ: 54.978.947/0001-09
    </p>
    <p style="color:#6b7280;font-size:11px;margin:0;">
      R. Anhanguera, 1711 - Icaray, Araçatuba - SP | (18) 99747-4701
    </p>
    <div style="margin-top:12px;">
      <a href="https://instagram.com/sixxisoficial" style="color:#3cbfb3;font-size:12px;text-decoration:none;margin:0 8px;">Instagram</a>
      <a href="https://wa.me/5518997474701" style="color:#3cbfb3;font-size:12px;text-decoration:none;margin:0 8px;">WhatsApp</a>
      <a href="https://sixxis-store-production.up.railway.app" style="color:#3cbfb3;font-size:12px;text-decoration:none;margin:0 8px;">Loja</a>
    </div>
  </div>
`

function wrapTemplate(content: string): string {
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">${BASE_HEADER}${content}${BASE_FOOTER}</div>`
}

export const EMAIL_TEMPLATES = [
  {
    tipo: 'boas_vindas',
    ativo: true,
    assunto: 'Bem-vindo à Sixxis, {{nome}}! 🎉',
    prazo: 0,
    unidadePrazo: 'horas',
    corpo: wrapTemplate(`
<div style="padding:40px;background:#ffffff;">
  <h1 style="color:#0a0a0a;font-size:28px;font-weight:700;margin:0 0 16px;">
    Olá, {{nome}}! Bem-vindo à Sixxis 🎉
  </h1>
  <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 24px;">
    Sua conta foi criada com sucesso. Agora você tem acesso a produtos originais Sixxis com entrega rápida para todo o Brasil.
  </p>
  <div style="background:#e8f8f7;border-left:4px solid #3cbfb3;padding:20px;border-radius:8px;margin:0 0 32px;">
    <p style="color:#1a4f4a;font-weight:700;margin:0 0 8px;">Benefícios da sua conta:</p>
    <ul style="color:#4b5563;margin:0;padding-left:20px;line-height:2;">
      <li>Acompanhe seus pedidos em tempo real</li>
      <li>Acumule pontos a cada compra</li>
      <li>Receba ofertas exclusivas</li>
      <li>Suporte prioritário</li>
    </ul>
  </div>
  <div style="text-align:center;">
    <a href="{{site_url}}/produtos" style="display:inline-block;background:#3cbfb3;color:white;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none;">
      Ver Produtos →
    </a>
  </div>
</div>`),
  },
  {
    tipo: 'confirmacao_pedido',
    ativo: true,
    assunto: 'Pedido #{{pedido_id}} confirmado! ✅',
    prazo: 0,
    unidadePrazo: 'horas',
    corpo: wrapTemplate(`
<div style="padding:40px;background:#ffffff;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="width:72px;height:72px;background:#e8f8f7;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
      <span style="font-size:32px;">✅</span>
    </div>
    <h1 style="color:#0a0a0a;font-size:26px;font-weight:700;margin:0 0 8px;">Pedido confirmado!</h1>
    <p style="color:#4b5563;font-size:16px;margin:0;">Obrigado por comprar na Sixxis, {{nome}}!</p>
  </div>
  <div style="background:#f9fafb;border-radius:12px;padding:24px;margin-bottom:24px;">
    <p style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin:0 0 16px;">Resumo do Pedido</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="color:#4b5563;font-size:14px;padding:4px 0;">Número do pedido</td><td style="color:#0a0a0a;font-size:14px;font-weight:700;text-align:right;">#{{pedido_id}}</td></tr>
      <tr><td style="color:#4b5563;font-size:14px;padding:4px 0;">Total</td><td style="color:#3cbfb3;font-size:18px;font-weight:700;text-align:right;">{{total}}</td></tr>
      <tr><td style="color:#4b5563;font-size:14px;padding:4px 0;">Forma de pagamento</td><td style="color:#0a0a0a;font-size:14px;text-align:right;">{{forma_pagamento}}</td></tr>
      <tr><td style="color:#4b5563;font-size:14px;padding:4px 0;">Status</td><td style="text-align:right;"><span style="background:#e8f8f7;color:#1a4f4a;font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px;">{{status}}</span></td></tr>
    </table>
  </div>
  {{ITENS_PEDIDO}}
  <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:32px;">
    <p style="color:#6b7280;font-size:13px;font-weight:600;margin:0 0 8px;">Endereço de entrega</p>
    <p style="color:#0a0a0a;font-size:14px;margin:0;line-height:1.6;">{{endereco}}</p>
  </div>
  <div style="text-align:center;">
    <a href="{{site_url}}/pedidos/{{pedido_id}}" style="display:inline-block;background:#3cbfb3;color:white;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none;">
      Acompanhar Pedido →
    </a>
  </div>
  <p style="color:#6b7280;font-size:13px;text-align:center;margin-top:24px;">
    Em breve você receberá o código de rastreio.
  </p>
</div>`),
  },
  {
    tipo: 'pedido_enviado',
    ativo: true,
    assunto: 'Seu pedido #{{pedido_id}} saiu para entrega! 🚚',
    prazo: 0,
    unidadePrazo: 'horas',
    corpo: wrapTemplate(`
<div style="padding:40px;background:#ffffff;">
  <div style="text-align:center;margin-bottom:32px;">
    <span style="font-size:48px;">🚚</span>
    <h1 style="color:#0a0a0a;font-size:26px;font-weight:700;margin:16px 0 8px;">
      Seu pedido está a caminho!
    </h1>
    <p style="color:#4b5563;font-size:16px;margin:0;">{{nome}}, seu pedido foi enviado.</p>
  </div>
  <div style="background:#e8f8f7;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
    <p style="color:#1a4f4a;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin:0 0 12px;">
      Código de Rastreio
    </p>
    <p style="color:#0f2e2b;font-size:28px;font-weight:700;letter-spacing:.1em;margin:0 0 16px;font-family:monospace;">
      {{codigo_rastreio}}
    </p>
    <a href="{{link_rastreio}}" style="display:inline-block;background:#3cbfb3;color:white;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">
      Rastrear Pedido →
    </a>
  </div>
  <p style="color:#4b5563;font-size:14px;text-align:center;line-height:1.7;">
    Previsão de entrega: <strong>{{previsao_entrega}}</strong>
  </p>
</div>`),
  },
  {
    tipo: 'followup_entrega',
    ativo: true,
    assunto: 'Seu pedido chegou, {{nome}}? Como foi a experiência? ⭐',
    prazo: 15,
    unidadePrazo: 'dias',
    corpo: wrapTemplate(`
<div style="padding:40px;background:#ffffff;">
  <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 16px;">
    Olá, {{nome}}! Tudo certo com seu pedido? 😊
  </h1>
  <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 24px;">
    Já faz alguns dias desde que você recebeu seu pedido #{{pedido_id}}. Gostaríamos de saber se tudo chegou perfeitamente e se você está satisfeito!
  </p>
  <div style="background:#fef3c7;border-radius:12px;padding:24px;margin-bottom:28px;text-align:center;">
    <p style="color:#92400e;font-weight:700;font-size:16px;margin:0 0 16px;">
      Sua opinião é muito importante para nós ⭐
    </p>
    <a href="{{site_url}}/produtos/{{produto_slug}}#avaliacoes"
       style="display:inline-block;background:#f59e0b;color:white;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
      Avaliar Produto →
    </a>
  </div>
  <div style="border-top:1px solid #e5e7eb;padding-top:24px;">
    <p style="color:#4b5563;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Precisa de assistência técnica ou tem alguma dúvida?
    </p>
    <a href="https://wa.me/5518997474701" style="display:inline-block;background:#25D366;color:white;font-size:13px;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;margin-right:8px;">
      Vendas (18) 99747-4701
    </a>
    <a href="https://wa.me/5511934102621" style="display:inline-block;background:#0088cc;color:white;font-size:13px;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;">
      Assistência Técnica
    </a>
  </div>
</div>`),
  },
  {
    tipo: 'abandono_carrinho',
    ativo: true,
    assunto: '{{nome}}, você esqueceu algo no carrinho! 🛒',
    prazo: 2,
    unidadePrazo: 'horas',
    corpo: wrapTemplate(`
<div style="padding:40px;background:#ffffff;">
  <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 8px;">
    Psst... você esqueceu algo! 🛒
  </h1>
  <p style="color:#4b5563;font-size:16px;line-height:1.7;margin:0 0 28px;">
    {{nome}}, você deixou alguns itens no seu carrinho. Eles ainda estão te esperando!
  </p>
  {{ITENS_CARRINHO}}
  <div style="background:#e8f8f7;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
    <p style="color:#1a4f4a;font-size:14px;font-weight:600;margin:0 0 12px;">
      ⚡ Estoque limitado — garanta o seu agora!
    </p>
    <a href="{{site_url}}/carrinho" style="display:inline-block;background:#3cbfb3;color:white;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none;">
      Finalizar Compra →
    </a>
  </div>
  <p style="color:#9ca3af;font-size:12px;text-align:center;">
    Precisa de ajuda? <a href="https://wa.me/5518997474701" style="color:#3cbfb3;">Fale conosco</a>
  </p>
</div>`),
  },
  {
    tipo: 'volta_estoque',
    ativo: true,
    assunto: '{{produto_nome}} está disponível novamente! ⚡',
    prazo: 0,
    unidadePrazo: 'horas',
    corpo: wrapTemplate(`
<div style="padding:40px;background:#ffffff;">
  <div style="text-align:center;margin-bottom:32px;">
    <span style="font-size:48px;">⚡</span>
    <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:16px 0 8px;">
      Voltou ao estoque!
    </h1>
    <p style="color:#4b5563;font-size:16px;">{{nome}}, você pediu para ser avisado.</p>
  </div>
  {{PRODUTO_CARD}}
  <div style="text-align:center;margin-top:28px;">
    <a href="{{produto_url}}" style="display:inline-block;background:#3cbfb3;color:white;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none;">
      Comprar Agora →
    </a>
    <p style="color:#ef4444;font-size:13px;margin-top:12px;font-weight:600;">
      ⚠️ Estoque limitado — pode esgotar novamente!
    </p>
  </div>
</div>`),
  },
  {
    tipo: 'cupom_especial',
    ativo: true,
    assunto: '{{nome}}, temos um cupom exclusivo para você! 🎁',
    prazo: 0,
    unidadePrazo: 'horas',
    corpo: wrapTemplate(`
<div style="padding:40px;background:#ffffff;">
  <div style="text-align:center;margin-bottom:32px;">
    <span style="font-size:48px;">🎁</span>
    <h1 style="color:#0a0a0a;font-size:26px;font-weight:700;margin:16px 0 8px;">
      Um presente especial para você!
    </h1>
    <p style="color:#4b5563;font-size:16px;">{{nome}}, preparamos um cupom exclusivo.</p>
  </div>
  <div style="background:linear-gradient(135deg,#1a4f4a,#3cbfb3);border-radius:16px;padding:32px;text-align:center;margin-bottom:32px;">
    <p style="color:rgba(255,255,255,0.8);font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;margin:0 0 12px;">Seu cupom de desconto</p>
    <p style="color:white;font-size:36px;font-weight:800;letter-spacing:.15em;margin:0 0 8px;font-family:monospace;">{{cupom_codigo}}</p>
    <p style="color:rgba(255,255,255,0.9);font-size:18px;font-weight:700;margin:0 0 16px;">{{cupom_desconto}} de desconto</p>
    <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;">Válido até {{cupom_validade}}</p>
  </div>
  <div style="text-align:center;">
    <a href="{{site_url}}/produtos" style="display:inline-block;background:#3cbfb3;color:white;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none;">
      Usar Cupom Agora →
    </a>
  </div>
  <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">
    Cupom válido para uma única utilização. Não cumulativo com outras promoções.
  </p>
</div>`),
  },
  {
    tipo: 'solicitacao_avaliacao',
    ativo: true,
    assunto: 'Avalie seu pedido #{{pedido_id}} e ganhe pontos! ⭐',
    prazo: 7,
    unidadePrazo: 'dias',
    corpo: wrapTemplate(`
<div style="padding:40px;background:#ffffff;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="font-size:48px;margin-bottom:16px;">⭐⭐⭐⭐⭐</div>
    <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 8px;">
      Como foi sua experiência?
    </h1>
    <p style="color:#4b5563;font-size:16px;margin:0;">
      {{nome}}, sua opinião sobre o pedido #{{pedido_id}} é muito importante!
    </p>
  </div>
  <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 28px;">
    Avaliações ajudam outros clientes a tomarem melhores decisões de compra e nos ajudam a melhorar nossos produtos e serviços.
  </p>
  <div style="background:#f9fafb;border-radius:12px;padding:24px;margin-bottom:28px;text-align:center;">
    <p style="color:#0a0a0a;font-weight:700;margin:0 0 16px;">Avalie agora e receba benefícios exclusivos!</p>
    <a href="{{site_url}}/pedidos" style="display:inline-block;background:#3cbfb3;color:white;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
      Fazer Avaliação →
    </a>
  </div>
  <p style="color:#9ca3af;font-size:12px;text-align:center;">
    Se já avaliou, obrigado! Você pode ignorar este email.
  </p>
</div>`),
  },
]

async function seed() {
  console.log('Seeding email templates...')
  for (const template of EMAIL_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { tipo: template.tipo },
      update: template,
      create: template,
    })
    console.log(`✓ ${template.tipo}`)
  }
  console.log('Done!')
  await prisma.$disconnect()
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
