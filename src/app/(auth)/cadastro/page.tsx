'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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

  const campos: { name: keyof CadastroForm; label: string; type: string; placeholder?: string }[] = [
    { name: 'nome',          label: 'Nome completo',        type: 'text',     placeholder: 'Seu nome' },
    { name: 'email',         label: 'Email',                type: 'email',    placeholder: 'seu@email.com' },
    { name: 'cpf',           label: 'CPF',                  type: 'text',     placeholder: 'Somente números' },
    { name: 'telefone',      label: 'Telefone',             type: 'tel',      placeholder: '(18) 99999-9999' },
    { name: 'senha',         label: 'Senha',                type: 'password', placeholder: '••••••••' },
    { name: 'confirmarSenha',label: 'Confirmar senha',      type: 'password', placeholder: '••••••••' },
  ]

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-baseline">
            <span className="text-2xl font-black tracking-tight text-[#0a0a0a]">SIXXIS</span>
            <span className="text-2xl font-black tracking-tight text-[#3cbfb3]">.store</span>
          </Link>
          <h1 className="text-xl font-bold text-[#0a0a0a] mt-4">Criar sua conta</h1>
          <p className="text-sm text-gray-500 mt-1">Cadastre-se gratuitamente</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {campos.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <input
                type={type}
                {...register(name)}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition"
              />
              {errors[name] && (
                <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>
              )}
            </div>
          ))}

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Já tem conta?{' '}
          <Link href="/login" className="text-[#3cbfb3] font-semibold hover:text-[#2a9d8f] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
