'use client'

import Link from 'next/link'
import Image from 'next/image'
import { X, Wind, Fan, Bike, HelpCircle, Info, Phone, User, UserPlus, Zap, Mail, Clock } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'

interface Props {
  isOpen: boolean
  onClose: () => void
  logoUrl?: string
}

const links = [
  { href: '/produtos?categoria=climatizadores', label: 'Climatizadores', icon: Wind,       destaque: false },
  { href: '/produtos?categoria=aspiradores',    label: 'Aspiradores',    icon: Fan,        destaque: false },
  { href: '/produtos?categoria=spinning',       label: 'Spinning',       icon: Bike,       destaque: false },
  { href: '/ofertas',                           label: 'Ofertas Relâmpago', icon: Zap,      destaque: true  },
  { href: '/sobre',                             label: 'Sobre',           icon: Info,       destaque: false },
  { href: '/contato',                           label: 'Contato',         icon: Phone,      destaque: false },
  { href: '/faq',                               label: 'FAQ',             icon: HelpCircle, destaque: false },
]

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.827L.057 23.882a.5.5 0 0 0 .606.596l6.187-1.422A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.014-1.374l-.36-.213-3.724.856.896-3.62-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.567 6.567 2.182 12 2.182c5.433 0 9.818 4.385 9.818 9.818 0 5.432-4.385 9.818-9.818 9.818z"/>
    </svg>
  )
}

export default function MobileMenu({ isOpen, onClose, logoUrl = '/logo-sixxis.png' }: Props) {
  const { data: session } = useSession()

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — slides from LEFT, dark bg */}
      <div
        className={`fixed top-0 left-0 z-50 h-full flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '85%', maxWidth: '320px', backgroundColor: '#0f2e2b' }}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <Link href="/" onClick={onClose} className="flex items-center">
            <Image
              src={logoUrl}
              alt="Sixxis"
              width={100}
              height={34}
              className="object-contain brightness-0 invert"
              unoptimized
            />
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            aria-label="Fechar menu"
          >
            <X size={22} className="text-white" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto py-3">
          {links.map(({ href, label, icon: Icon, destaque }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-4 py-4 px-6 text-base font-semibold transition-colors ${
                destaque
                  ? 'text-[#3cbfb3]'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={20} className={destaque ? 'text-[#3cbfb3]' : 'text-white/60'} />
              {label}
              {destaque && (
                <span className="ml-auto text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                  HOT
                </span>
              )}
            </Link>
          ))}

          <div className="mx-6 my-2 border-t border-white/10" />

          {/* Auth links */}
          {session ? (
            <>
              <Link
                href="/minha-conta"
                onClick={onClose}
                className="flex items-center gap-4 py-4 px-6 text-base font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors"
              >
                <User size={20} className="text-white/60" />
                Minha Conta
              </Link>
              <button
                onClick={() => { signOut({ callbackUrl: '/' }); onClose() }}
                className="flex items-center gap-4 py-4 px-6 text-base font-semibold text-red-300 hover:text-red-200 hover:bg-white/10 transition-colors w-full text-left"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center gap-4 py-4 px-6 text-base font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors"
              >
                <User size={20} className="text-white/60" />
                Entrar
              </Link>
              <Link
                href="/cadastro"
                onClick={onClose}
                className="flex items-center gap-4 py-4 px-6 text-base font-semibold text-[#3cbfb3] hover:text-[#3cbfb3] hover:bg-white/10 transition-colors"
              >
                <UserPlus size={20} className="text-[#3cbfb3]" />
                Criar Conta
              </Link>
            </>
          )}
        </nav>

        {/* Footer do menu — contato e redes sociais */}
        <div className="px-5 py-5 border-t border-white/10 space-y-3">
          <a
            href="https://wa.me/5518997474701"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full bg-[#25D366] text-white text-sm font-semibold px-4 py-3 rounded-xl transition hover:bg-[#128C7E]"
          >
            <WaIcon />
            (18) 99747-4701 — Vendas
          </a>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Clock size={12} />
            <span>Seg–Sex 8h às 18h&nbsp;&nbsp;|&nbsp;&nbsp;Sáb 8h às 12h</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Mail size={12} />
            <a href="mailto:brasil.sixxis@gmail.com" className="hover:text-white/80 transition">
              brasil.sixxis@gmail.com
            </a>
          </div>

          {/* Redes sociais */}
          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://instagram.com/sixxisoficial"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-white/60 hover:text-[#3cbfb3] transition"
              aria-label="Instagram Sixxis"
            >
              {/* Instagram icon */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4.5"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              @sixxisoficial
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=100090936724453"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-7 h-7 rounded-full border border-white/20 hover:border-[#3cbfb3] text-white/60 hover:text-[#3cbfb3] transition"
              aria-label="Facebook Sixxis"
            >
              {/* Facebook icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
