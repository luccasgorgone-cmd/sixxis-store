'use client'

import { useState } from 'react'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'

type FormState = {
  nome: string
  email: string
  telefone: string
  assunto: string
  mensagem: string
}

type Errors = Partial<Record<keyof FormState, string>>

const initial: FormState = { nome: '', email: '', telefone: '', assunto: '', mensagem: '' }

function validate(form: FormState): Errors {
  const erros: Errors = {}
  if (!form.nome.trim())          erros.nome = 'Nome é obrigatório'
  if (!form.email.trim())         erros.email = 'E-mail é obrigatório'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) erros.email = 'E-mail inválido'
  if (!form.assunto)              erros.assunto = 'Selecione um assunto'
  if (!form.mensagem.trim())      erros.mensagem = 'Mensagem é obrigatória'
  else if (form.mensagem.trim().length < 10) erros.mensagem = 'Mensagem muito curta (mínimo 10 caracteres)'
  return erros
}

function inputClass(touched: boolean, error?: string) {
  const base = 'w-full border rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 transition'
  if (!touched)  return `${base} border-gray-300 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]`
  if (error)     return `${base} border-red-400 bg-red-50/30 focus:ring-red-300 focus:border-red-400`
  return `${base} border-[#3cbfb3] bg-[#f9fffe] focus:ring-[#3cbfb3] focus:border-[#3cbfb3]`
}

export default function FormContato() {
  const [enviado, setEnviado] = useState(false)
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({})
  const [enviando, setEnviando] = useState(false)
  const [erroGlobal, setErroGlobal] = useState('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    setForm(updated)
    if (touched[name as keyof FormState]) {
      setErrors(validate(updated))
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const name = e.target.name as keyof FormState
    const newTouched = { ...touched, [name]: true }
    setTouched(newTouched)
    setErrors(validate(form))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const allTouched = Object.fromEntries(
      (Object.keys(form) as (keyof FormState)[]).map((k) => [k, true])
    )
    setTouched(allTouched)
    const erros = validate(form)
    setErrors(erros)
    if (Object.keys(erros).length > 0) return

    setErroGlobal('')
    setEnviando(true)
    try {
      const r = await fetch('/api/contato', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (!r.ok) throw new Error()
      setEnviado(true)
    } catch {
      setErroGlobal('Erro ao enviar mensagem. Tente novamente ou entre em contato pelo WhatsApp.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="bg-[#e8f8f7] border border-[#3cbfb3] rounded-xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#3cbfb3] flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={26} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-[#0a0a0a] mb-2">Mensagem enviada!</h3>
        <p className="text-gray-600 text-sm">Obrigado pelo contato. Responderemos em até 1 dia útil.</p>
        <button
          onClick={() => { setEnviado(false); setForm(initial); setTouched({}); setErrors({}) }}
          className="mt-6 border border-[#3cbfb3] text-[#3cbfb3] hover:bg-[#3cbfb3] hover:text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition"
        >
          Enviar outra mensagem
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Nome */}
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nome completo <span className="text-red-500">*</span>
          </label>
          <input
            id="nome" name="nome" type="text"
            value={form.nome} onChange={handleChange} onBlur={handleBlur}
            placeholder="Seu nome"
            className={inputClass(!!touched.nome, errors.nome)}
          />
          {touched.nome && errors.nome && (
            <p className="flex items-center gap-1 mt-1 text-xs text-red-500">
              <AlertCircle size={12} /> {errors.nome}
            </p>
          )}
          {touched.nome && !errors.nome && form.nome && (
            <p className="flex items-center gap-1 mt-1 text-xs text-[#3cbfb3]">
              <CheckCircle size={12} /> Ótimo!
            </p>
          )}
        </div>

        {/* E-mail */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            E-mail <span className="text-red-500">*</span>
          </label>
          <input
            id="email" name="email" type="email"
            value={form.email} onChange={handleChange} onBlur={handleBlur}
            placeholder="seu@email.com"
            className={inputClass(!!touched.email, errors.email)}
          />
          {touched.email && errors.email && (
            <p className="flex items-center gap-1 mt-1 text-xs text-red-500">
              <AlertCircle size={12} /> {errors.email}
            </p>
          )}
          {touched.email && !errors.email && form.email && (
            <p className="flex items-center gap-1 mt-1 text-xs text-[#3cbfb3]">
              <CheckCircle size={12} /> Ótimo!
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Telefone */}
        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1.5">
            Telefone / WhatsApp
          </label>
          <input
            id="telefone" name="telefone" type="tel"
            value={form.telefone} onChange={handleChange} onBlur={handleBlur}
            placeholder="(18) 99999-9999"
            className={inputClass(!!touched.telefone, undefined)}
          />
        </div>

        {/* Assunto */}
        <div>
          <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 mb-1.5">
            Assunto <span className="text-red-500">*</span>
          </label>
          <select
            id="assunto" name="assunto"
            value={form.assunto} onChange={handleChange} onBlur={handleBlur}
            className={inputClass(!!touched.assunto, errors.assunto) + ' bg-white'}
          >
            <option value="">Selecione...</option>
            <option value="duvida">Dúvida sobre produto</option>
            <option value="suporte">Suporte técnico</option>
            <option value="pedido">Informação sobre pedido</option>
            <option value="troca">Troca ou devolução</option>
            <option value="outro">Outro assunto</option>
          </select>
          {touched.assunto && errors.assunto && (
            <p className="flex items-center gap-1 mt-1 text-xs text-red-500">
              <AlertCircle size={12} /> {errors.assunto}
            </p>
          )}
        </div>
      </div>

      {/* Mensagem */}
      <div>
        <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-1.5">
          Mensagem <span className="text-red-500">*</span>
        </label>
        <textarea
          id="mensagem" name="mensagem" rows={5}
          value={form.mensagem} onChange={handleChange} onBlur={handleBlur}
          placeholder="Descreva sua dúvida ou solicitação em detalhes..."
          className={inputClass(!!touched.mensagem, errors.mensagem) + ' resize-none'}
        />
        {touched.mensagem && errors.mensagem && (
          <p className="flex items-center gap-1 mt-1 text-xs text-red-500">
            <AlertCircle size={12} /> {errors.mensagem}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1 text-right">{form.mensagem.length} caracteres</p>
      </div>

      {erroGlobal && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="shrink-0" />
          {erroGlobal}
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm px-8 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg w-full sm:w-auto"
      >
        <Send size={16} />
        {enviando ? 'Enviando...' : 'Enviar Mensagem'}
      </button>
    </form>
  )
}
