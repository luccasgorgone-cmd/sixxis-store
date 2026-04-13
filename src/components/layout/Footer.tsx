import Image from 'next/image'
import Link from 'next/link'
import { Mail, MapPin, Clock, ShieldCheck } from 'lucide-react'
import { prisma } from '@/lib/prisma'

/* ─── Ícones de pagamento ────────────────────────────────────────────────── */
function PagamentoBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* PIX */}
      <span className="inline-flex items-center gap-1.5 bg-[#32BCAD] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md">
        <svg viewBox="0 0 64 64" width="13" height="13" fill="none" aria-hidden="true">
          <path
            d="M44.7 19.3c-2.2 0-4.3.9-5.9 2.4L30 30.4a2.5 2.5 0 0 1-3.5 0l-8.8-8.8a8.3 8.3 0 0 0-5.9-2.4H9l11.8 11.8a9.7 9.7 0 0 0 13.7 0L46.3 19.3h-1.6zM11.8 44.7c2.2 0 4.3-.9 5.9-2.4L26.5 34a2.5 2.5 0 0 1 3.5 0l8.8 8.8c1.6 1.6 3.7 2.4 5.9 2.4h1.6L34.5 33.4a9.7 9.7 0 0 0-13.7 0L9 44.7h2.8z"
            fill="white"
          />
        </svg>
        PIX
      </span>

      {/* Visa */}
      <span className="inline-flex items-center justify-center bg-[#1A1F71] text-white text-[11px] font-black italic px-3 py-1.5 rounded-md tracking-wide w-14">
        VISA
      </span>

      {/* Mastercard */}
      <span className="inline-flex items-center justify-center px-2 py-1.5 rounded-md bg-gray-800 border border-gray-700">
        <svg width="32" height="20" viewBox="0 0 36 22" fill="none" aria-label="Mastercard">
          <circle cx="13" cy="11" r="11" fill="#EB001B" />
          <circle cx="23" cy="11" r="11" fill="#F79E1B" />
          <path d="M18 4.2a11 11 0 0 1 0 13.6A11 11 0 0 1 18 4.2z" fill="#FF5F00" />
        </svg>
      </span>

      {/* Débito */}
      <span className="inline-flex items-center gap-1 bg-[#2196F3] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="2"/>
          <path d="M2 10h20" stroke="white" strokeWidth="2"/>
        </svg>
        Débito
      </span>

      {/* Boleto */}
      <span className="inline-flex items-center gap-1 bg-gray-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3"  y="4" width="2" height="16" fill="white"/>
          <rect x="7"  y="4" width="1" height="16" fill="white"/>
          <rect x="10" y="4" width="3" height="16" fill="white"/>
          <rect x="15" y="4" width="1" height="16" fill="white"/>
          <rect x="18" y="4" width="3" height="16" fill="white"/>
        </svg>
        Boleto
      </span>

      {/* Elo */}
      <span className="inline-flex items-center justify-center bg-[#FFD100] text-black text-[11px] font-black px-2.5 py-1.5 rounded-md tracking-wide w-11">
        elo
      </span>

      {/* Diners */}
      <span className="inline-flex items-center justify-center bg-[#004B87] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md tracking-wide">
        Diners
      </span>
    </div>
  )
}

function ColTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-white font-bold text-sm pb-2 mb-4 border-b border-white/15">
      {children}
    </p>
  )
}

/* ─── Ícone Instagram SVG ────────────────────────────────────────────────── */
function IgIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4.5"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

/* ─── Ícone Facebook SVG ─────────────────────────────────────────────────── */
function FbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
}

