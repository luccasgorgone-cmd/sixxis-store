// ═══════════════════════════════════════════════════════
// SIXXIS COMMUNICATION DESIGN SYSTEM
// Versão 1.0 — Todos os emails e WhatsApp da marca
// ═══════════════════════════════════════════════════════

export const BRAND = {
  nome: 'Sixxis',
  slogan: 'Qualidade e Conforto para o Seu Ambiente',
  corPrincipal: '#3cbfb3',
  corEscura: '#0f2e2b',
  corMedia: '#1a4f4a',
  corTexto: '#1a202c',
  corTextoSec: '#6b7280',
  corFundo: '#f8fafc',
  corBorda: '#e5e7eb',
  logoUrl: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/177575493045 2-4ixi773.png',
  site: 'https://sixxis-store-production.up.railway.app',
  whatsapp: '5518997474701',
  email: 'brasil.sixxis@gmail.com',
  instagram: '@sixxis',
  enderecoRodape: 'Araçatuba, SP — Brasil',
  cnpj: '54.978.947/0001-09',
}

// ───────────────────────────────────────────────────────
// BASE TEMPLATE HTML — shell que envolve TODOS os emails
// ───────────────────────────────────────────────────────
export function emailBase({
  assunto,
  conteudo,
  preview = '',
  corHeader = BRAND.corEscura,
}: {
  assunto: string
  conteudo: string
  preview?: string
  corHeader?: string
}): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${assunto}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* RESET */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse !important; mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    td { border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }

    /* TYPOGRAPHY */
    .email-body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }

    /* RESPONSIVE */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-hero-pad { padding: 32px 24px !important; }
      .email-content-pad { padding: 32px 24px !important; }
      .email-btn { display: block !important; width: 100% !important; }
      .email-col-half { display: block !important; width: 100% !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body class="email-body" style="margin:0;padding:0;background-color:#f0f2f5;">

  <!-- PREVIEW TEXT (hidden) -->
  <div style="display:none;font-size:1px;color:#f0f2f5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preview}&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;
  </div>

  <!-- EMAIL WRAPPER -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#f0f2f5;padding:24px 16px;">
    <tr>
      <td align="center">

        <!-- EMAIL CONTAINER -->
        <table class="email-container" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background-color:${corHeader};padding:28px 40px;text-align:center;">
              <div style="margin-bottom:8px;">
                <img src="${BRAND.logoUrl}"
                  alt="${BRAND.nome}" width="120" height="40"
                  style="display:inline-block;object-fit:contain;filter:brightness(0) invert(1);"
                  onerror="this.style.display='none'"/>
              </div>
              <div style="width:40px;height:3px;background-color:#3cbfb3;border-radius:2px;margin:0 auto;"></div>
            </td>
          </tr>

          <!-- CONTEÚDO -->
          <tr>
            <td style="background-color:#ffffff;">
              ${conteudo}
            </td>
          </tr>

          <!-- RODAPÉ -->
          <tr>
            <td style="background-color:#0f2e2b;padding:32px 40px;">

              <!-- Trust badges -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
                <tr>
                  <td width="25%" align="center" class="email-col-half" style="padding:0 8px;">
                    <div style="background:rgba(60,191,179,0.15);border-radius:12px;padding:12px 8px;">
                      <p style="font-size:18px;margin-bottom:4px;">&#128274;</p>
                      <p style="font-size:10px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">SSL Seguro</p>
                    </div>
                  </td>
                  <td width="25%" align="center" class="email-col-half" style="padding:0 8px;">
                    <div style="background:rgba(60,191,179,0.15);border-radius:12px;padding:12px 8px;">
                      <p style="font-size:18px;margin-bottom:4px;">&#128666;</p>
                      <p style="font-size:10px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Frete Grátis</p>
                    </div>
                  </td>
                  <td width="25%" align="center" class="email-col-half" style="padding:0 8px;">
                    <div style="background:rgba(60,191,179,0.15);border-radius:12px;padding:12px 8px;">
                      <p style="font-size:18px;margin-bottom:4px;">&#11088;</p>
                      <p style="font-size:10px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Garantia 12m</p>
                    </div>
                  </td>
                  <td width="25%" align="center" class="email-col-half" style="padding:0 8px;">
                    <div style="background:rgba(60,191,179,0.15);border-radius:12px;padding:12px 8px;">
                      <p style="font-size:18px;margin-bottom:4px;">&#128179;</p>
                      <p style="font-size:10px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">6x Sem Juros</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Separador -->
              <div style="height:1px;background:rgba(255,255,255,0.1);margin-bottom:24px;"></div>

              <!-- Links do rodapé -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
                <tr>
                  <td align="center">
                    <a href="${BRAND.site}" style="color:#3cbfb3;font-size:12px;margin:0 12px;text-decoration:none;">Loja</a>
                    <span style="color:rgba(255,255,255,0.2);font-size:12px;">·</span>
                    <a href="${BRAND.site}/minha-conta/pedidos" style="color:#3cbfb3;font-size:12px;margin:0 12px;text-decoration:none;">Meus Pedidos</a>
                    <span style="color:rgba(255,255,255,0.2);font-size:12px;">·</span>
                    <a href="${BRAND.site}/sobre" style="color:#3cbfb3;font-size:12px;margin:0 12px;text-decoration:none;">Sobre Nós</a>
                    <span style="color:rgba(255,255,255,0.2);font-size:12px;">·</span>
                    <a href="https://wa.me/${BRAND.whatsapp}" style="color:#3cbfb3;font-size:12px;margin:0 12px;text-decoration:none;">WhatsApp</a>
                  </td>
                </tr>
              </table>

              <!-- Info da empresa -->
              <p style="color:rgba(255,255,255,0.4);font-size:11px;text-align:center;line-height:1.6;margin-bottom:12px;">
                ${BRAND.nome} · ${BRAND.enderecoRodape}<br>
                CNPJ ${BRAND.cnpj} · <a href="mailto:${BRAND.email}" style="color:rgba(255,255,255,0.4);">${BRAND.email}</a>
              </p>

              <!-- Unsubscribe -->
              <p style="color:rgba(255,255,255,0.25);font-size:10px;text-align:center;">
                Você está recebendo este e-mail pois se cadastrou na ${BRAND.nome}.
                <a href="${BRAND.site}/minha-conta/preferencias" style="color:rgba(255,255,255,0.35);text-decoration:underline;">Cancelar inscrição</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /EMAIL CONTAINER -->

      </td>
    </tr>
  </table>
</body>
</html>
`
}

// ───────────────────────────────────────────────────────
// BOTÃO CTA PADRÃO
// ───────────────────────────────────────────────────────
export function emailBotao({
  texto,
  href,
  cor = BRAND.corPrincipal,
  corTexto = BRAND.corEscura,
}: {
  texto: string
  href: string
  cor?: string
  corTexto?: string
}) {
  return `
  <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
    <tr>
      <td style="border-radius:12px;background-color:${cor};">
        <!--[if mso]>
        <a href="${href}">
        <![endif]-->
        <a href="${href}"
          style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:800;
                 color:${corTexto};text-decoration:none;border-radius:12px;
                 background-color:${cor};letter-spacing:0.025em;
                 -webkit-text-size-adjust:none;">
          ${texto}
        </a>
        <!--[if mso]>
        </a>
        <![endif]-->
      </td>
    </tr>
  </table>
  `
}

// ───────────────────────────────────────────────────────
// LINHA DIVISÓRIA ELEGANTE
// ───────────────────────────────────────────────────────
export function emailDivisor() {
  return `<div style="height:1px;background:linear-gradient(90deg, transparent, #e5e7eb, transparent);margin:0;"></div>`
}
