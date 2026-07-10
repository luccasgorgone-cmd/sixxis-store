'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { ADMIN_BASE } from '@/lib/admin-path'

/**
 * Rota de retorno após o login, vinda do `?next=` que o aviso de sessão
 * expirada anexa. Lida de window.location (e não de useSearchParams) para não
 * exigir um limite de Suspense nesta página.
 *
 * Resolvemos contra a origin e comparamos o pathname JÁ normalizado: um
 * `startsWith` sobre a string crua aceitaria `/adm-.../../../checkout`, que o
 * browser resolve para fora do painel. Fora da origin ou fora do painel → home
 * do admin.
 */
function destinoPosLogin(): string {
  if (typeof window === 'undefined') return ADMIN_BASE
  const next = new URLSearchParams(window.location.search).get('next')
  if (!next) return ADMIN_BASE

  try {
    const url = new URL(next, window.location.origin)
    if (url.origin !== window.location.origin) return ADMIN_BASE
    const dentroDoPainel =
      url.pathname === ADMIN_BASE || url.pathname.startsWith(`${ADMIN_BASE}/`)
    return dentroDoPainel ? url.pathname + url.search : ADMIN_BASE
  } catch {
    return ADMIN_BASE
  }
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      })

      if (res.ok) {
        router.push(destinoPosLogin())
        router.refresh()
      } else {
        let msg = 'Senha incorreta. Tente novamente.'
        try {
          const data = await res.json()
          if (data?.error) msg = data.error
        } catch { /* ignora */ }
        setErro(msg)
      }
    } catch {
      setErro('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1f1e]">
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <Image
              src="/logo-sixxis.png"
              alt="Sixxis"
              width={130}
              height={44}
              className="object-contain"
            />
          </div>
          <p className="text-[#3cbfb3]/60 text-sm uppercase tracking-widest font-medium">
            Painel Admin
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#3cbfb3]/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#3cbfb3]" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg leading-tight">Acesso restrito</h1>
              <p className="text-white/40 text-xs">Área exclusiva para administradores</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoFocus
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#3cbfb3] focus:ring-1 focus:ring-[#3cbfb3] transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {erro && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3 text-red-300 text-sm font-medium flex items-start gap-2">
                <span className="mt-0.5">&#9888;</span>
                <span>{erro}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-8">
          Sixxis &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
