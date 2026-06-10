'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react'
import TurnstileWidget, { TURNSTILE_ENABLED } from '@/components/security/TurnstileWidget'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [tsToken, setTsToken] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!email.trim()) { setErro('Informe seu e-mail.'); return }
    setEnviando(true)
    try {
      const res = await fetch('/api/auth/esqueci-senha', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), turnstileToken: tsToken }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Não foi possível processar o pedido.')
      }
      setEnviado(true)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

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
          {enviado ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#e8f8f7] flex items-center justify-center mb-5">
                <CheckCircle size={32} className="text-[#3cbfb3]" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Verifique seu e-mail</h1>
              <p className="text-sm text-gray-500 mb-6">
                Se houver uma conta com esse e-mail, enviamos um link para redefinir sua senha.
                O link expira em 1 hora.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 font-bold text-[#3cbfb3] hover:text-[#2a9d8f] text-sm transition"
              >
                <ArrowLeft size={15} /> Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Esqueceu a senha?</h1>
                <p className="text-sm text-gray-500">
                  Digite seu e-mail e enviaremos um link para criar uma nova senha.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-[#3cbfb3] rounded-2xl text-sm outline-none transition bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>

                {erro && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-red-600 font-semibold">{erro}</p>
                  </div>
                )}

                <TurnstileWidget onVerify={setTsToken} className="flex justify-center pt-1" />

                <button
                  type="submit"
                  disabled={enviando || (TURNSTILE_ENABLED && !tsToken)}
                  className="w-full flex items-center justify-center gap-2 font-extrabold text-white py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 text-base mt-2"
                  style={{ backgroundColor: '#3cbfb3', boxShadow: '0 4px 14px rgba(60,191,179,0.35)' }}
                >
                  {enviando ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Enviar link de redefinição <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                <Link href="/login" className="text-[#3cbfb3] font-bold hover:text-[#2a9d8f] transition inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Voltar para o login
                </Link>
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-5">
          <ShieldCheck size={13} className="text-white/50" />
          <p className="text-white/50 text-xs">Seus dados estão protegidos com criptografia SSL</p>
        </div>
      </div>
    </div>
  )
}
