'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, User, Mail, Lock, Phone, CreditCard, ArrowRight, ShieldCheck } from 'lucide-react'

const cadastroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  telefone: z.string().min(10, 'Telefone inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  confirmarSenha: z.string(),
}).refine((d) => d.senha === d.confirmarSenha, {
  message: 'Senhas não coincidem',
  path: ['confirmarSenha'],
})

type CadastroForm = z.infer<typeof cadastroSchema>

export default function CadastroPage() {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroForm>({ resolver: zodResolver(cadastroSchema) })

  async function onSubmit(data: CadastroForm) {
    setErro('')
    const res = await fetch('/api/auth/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json()
      setErro(body.error ?? 'Erro ao criar conta.')
    } else {
      router.push('/login')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 50%, #0f2e2b 100%)' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-sixxis.png" alt="Sixxis" style={{ height: '52px', width: 'auto' }} />
          </Link>
        </div>

        {/* Card branco */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">

          <div className="text-center mb-7">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Criar sua conta</h1>
            <p className="text-sm text-gray-500">Cadastre-se gratuitamente e aproveite</p>
          </div>

          {/* Cadastro social */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-2xl transition-all text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">ou cadastre-se com email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Nome */}
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Nome completo</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  {...register('nome')}
                  placeholder="Seu nome completo"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-[#3cbfb3] rounded-2xl text-sm outline-none transition bg-gray-50 focus:bg-white"
                />
              </div>
              {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-[#3cbfb3] rounded-2xl text-sm outline-none transition bg-gray-50 focus:bg-white"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* CPF + Telefone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">CPF</label>
                <div className="relative">
                  <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    {...register('cpf')}
                    placeholder="Somente números"
                    maxLength={11}
                    className="w-full pl-9 pr-3 py-3 border-2 border-gray-200 focus:border-[#3cbfb3] rounded-2xl text-sm outline-none transition bg-gray-50 focus:bg-white"
                  />
                </div>
                {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf.message}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Telefone</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    {...register('telefone')}
                    placeholder="(18) 99999-9999"
                    className="w-full pl-9 pr-3 py-3 border-2 border-gray-200 focus:border-[#3cbfb3] rounded-2xl text-sm outline-none transition bg-gray-50 focus:bg-white"
                  />
                </div>
                {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone.message}</p>}
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  {...register('senha')}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-11 py-3 border-2 border-gray-200 focus:border-[#3cbfb3] rounded-2xl text-sm outline-none transition bg-gray-50 focus:bg-white"
                />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.senha && <p className="text-red-500 text-xs mt-1">{errors.senha.message}</p>}
            </div>

            {/* Confirmar senha */}
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Confirmar senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  {...register('confirmarSenha')}
                  placeholder="Repita a senha"
                  className="w-full pl-10 pr-11 py-3 border-2 border-gray-200 focus:border-[#3cbfb3] rounded-2xl text-sm outline-none transition bg-gray-50 focus:bg-white"
                />
                <button type="button" onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {mostrarConfirmar ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmarSenha && <p className="text-red-500 text-xs mt-1">{errors.confirmarSenha.message}</p>}
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs text-red-600 font-semibold">{erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 font-extrabold text-white py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 text-base mt-2"
              style={{ backgroundColor: '#3cbfb3', boxShadow: '0 4px 14px rgba(60,191,179,0.35)' }}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Criar minha conta
                  <ArrowRight size={16} />
                </>
              )}
            </button>

          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Já tem conta?{' '}
            <Link href="/login" className="text-[#3cbfb3] font-bold hover:text-[#2a9d8f] transition">
              Entrar
            </Link>
          </p>

        </div>

        <div className="flex items-center justify-center gap-2 mt-5">
          <ShieldCheck size={13} className="text-white/50" />
          <p className="text-white/50 text-xs">Seus dados estão protegidos com criptografia SSL</p>
        </div>
        <div className="text-center mt-4">
          <Link href="/" className="text-white/40 hover:text-white/70 text-xs transition">
            ← Voltar para a loja
          </Link>
        </div>

      </div>
    </div>
  )
}
