'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AlertCircle, LogIn } from 'lucide-react'
import { ADMIN_BASE } from '@/lib/admin-path'

/**
 * Detecção central de sessão admin expirada.
 *
 * O painel tem ~90 chamadas a /api/admin espalhadas por 35 arquivos, cada uma
 * com seu próprio tratamento de erro (algumas sem nenhum). Um 401 hoje some
 * dentro de um catch genérico: os dados desaparecem da tela sem explicação.
 *
 * Em vez de tocar nas 90 chamadas, envolvemos o window.fetch UMA vez, aqui.
 * O componente é montado só dentro do painel (AdminLayoutClient), então não
 * afeta a loja. Nada é deslogado nem apagado — só avisamos e oferecemos o
 * re-login, preservando a rota atual.
 */
/**
 * True quando um 401 nesta chamada significa "sessão admin expirada".
 *
 * Compara pela URL resolvida, não por substring: `includes('/api/admin')`
 * casaria um host de terceiro ou uma query `?redirect=/api/admin`.
 * `/api/admin/auth` fica de fora — lá o 401 é senha errada, não sessão.
 */
function ehSessaoAdmin(input: Parameters<typeof fetch>[0]): boolean {
  const bruta =
    typeof input === 'string' ? input
    : input instanceof URL ? input.href
    : input instanceof Request ? input.url
    : ''
  if (!bruta) return false

  try {
    const { origin, pathname } = new URL(bruta, window.location.origin)
    if (origin !== window.location.origin) return false
    return pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/auth')
  } catch {
    return false
  }
}

export default function SessaoExpiradaGuard() {
  const [expirada, setExpirada] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchOriginal = window.fetch

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const resposta = await fetchOriginal(...args)

      if (resposta.status === 401 && ehSessaoAdmin(args[0])) {
        setExpirada(true)
      }

      return resposta
    }

    return () => { window.fetch = fetchOriginal }
  }, [])

  if (!expirada) return null

  function irParaLogin() {
    // Preserva a rota atual para voltar depois do login.
    const next = encodeURIComponent(pathname)
    router.push(`${ADMIN_BASE}/login?next=${next}`)
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900">Sua sessão expirou.</h2>
            <p className="text-sm text-gray-500 mt-1">
              Faça login novamente para continuar. Você volta para esta mesma página.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => setExpirada(false)}
            className="px-4 py-2 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Fechar aviso
          </button>
          <button
            onClick={irParaLogin}
            autoFocus
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#3cbfb3] rounded-xl hover:bg-[#2a9d8f] transition"
          >
            <LogIn className="w-4 h-4" /> Fazer login
          </button>
        </div>
      </div>
    </div>
  )
}
