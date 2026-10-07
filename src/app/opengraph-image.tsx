import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

// Imagem Open Graph padrão da loja (1200×630), gerada dinamicamente. É o preview
// que aparece ao compartilhar o link (WhatsApp, redes). Usa a LOGO real da Sixxis
// (public/logo-sixxis.png, versão branca) sobre o verde-escuro da marca, em vez de
// só o texto "Sixxis". Aplicada a todas as rotas que não definem a própria.
export const runtime = 'nodejs'
export const alt = 'Sixxis — Climatizadores, Aspiradores e Spinning'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  // Lê a logo branca do public/ e embute como data URI (sem depender de rede).
  let logoDataUri = ''
  try {
    const logoBytes = readFileSync(join(process.cwd(), 'public', 'logo-sixxis.png'))
    logoDataUri = `data:image/png;base64,${logoBytes.toString('base64')}`
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 55%, #0f2e2b 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {logoDataUri ? (
          <img src={logoDataUri} alt="Sixxis" width={660} height={116} />
        ) : (
          <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -2, color: '#3cbfb3' }}>
            Sixxis
          </div>
        )}
        <div style={{ fontSize: 42, fontWeight: 700, marginTop: 36 }}>
          Climatizadores · Aspiradores · Spinning
        </div>
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.7)', marginTop: 20 }}>
          Qualidade real · Garantia · Frete para todo o Brasil
        </div>
      </div>
    ),
    { ...size },
  )
}
