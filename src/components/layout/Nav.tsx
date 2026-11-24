'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { ShoppingCart, User } from 'lucide-react'
import { useTotalItens } from '@/hooks/useCarrinho'

export default function Nav() {
  const { data: session } = useSession()
  const totalItens = useTotalItens()

  return (
    <nav className="flex items-center gap-6 text-sm font-medium">
      <Link href="/produtos?categoria=climatizadores" className="hover:text-sx-accent-text transition">Climatizadores</Link>
      <Link href="/produtos?categoria=aspiradores" className="hover:text-sx-accent-text transition">Aspiradores</Link>
      <Link href="/produtos?categoria=spinning" className="hover:text-sx-accent-text transition">Spinning</Link>
<Link href="/sobre" className="hover:text-sx-accent-text transition">Sobre</Link>
      <Link href="/contato" className="hover:text-sx-accent-text transition">Contato</Link>
      <Link href="/faq" className="hover:text-sx-accent-text transition">FAQ</Link>

      <Link href="/carrinho" className="relative hover:text-sx-accent-text transition" aria-label="Carrinho">
        <ShoppingCart size={20} />
        {totalItens > 0 && (
          <span className="absolute -top-2 -right-2 bg-sx-accent text-sx-ink text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {totalItens}
          </span>
        )}
      </Link>

      {session ? (
        <div className="flex items-center gap-3">
          <Link href="/minha-conta" className="hover:text-sx-accent-text transition">
            <User size={20} />
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="text-gray-500 hover:text-red-500 transition">
            Sair
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-outline py-2 px-4 text-sm">Entrar</Link>
          <Link href="/cadastro" className="btn-primary py-2 px-4 text-sm">Cadastrar</Link>
        </div>
      )}
    </nav>
  )
}