/* ─── Ícone WhatsApp SVG oficial ─────────────────────────────────────────── */
function WaIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="white" width={size} height={size} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.827L.057 23.882a.5.5 0 0 0 .606.596l6.187-1.422A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.014-1.374l-.36-.213-3.724.856.896-3.62-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.567 6.567 2.182 12 2.182c5.433 0 9.818 4.385 9.818 9.818 0 5.432-4.385 9.818-9.818 9.818z"/>
    </svg>
  )
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */
export default async function Footer() {
  let logoUrl = '/logo-sixxis.png'
  let whatsappVendas = '5518997474701'
  let whatsappSuporte = '5511934102621'

  try {
    const configs = await prisma.configuracao.findMany({
      where: { chave: { in: ['logo_url', 'social_whatsapp', 'social_whatsapp_suporte'] } },
    })
    const cfg = Object.fromEntries(configs.map((c) => [c.chave, c.valor]))
    if (cfg.logo_url)               logoUrl          = cfg.logo_url
    if (cfg.social_whatsapp)        whatsappVendas   = cfg.social_whatsapp
    if (cfg.social_whatsapp_suporte) whatsappSuporte = cfg.social_whatsapp_suporte
  } catch {}

  return (
    <footer className="text-white/60" style={{ backgroundColor: 'var(--bg-header, #1a4f4a)' }}>

      {/* ── Linha tiffany topo ────────────────────────────────────────────── */}
      <div className="h-1 bg-[#3cbfb3]" />

      {/* ── Bloco principal ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-8 xl:gap-6">

          {/* Col 1 — Marca + Contato */}
          <div className="col-span-2 md:col-span-3 xl:col-span-2">
            <Link href="/" className="inline-block mb-5">
              <Image
                src={logoUrl}
                alt="Sixxis"
                width={165}
                height={56}
                className="object-contain h-12 w-auto"
                unoptimized
              />
            </Link>
            <p className="text-sm text-white/70 leading-relaxed mb-5">
              Qualidade e inovação para o seu conforto e bem-estar.
            </p>

            {/* WhatsApp Vendas */}
            <a
              href={`https://wa.me/${whatsappVendas}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#25D366]/30 mb-2"
              aria-label="Falar no WhatsApp — Vendas"
            >
              <WaIcon size={16} />
              Vendas
            </a>

            {/* WhatsApp Assistência Técnica */}
            <a
              href={`https://wa.me/${whatsappSuporte}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full bg-[#0f2e2b] hover:bg-[#0a1f1d] border border-white/20 hover:border-[#3cbfb3]/50 text-white/70 hover:text-white text-sm font-semibold px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5 mb-3"
              aria-label="WhatsApp Assistência Técnica"
            >
              <WaIcon size={16} />
              Assistência Técnica
            </a>

            {/* Contato */}
            <Link
              href="/contato"
              className="flex items-center justify-center gap-2 w-full border border-white/20 hover:border-[#3cbfb3] text-white/70 hover:text-[#3cbfb3] text-sm font-medium px-4 py-2 rounded-xl transition-all mb-5"
            >
              Entre em Contato
            </Link>

            {/* Email */}
            <div className="text-sm space-y-1">
              <p className="text-white/40 text-xs">Envie um e-mail:</p>
              <a
                href="mailto:brasil.sixxis@gmail.com"
                className="flex items-center gap-1.5 text-white/70 hover:text-[#3cbfb3] transition py-1"
              >
                <Mail size={13} />
                brasil.sixxis@gmail.com
              </a>
            </div>

            {/* Horário */}
            <div className="mt-4 text-xs space-y-0.5">
              <p className="flex items-center gap-1.5 text-white/50 font-medium">
                <Clock size={12} /> Horário de Atendimento SAC:
              </p>
              <p className="text-white/70">Seg–Sex: 8h às 18h&nbsp;&nbsp;|&nbsp;&nbsp;Sáb: 8h às 12h</p>
            </div>
          </div>

          {/* Col 2 — Institucional */}
          <div>
            <ColTitle>Institucional</ColTitle>
            <ul className="space-y-1 text-sm">
              {[
                ['Sobre Nós',               '/sobre'],
                ['Termo de Garantia',       '/garantia'],
                ['Política de Privacidade', '/privacidade'],
                ['FAQ',                     '/faq'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="block py-1 text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Políticas */}
          <div>
            <ColTitle>Políticas</ColTitle>
            <ul className="space-y-1 text-sm">
              {[
                ['Trocas e Devoluções',     '/politica-de-troca'],
                ['Política de Privacidade', '/privacidade'],
                ['Política de Cookies',     '/privacidade'],
                ['Termo de Garantia',       '/garantia'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="block py-1 text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Área do Cliente */}
          <div>
            <ColTitle>Área do Cliente</ColTitle>
            <ul className="space-y-1 text-sm">
              {[
                ['Criar uma Conta', '/cadastro'],
                ['Minha Conta',     '/minha-conta'],
                ['Meus Pedidos',    '/pedidos'],
                ['Rastrear Pedido', '/pedidos'],
                ['FAQ',             '/faq'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="block py-1 text-white/60 hover:text-white hover:translate-x-1 transition-all duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5 — Redes Sociais + Segurança */}
          <div>
            <ColTitle>Redes Sociais</ColTitle>
            <ul className="space-y-3 mb-7">
              <li>
                <a
                  href="https://instagram.com/sixxisoficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                  aria-label="Instagram Sixxis"
                >
                  <span className="w-8 h-8 rounded-full border border-white/15 group-hover:border-[#3cbfb3] flex items-center justify-center text-white/50 group-hover:text-[#3cbfb3] transition-all duration-200 shrink-0">
                    <IgIcon />
                  </span>
                  <span className="text-sm text-white/50 group-hover:text-[#3cbfb3] transition-colors duration-200">
                    @sixxisoficial
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=100090936724453"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                  aria-label="Facebook Sixxis"
                >
                  <span className="w-8 h-8 rounded-full border border-white/15 group-hover:border-[#3cbfb3] flex items-center justify-center text-white/50 group-hover:text-[#3cbfb3] transition-all duration-200 shrink-0">
                    <FbIcon />
                  </span>
                  <span className="text-sm text-white/50 group-hover:text-[#3cbfb3] transition-colors duration-200">
                    Sixxis do Brasil
                  </span>
                </a>
              </li>
            </ul>

            <ColTitle>Certificados</ColTitle>
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-[#0f2e2b]/60 border border-white/10 rounded-xl px-3 py-2.5 hover:border-white/20 transition-colors">
                <ShieldCheck size={14} color="#34A853" strokeWidth={2.5} />
                <span className="text-xs text-white/70 font-medium">Google Safe Browsing</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0f2e2b]/60 border border-white/10 rounded-xl px-3 py-2.5 hover:border-white/20 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="11" fill="#009EE3"/>
                  <ellipse cx="12" cy="12" rx="6" ry="4" fill="white"/>
                  <circle cx="12" cy="12" r="2" fill="#009EE3"/>
                </svg>
                <span className="text-xs text-white/70 font-medium">Mercado Pago</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/60 border border-[#3cbfb3]/30 rounded-xl px-3 py-2.5 hover:border-[#3cbfb3]/50 transition-colors">
                <ShieldCheck size={14} color="#3cbfb3" strokeWidth={2.5} />
                <span className="text-xs text-[#3cbfb3] font-medium">Loja Verificada</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Formas de pagamento ───────────────────────────────────────────── */}
      <div className="border-t border-white/10" style={{ backgroundColor: '#0f2e2b' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center gap-4">
          <p className="text-xs text-white/50 font-medium shrink-0">Formas de Pagamento:</p>
          <PagamentoBadges />
          <p className="text-xs text-white/40 ml-auto hidden lg:block">
            Parcele em até <span className="text-white/60 font-semibold">6x sem juros</span>
          </p>
        </div>
      </div>

      {/* ── Rodapé legal ─────────────────────────────────────────────────── */}
      <div className="border-t border-white/10" style={{ backgroundColor: '#0f2e2b' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="text-xs text-white/40 space-y-0.5">
            <p>© {new Date().getFullYear()} Sixxis — SIXXIS IMPORTAÇÃO, EXPORTAÇÃO E COMÉRCIO LTDA</p>
            <p>CNPJ: 54.978.947/0001-09&nbsp;&nbsp;|&nbsp;&nbsp;IE: 117.633.347.114</p>
            <p className="flex items-center gap-1">
              <MapPin size={11} className="shrink-0" />
              R. Anhanguera, 1711 - Icaray, Araçatuba - SP, 16020-355
            </p>
          </div>
          <p className="text-xs text-white/30 shrink-0">Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
