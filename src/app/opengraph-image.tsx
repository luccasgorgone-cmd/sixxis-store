import { ImageResponse } from 'next/og'

// Imagem Open Graph padrão da loja (1200×630), gerada dinamicamente. Substitui o
// antigo /og-image.jpg estático que dava 404. Aplicada a todas as rotas que não
// definem a própria opengraph-image.
export const runtime = 'nodejs'
export const alt = 'Sixxis Store — Climatizadores, Aspiradores e Spinning'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
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
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -2, color: '#3cbfb3' }}>
          Sixxis
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, marginTop: 8 }}>
          Climatizadores · Aspiradores · Spinning
        </div>
        <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.7)', marginTop: 24 }}>
          30 anos de qualidade · Garantia real · Frete para todo o Brasil
        </div>
      </div>
    ),
    { ...size },
  )
}
