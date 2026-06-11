'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { ADMIN_BASE, ADMIN_INTERNAL } from '@/lib/admin-path'

// Derruba a sessão de um cliente (da LOJA) que foi bloqueado DEPOIS de logar. O
// callback jwt revalida `bloqueado` no banco (throttle 60s) e o expõe em
// session.user.bloqueado; aqui forçamos o logout e mandamos pro login.
//
// NÃO roda no admin (/painel...): a auth do admin é separada (cookie admin_token),
// e uma sessão NextAuth de cliente bloqueado no mesmo navegador NÃO deve derrubar
// o admin do painel. Os gates de API (403) são a barreira autoritativa; este
// guard é só UX da loja. Renderiza null.
export default function SessaoBloqueadaGuard() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const agindo = useRef(false)

  useEffect(() => {
    // Fora do admin (público OU interno, caso o path tenha sido rotacionado).
    const noAdmin =
      pathname?.startsWith(ADMIN_BASE) || pathname?.startsWith(ADMIN_INTERNAL)
    if (noAdmin) return
    if (status !== 'authenticated' || !session?.user?.bloqueado) return
    if (agindo.current) return
    agindo.current = true
    // Aguarda o signOut LIMPAR a sessão (cookie) antes de redirecionar — senão
    // /api/auth/session ainda devolvia bloqueado:true após o redirect.
    ;(async () => {
      try {
        await signOut({ redirect: false })
      } catch {
        /* segue pro redirect mesmo se o signOut falhar */
      }
      window.location.href = '/login?bloqueado=1'
    })()
  }, [status, session?.user?.bloqueado, pathname])

  return null
}
