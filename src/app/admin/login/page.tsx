'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

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
        router.push('/admin')
      } else {
        setErro('Senha incorreta. Tente novamente.')
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1f1e]">
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-baseline">
            <span className="text-3xl font-black tracking-tight text-white">SIXXIS</span>
            <span className="text-3xl font-black tracking-tight text-[#3cbfb3]">.store</span>
          </div>
          <p className="text-[#3cbfb3]/60 text-sm mt-2 uppercase tracking-widest font-medium">
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
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {erro}
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
          Sixxis Store &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
