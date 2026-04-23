import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import FooterAtendimentoBtn from './FooterAtendimentoBtn'

// ── Payment Badge ─────────────────────────────────────────────────────────────
function PaymentBadge({ label, cor, circular = false }: { label: string; cor: string; circular?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center text-white text-[10px] font-bold shrink-0 whitespace-nowrap ${
        circular ? 'rounded-full w-7 h-7' : 'px-2.5 py-1 rounded-lg'
      }`}
      style={{ backgroundColor: cor }}
    >
      {label}
    </span>
  )
}

// ── Column Title ──────────────────────────────────────────────────────────────
function ColTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 pb-2 border-b border-white/15">
      {children}
    </h4>
  )
}

// ── WA SVG inline ─────────────────────────────────────────────────────────────
function WaSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.847L0 24l6.335-1.652A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.368l-.36-.214-3.724.977.993-3.63-.235-.374A9.818 9.818 0 1112 21.818z"/>
    </svg>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
export default async function Footer() {
  let logoUrl        = '/logo-sixxis.png'
  let whatsappVendas = '5518997474701'
  let whatsappSuporte = '5511934102621'

  try {
    const configs = await prisma.configuracao.findMany({
      where: { chave: { in: ['logo_url', 'logo_rodape_url', 'social_whatsapp', 'social_whatsapp_suporte'] } },
    })
    const cfg = Object.fromEntries(configs.map((c) => [c.chave, c.valor]))
    if (cfg.logo_rodape_url)         logoUrl          = cfg.logo_rodape_url
    else if (cfg.logo_url)           logoUrl          = cfg.logo_url
    if (cfg.social_whatsapp)         whatsappVendas   = cfg.social_whatsapp
    if (cfg.social_whatsapp_suporte) whatsappSuporte  = cfg.social_whatsapp_suporte
  } catch {}

  return (
    <footer style={{ backgroundColor: '#0f2e2b' }} className="text-white/60">

      {/* ── Linha tiffany topo ─────────────────────────────────────────────── */}
      <div className="h-1 bg-[#3cbfb3]" />

      {/* ── Bloco principal ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── Coluna esquerda — Logo + Botões ──────────────────────────── */}
          <div className="lg:col-span-1 flex justify-center lg:justify-start">
            <div className="flex flex-col items-center" style={{ width: '260px' }}>

              {/* Logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Sixxis"
                loading="lazy"
                style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement
                  if (!img.src.endsWith('/logo-sixxis.png')) img.src = '/logo-sixxis.png'
                }}
              />

              {/* Slogan */}
              <p className="text-white/65 text-xs text-center leading-relaxed mt-2 mb-5">
                Qualidade e inovação para seu<br />
                conforto e bem estar!
              </p>

              {/* BOTÕES */}
              <div className="flex flex-col gap-2.5 w-full">
                <a
                  href={`https://wa.me/${whatsappVendas}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <WaSVG />
                  Vendas
                </a>
                <a
                  href={`https://wa.me/${whatsappSuporte}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-medium text-sm text-white transition"
                  style={{ border: '1.5px solid rgba(255,255,255,0.30)' }}
                >
                  <WaSVG />
                  Assistência Técnica
                </a>
                <Link
                  href="/contato"
                  className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm text-white/55 hover:text-white/85 hover:border-white/30 transition"
                  style={{ border: '1.5px solid rgba(255,255,255,0.12)' }}
                >
                  Entre em Contato
                </Link>
                <div className="flex items-center justify-center w-full pt-0.5">
                  <FooterAtendimentoBtn />
                </div>
              </div>

            </div>
          </div>

          {/* ── Colunas do meio e direita ─────────────────────────────────── */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6">

            {/* Institucional */}
            <div>
              <ColTitle>Institucional</ColTitle>
              <ul className="space-y-1.5">
                {[
                  { label: 'Sobre Nós',               href: '/sobre'       },
                  { label: 'Termo de Garantia',        href: '/garantia'    },
                  { label: 'Política de Privacidade',  href: '/privacidade' },
                  { label: 'FAQ',                      href: '/faq'         },
                ].map(item => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-white/70 hover:text-white text-sm transition block py-0.5">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Políticas */}
            <div>
              <ColTitle>Políticas</ColTitle>
              <ul className="space-y-1.5">
                {[
                  { label: 'Trocas e Devoluções',     href: '/politica-de-troca' },
                  { label: 'Política de Privacidade',  href: '/privacidade'       },
                  { label: 'Política de Cookies',      href: '/cookies'           },
                  { label: 'Termo de Garantia',        href: '/garantia'          },
                ].map(item => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-white/70 hover:text-white text-sm transition block py-0.5">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Área do Cliente */}
            <div>
              <ColTitle>Área do Cliente</ColTitle>
              <ul className="space-y-1.5">
                {[
                  { label: 'Criar uma Conta', href: '/cadastro'    },
                  { label: 'Minha Conta',     href: '/minha-conta' },
                  { label: 'Meus Pedidos',    href: '/pedidos'     },
                  { label: 'Rastrear Pedido', href: '/pedidos'     },
                  { label: 'FAQ',             href: '/faq'         },
                ].map(item => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-white/70 hover:text-white text-sm transition block py-0.5">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Redes Sociais + Certificados */}
            <div>
              <ColTitle>Redes Sociais</ColTitle>
              <div className="flex gap-3 mb-2">
                {/* Instagram */}
                <a
                  href="https://instagram.com/sixxisoficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ width: '42px', height: '42px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}
                  aria-label="Instagram Sixxis"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/profile.php?id=100090936724453"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ width: '42px', height: '42px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}
                  aria-label="Facebook Sixxis do Brasil"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/5518997474701"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ width: '42px', height: '42px', backgroundColor: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', flexShrink: 0 }}
                  aria-label="WhatsApp Sixxis"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.847L0 24l6.335-1.652A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.368l-.36-.214-3.724.977.993-3.63-.235-.374A9.818 9.818 0 1112 21.818z"/>
                  </svg>
                </a>
              </div>
              <div className="mt-6"><ColTitle>Certificados</ColTitle></div>
              <div className="space-y-2">
                {[
                  { label: 'Google Safe Browsing', cor: '#34a853' },
                  { label: 'Mercado Pago',          cor: '#009ee3' },
                  { label: 'Loja Verificada',        cor: '#3cbfb3' },
                ].map(cert => (
                  <div
                    key={cert.label}
                    className="flex items-center gap-2 bg-white/[0.08] border border-white/15 rounded-xl px-3 py-2"
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cert.cor }} />
                    <span className="text-white/75 text-xs font-medium">{cert.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Formas de pagamento ───────────────────────────────────────────── */}
      <div className="border-t border-white/10" style={{ backgroundColor: '#0f2e2b' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wide shrink-0">
                Formas de Pagamento:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <PaymentBadge label="PIX"        cor="#32bcad" />
                <PaymentBadge label="VISA"       cor="#1a1f71" />
                <PaymentBadge label="MC"         cor="#eb001b" circular />
                <PaymentBadge label="Débito"     cor="#2563eb" />
                <PaymentBadge label="Boleto"     cor="#374151" />
                <PaymentBadge label="elo"        cor="#f59e0b" />
                <PaymentBadge label="Diners"     cor="#4b5563" />
              </div>
            </div>
            <span className="text-white/70 text-xs font-semibold shrink-0">
              Parcele em até <strong className="text-white">6x sem juros</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Copyright ─────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10" style={{ backgroundColor: '#0f2e2b' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <div className="space-y-0.5">
              <p className="text-white/65 text-xs">
                © {new Date().getFullYear()} Sixxis — SIXXIS IMPORTAÇÃO, EXPORTAÇÃO E COMÉRCIO LTDA
              </p>
              <p className="text-white/55 text-xs">
                CNPJ: 54.978.947/0001-09&nbsp;&nbsp;|&nbsp;&nbsp;IE: 117.633.347.114
              </p>
              <p className="text-white/55 text-xs">
                R. Anhanguera, 1711 - Icaray, Araçatuba - SP, 16020-355
              </p>
            </div>
            <p className="text-white/55 text-xs shrink-0">Todos os direitos reservados.</p>
          </div>
        </div>
      </div>

    </footer>
  )
}
