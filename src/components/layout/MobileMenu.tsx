'use client'

import Link from 'next/link'
import { X, Wind, Fan, Bike, Wrench, HelpCircle, Info, Phone, User, UserPlus, Tag } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const links = [
  { href: '/produtos?categoria=climatizadores', label: 'Climatizadores', icon: Wind,        destaque: false },
  { href: '/produtos?categoria=aspiradores',    label: 'Aspiradores',    icon: Fan,         destaque: false },
  { href: '/produtos?categoria=spinning',       label: 'Spinning',       icon: Bike,        destaque: false },
  { href: '/pecas',                             label: 'Peças',           icon: Wrench,      destaque: false },
  { href: '/ofertas',                           label: 'Ofertas',         icon: Tag,         destaque: true  },
  { href: '/sobre',                             label: 'Sobre',           icon: Info,        destaque: false },
  { href: '/contato',                           label: 'Contato',         icon: Phone,       destaque: false },
  { href: '/faq',                               label: 'FAQ',             icon: HelpCircle,  destaque: false },
]

export default function MobileMenu({ isOpen, onClose }: Props) {
  const { data: session } = useSession()

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-[#0a0a0a]">SIXXIS</span>
            <span className="text-[#3cbfb3]">.store</span>
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Fechar menu"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {links.map(({ href, label, icon: Icon, destaque }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition group ${
                destaque
                  ? 'text-[#3cbfb3] bg-[#e8f8f7] hover:bg-[#d0f0ed]'
                  : 'text-gray-700 hover:bg-[#e8f8f7] hover:text-[#3cbfb3]'
              }`}
            >
              <Icon size={18} className={destaque ? 'text-[#3cbfb3]' : 'text-[#3cbfb3] group-hover:text-[#2a9d8f]'} />
              {label}
              {destaque && <span className="ml-auto text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">HOT</span>}
            </Link>
          ))}
        </nav>

        {/* Rodapé do menu */}
        <div className="px-4 py-5 border-t space-y-3">
          {session ? (
            <>
              <Link
                href="/minha-conta"
                onClick={onClose}
                className="flex items-center gap-2 w-full btn-outline justify-center"
              >
                <User size={16} />
                Minha Conta
              </Link>
              <button
                onClick={() => { signOut({ callbackUrl: '/' }); onClose() }}
                className="w-full text-sm text-gray-500 hover:text-red-500 transition"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center gap-2 w-full btn-outline justify-center"
              >
                <User size={16} />
                Entrar
              </Link>
              <Link
                href="/cadastro"
                onClick={onClose}
                className="flex items-center gap-2 w-full btn-primary justify-center"
              >
                <UserPlus size={16} />
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
