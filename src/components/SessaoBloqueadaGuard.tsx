'use client'

import { useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'

// Derruba a sessão de um cliente que foi bloqueado DEPOIS de logar. O callback
// jwt revalida `bloqueado` no banco (throttle 60s) e o expõe em
// session.user.bloqueado; aqui forçamos o logout e mandamos pro login com
// mensagem clara. Os gates de API (403) são a barreira autoritativa — este guard
// é a camada de UX. Renderiza null.
export default function SessaoBloqueadaGuard() {
  const { data: session, status } = useSession()
  const agindo = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.bloqueado) return
    if (agindo.current) return
    agindo.current = true
    signOut({ redirect: false }).finally(() => {
      window.location.href = '/login?bloqueado=1'
    })
  }, [status, session?.user?.bloqueado])

  return null
}
