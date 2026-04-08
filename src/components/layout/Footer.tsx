import Image from 'next/image'
import Link from 'next/link'
import { Mail, MapPin, Clock, MessageCircle, ShieldCheck, ExternalLink } from 'lucide-react'

/* ─── Ícones de pagamento ────────────────────────────────────────────────── */
function PagamentoBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* PIX */}
      <span className="inline-flex items-center gap-1.5 bg-[#32BCAD] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md">
        <svg viewBox="0 0 64 64" width="14" height="14" fill="none" aria-hidden="true">
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

/* ─── Footer ─────────────────────────────────────────────────────────────── */
export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-gray-400">

      {/* ── Bloco principal ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-8 xl:gap-6">

          {/* Col 1 — Marca + Contato */}
          <div className="col-span-2 md:col-span-3 xl:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo-sixxis.png"
                alt="Sixxis"
                width={110}
                height={36}
                className="object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Qualidade e inovação para o seu conforto.
            </p>

            {/* WhatsApp */}
            <a
              href="https://wa.me/5518997474701"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 hover:border-[#25D366] text-[#25D366] text-sm font-semibold px-4 py-2.5 rounded-xl transition mb-3 w-full"
            >
              <MessageCircle size={16} strokeWidth={2} />
              (18) 99747-4701
            </a>

            {/* Contato */}
            <Link
              href="/contato"
              className="inline-flex items-center justify-center gap-2 w-full border border-gray-700 hover:border-[#3cbfb3] text-gray-400 hover:text-[#3cbfb3] text-sm font-medium px-4 py-2 rounded-xl transition mb-5"
            >
              Entre em Contato
            </Link>

            {/* Email */}
            <div className="text-sm space-y-1">
              <p className="text-gray-600 text-xs">Envie um e-mail:</p>
              <a
                href="mailto:brasil.sixxis@gmail.com"
                className="flex items-center gap-1.5 text-gray-400 hover:text-[#3cbfb3] transition"
              >
                <Mail size={13} />
                brasil.sixxis@gmail.com
              </a>
            </div>

            {/* Horário */}
            <div className="mt-4 text-xs text-gray-600 space-y-0.5">
              <p className="flex items-center gap-1.5 text-gray-500 font-medium">
                <Clock size={12} /> Horário de Atendimento SAC:
              </p>
              <p>Seg–Sex: 8h às 18h&nbsp;&nbsp;|&nbsp;&nbsp;Sáb: 8h às 12h</p>
            </div>
          </div>

          {/* Col 2 — Institucional */}
          <div>
            <p className="text-[#3cbfb3] font-bold text-xs uppercase tracking-widest mb-4">
              Institucional
            </p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['Sobre Nós',             '/sobre'],
                ['Quem Somos',            '/sobre'],
                ['Termo de Garantia',     '/garantia'],
                ['Política de Privacidade', '/privacidade'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-[#3cbfb3] transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Políticas */}
          <div>
            <p className="text-[#3cbfb3] font-bold text-xs uppercase tracking-widest mb-4">
              Políticas
            </p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['Trocas e Devoluções',   '/politica-de-troca'],
                ['Política de Privacidade', '/privacidade'],
                ['Política de Cookies',   '/privacidade'],
                ['Termo de Garantia',     '/garantia'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-[#3cbfb3] transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Área do Cliente */}
          <div>
            <p className="text-[#3cbfb3] font-bold text-xs uppercase tracking-widest mb-4">
              Área do Cliente
            </p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['Criar uma Conta',  '/cadastro'],
                ['Minha Conta',      '/minha-conta'],
                ['Meus Pedidos',     '/pedidos'],
                ['Rastrear Pedido',  '/pedidos'],
                ['FAQ',              '/faq'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-[#3cbfb3] transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5 — Redes Sociais + Segurança */}
          <div>
            <p className="text-[#3cbfb3] font-bold text-xs uppercase tracking-widest mb-4">
              Redes Sociais
            </p>
            <ul className="space-y-3 mb-7">
              <li>
                <a
                  href="https://instagram.com/sixxisoficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <span className="w-8 h-8 rounded-full border border-gray-700 group-hover:border-[#3cbfb3] flex items-center justify-center text-gray-400 group-hover:text-[#3cbfb3] transition shrink-0">
                    <IgIcon />
                  </span>
                  <span className="text-sm text-gray-400 group-hover:text-[#3cbfb3] transition">
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
                >
                  <span className="w-8 h-8 rounded-full border border-gray-700 group-hover:border-[#3cbfb3] flex items-center justify-center text-gray-400 group-hover:text-[#3cbfb3] transition shrink-0">
                    <FbIcon />
                  </span>
                  <span className="text-sm text-gray-400 group-hover:text-[#3cbfb3] transition">
                    Sixxis do Brasil
                  </span>
                </a>
              </li>
            </ul>

            <p className="text-[#3cbfb3] font-bold text-xs uppercase tracking-widest mb-3">
              Certificados
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5">
                <ShieldCheck size={14} color="#34A853" strokeWidth={2.5} />
                <span className="text-xs text-gray-300 font-medium">Google Safe Browsing</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="11" fill="#009EE3"/>
                  <ellipse cx="12" cy="12" rx="6" ry="4" fill="white"/>
                  <circle cx="12" cy="12" r="2" fill="#009EE3"/>
                </svg>
                <span className="text-xs text-gray-300 font-medium">Mercado Pago</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/60 border border-[#3cbfb3]/30 rounded-xl px-3 py-2.5">
                <ShieldCheck size={14} color="#3cbfb3" strokeWidth={2.5} />
                <span className="text-xs text-[#3cbfb3] font-medium">Loja Verificada</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Formas de pagamento ───────────────────────────────────────────── */}
      <div className="border-t border-gray-800 bg-[#111] py-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <p className="text-xs text-gray-500 font-medium shrink-0">Formas de Pagamento:</p>
          <PagamentoBadges />
        </div>
      </div>

      {/* ── Rodapé legal ─────────────────────────────────────────────────── */}
      <div className="border-t-2 border-[#3cbfb3] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>© {new Date().getFullYear()} Sixxis — SIXXIS IMPORTAÇÃO, EXPORTAÇÃO E COMÉRCIO LTDA</p>
            <p>CNPJ: 54.978.947/0001-09&nbsp;&nbsp;|&nbsp;&nbsp;IE: 117.633.347.114</p>
            <p className="flex items-center gap-1">
              <MapPin size={11} className="shrink-0" />
              R. Anhanguera, 1711 - Icaray, Araçatuba - SP, 16020-355
            </p>
          </div>
          <p className="text-xs text-gray-600 shrink-0">Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
