'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react'

function RedefinirSenhaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)
  const [erro, setErro] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (senha.length < 6) { setErro('A senha deve ter ao menos 6 caracteres.'); return }
    if (senha !== confirma) { setErro('As senhas não coincidem.'); return }
    setSalvando(true)
    try {
      const res = await fetch('/api/auth/redefinir-senha', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, senha }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Não foi possível redefinir a senha.')
      }
      setOk(true)
      setTimeout(() => router.push('/login'), 2200)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Link inválido</h1>
        <p className="text-sm text-gray-500 mb-6">
          Este link de redefinição é inválido ou está incompleto. Solicite um novo.
        </p>
        <Link href="/esqueci-senha" className="inline-flex items-center justify-center gap-2 font-bold text-[#3cbfb3] hover:text-[#2a9d8f] text-sm transition">
          <ArrowLeft size={15} /> Pedir novo link
        </Link>
      </div>
    )
  }

  if (ok) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#e8f8f7] flex items-center justify-center mb-5">
          <CheckCircle size={32} className="text-[#3cbfb3]" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Senha redefinida!</h1>
        <p className="text-sm text-gray-500 mb-6">
          Sua nova senha foi salva. Redirecionando para o login…
        </p>
        <Link href="/login" className="inline-flex items-center justify-center gap-2 font-bold text-[#3cbfb3] hover:text-[#2a9d8f] text-sm transition">
          <ArrowLeft size={15} /> Ir para o login agora
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="text-center mb-7">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Criar nova senha</h1>
        <p className="text-sm text-gray-500">Escolha uma senha com ao menos 6 caracteres.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Nova senha</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={mostrar ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-11 py-3 border-2 border-gray-200 focus:border-[#3cbfb3] rounded-2xl text-sm outline-none transition bg-gray-50 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setMostrar(!mostrar)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Confirmar senha</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={mostrar ? 'text' : 'password'}
              value={confirma}
              onChange={(e) => setConfirma(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-[#3cbfb3] rounded-2xl text-sm outline-none transition bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-xs text-red-600 font-semibold">{erro}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="w-full flex items-center justify-center gap-2 font-extrabold text-white py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 text-base mt-2"
          style={{ backgroundColor: '#3cbfb3', boxShadow: '0 4px 14px rgba(60,191,179,0.35)' }}
        >
          {salvando ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>Salvar nova senha <ArrowRight size={16} /></>
          )}
        </button>
      </form>
    </>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 50%, #0f2e2b 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-sixxis.png" alt="Sixxis" style={{ height: '52px', width: 'auto' }} />
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#3cbfb3]/30 border-t-[#3cbfb3] rounded-full animate-spin" /></div>}>
            <RedefinirSenhaContent />
          </Suspense>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5">
          <ShieldCheck size={13} className="text-white/50" />
          <p className="text-white/50 text-xs">Seus dados estão protegidos com criptografia SSL</p>
        </div>
      </div>
    </div>
  )
}
