// ═══════════════════════════════════════════════════════
// SIXXIS COMMUNICATION DESIGN SYSTEM
// Versão 2.0 — SVG Lucide-style, sem emojis, {{ano}} dinâmico
// ═══════════════════════════════════════════════════════

export const BRAND = {
  nome: 'Sixxis',
  slogan: 'Qualidade e Conforto para o Seu Ambiente',
  corPrincipal: '#3cbfb3',
  corEscura:    '#0f2e2b',
  corMedia:     '#1a4f4a',
  corTexto:     '#1f2937',
  corTextoSec:  '#6b7280',
  corFundo:     '#f8fafc',
  corBorda:     '#e5e7eb',
  logoUrl: 'https://pub-543c49f4581a424aa738beacf3a89e96.r2.dev/produtos/177575493045 2-4ixi773.png',
  site: 'https://sixxis-store-production.up.railway.app',
  whatsapp: '5518997474701',
  email: 'brasil.sixxis@gmail.com',
  instagram: '@sixxis',
  enderecoRodape: 'Araçatuba, SP — Brasil',
  cnpj: '54.978.947/0001-09',
}

// ───────────────────────────────────────────────────────
// SVGs Lucide inline (cor controlável)
// ───────────────────────────────────────────────────────
export function svg(name: string, color = '#3cbfb3', size = 20): string {
  const stroke = `stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"`
  const paths: Record<string, string> = {
    shield:        `<rect width="24" height="24" fill="none"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
    truck:         `<rect width="24" height="24" fill="none"/><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>`,
    star:          `<rect width="24" height="24" fill="none"/><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/>`,
    credit:        `<rect width="24" height="24" fill="none"/><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>`,
    check:         `<rect width="24" height="24" fill="none"/><polyline points="20 6 9 17 4 12"/>`,
    package:       `<rect width="24" height="24" fill="none"/><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`,
    tag:           `<rect width="24" height="24" fill="none"/><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>`,
    cart:          `<rect width="24" height="24" fill="none"/><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>`,
    bell:          `<rect width="24" height="24" fill="none"/><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
    gift:          `<rect width="24" height="24" fill="none"/><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>`,
    crown:         `<rect width="24" height="24" fill="none"/><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zM5 20h14"/>`,
    sparkles:      `<rect width="24" height="24" fill="none"/><path d="M12 3l1.9 5.8L20 10.7l-5.8 1.9L12 18.4l-1.9-5.8L4 10.7l5.8-1.9z"/><path d="M19 3v4M17 5h4M19 17v4M17 19h4"/>`,
    clock:         `<rect width="24" height="24" fill="none"/><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
    mapPin:        `<rect width="24" height="24" fill="none"/><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>`,
    heart:         `<rect width="24" height="24" fill="none"/><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`,
    thumbsUp:      `<rect width="24" height="24" fill="none"/><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9A2 2 0 0 0 19.66 9zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>`,
  }
  const body = paths[name] ?? paths.star
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ${stroke} style="display:inline-block;vertical-align:middle;">${body}</svg>`
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
  const ano = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${assunto}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin:0 !important; padding:0 !important; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse: collapse !important; mso-table-lspace:0 !important; mso-table-rspace:0 !important; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    a { text-decoration: none; }
    .email-body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    @media screen and (max-width: 600px) {
      .email-container { width:100% !important; max-width:100% !important; }
      .email-hero-pad  { padding:32px 24px !important; }
      .email-content-pad { padding:32px 24px !important; }
      .email-btn { display:block !important; width:100% !important; }
      .email-col-half { display:block !important; width:100% !important; }
    }
  </style>
</head>
<body class="email-body" style="margin:0;padding:0;background-color:#f0f2f5;">
  <div style="display:none;font-size:1px;color:#f0f2f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preview}
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f0f2f5;padding:24px 16px;">
    <tr><td align="center">
      <table class="email-container" cellpadding="0" cellspacing="0" role="presentation"
        style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:${corHeader};padding:32px 40px;text-align:center;">
            <img src="${BRAND.logoUrl}" alt="${BRAND.nome}" width="120" height="40"
              style="display:inline-block;object-fit:contain;filter:brightness(0) invert(1);" />
            <div style="width:40px;height:3px;background-color:#3cbfb3;border-radius:2px;margin:12px auto 0;"></div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;">
            ${conteudo}
          </td>
        </tr>
        <tr>
          <td style="background-color:#111827;padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
              <tr>
                <td width="33%" align="center" class="email-col-half" style="padding:8px;">
                  <div style="background:rgba(60,191,179,0.12);border-radius:12px;padding:12px 8px;">
                    ${svg('shield', '#3cbfb3', 22)}
                    <p style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-top:6px;">SSL Seguro</p>
                  </div>
                </td>
                <td width="33%" align="center" class="email-col-half" style="padding:8px;">
                  <div style="background:rgba(60,191,179,0.12);border-radius:12px;padding:12px 8px;">
                    ${svg('truck', '#3cbfb3', 22)}
                    <p style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-top:6px;">Envio em 24h</p>
                  </div>
                </td>
                <td width="33%" align="center" class="email-col-half" style="padding:8px;">
                  <div style="background:rgba(60,191,179,0.12);border-radius:12px;padding:12px 8px;">
                    ${svg('star', '#3cbfb3', 22)}
                    <p style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-top:6px;">Garantia 12m</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td width="33%" align="center" class="email-col-half" style="padding:8px;">
                  <div style="background:rgba(60,191,179,0.12);border-radius:12px;padding:12px 8px;">
                    ${svg('credit', '#3cbfb3', 22)}
                    <p style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-top:6px;">6x sem juros</p>
                  </div>
                </td>
                <td width="33%" align="center" class="email-col-half" style="padding:8px;">
                  <div style="background:rgba(60,191,179,0.12);border-radius:12px;padding:12px 8px;">
                    ${svg('heart', '#3cbfb3', 22)}
                    <p style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-top:6px;">Cashback até 6%</p>
                  </div>
                </td>
                <td width="33%" align="center" class="email-col-half" style="padding:8px;">
                  <div style="background:rgba(60,191,179,0.12);border-radius:12px;padding:12px 8px;">
                    ${svg('mapPin', '#3cbfb3', 22)}
                    <p style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-top:6px;">Brasil inteiro</p>
                  </div>
                </td>
              </tr>
            </table>
            <div style="height:1px;background:rgba(255,255,255,0.08);margin-bottom:20px;"></div>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px;">
              <tr><td align="center">
                <a href="${BRAND.site}" style="color:#3cbfb3;font-size:12px;margin:0 10px;">Loja</a>
                <span style="color:rgba(255,255,255,0.2);font-size:12px;">·</span>
                <a href="${BRAND.site}/minha-conta/pedidos" style="color:#3cbfb3;font-size:12px;margin:0 10px;">Meus pedidos</a>
                <span style="color:rgba(255,255,255,0.2);font-size:12px;">·</span>
                <a href="https://wa.me/${BRAND.whatsapp}" style="color:#3cbfb3;font-size:12px;margin:0 10px;">WhatsApp</a>
                <span style="color:rgba(255,255,255,0.2);font-size:12px;">·</span>
                <a href="https://instagram.com/sixxis" style="color:#3cbfb3;font-size:12px;margin:0 10px;">Instagram</a>
              </td></tr>
            </table>
            <p style="color:#9ca3af;font-size:11px;text-align:center;line-height:1.6;margin-bottom:10px;">
              &copy; ${ano} ${BRAND.nome} &middot; ${BRAND.enderecoRodape}<br/>
              CNPJ ${BRAND.cnpj} &middot; <a href="mailto:${BRAND.email}" style="color:#9ca3af;">${BRAND.email}</a>
            </p>
            <p style="color:rgba(255,255,255,0.25);font-size:10px;text-align:center;">
              Você recebe este e-mail pois se cadastrou na ${BRAND.nome}.
              <a href="${BRAND.site}/minha-conta/preferencias" style="color:rgba(255,255,255,0.5);text-decoration:underline;">Cancelar inscrição</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ───────────────────────────────────────────────────────
// BOTÃO CTA PADRÃO (width 100%, bg tiffany, bold)
// ───────────────────────────────────────────────────────
export function emailBotao({
  texto,
  href,
  cor      = BRAND.corPrincipal,
  corTexto = '#ffffff',
}: {
  texto: string
  href: string
  cor?: string
  corTexto?: string
}) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
    <tr>
      <td align="center" style="border-radius:12px;background-color:${cor};">
        <a href="${href}" class="email-btn"
          style="display:block;padding:16px 32px;font-size:15px;font-weight:800;
                 color:${corTexto};text-decoration:none;border-radius:12px;
                 background-color:${cor};letter-spacing:0.02em;text-align:center;">
          ${texto}
        </a>
      </td>
    </tr>
  </table>`
}

// ───────────────────────────────────────────────────────
// LINHA DIVISÓRIA
// ───────────────────────────────────────────────────────
export function emailDivisor() {
  return `<div style="height:1px;background:linear-gradient(90deg, transparent, #e5e7eb, transparent);margin:0;"></div>`
}
