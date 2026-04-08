'use client'

import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'

type FormState = {
  nome: string
  email: string
  telefone: string
  assunto: string
  mensagem: string
}

const initial: FormState = { nome: '', email: '', telefone: '', assunto: '', mensagem: '' }

export default function FormContato() {
  const [enviado, setEnviado] = useState(false)
  const [form, setForm] = useState<FormState>(initial)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: integrar com API de e-mail / WhatsApp
    setEnviado(true)
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
          onClick={() => { setEnviado(false); setForm(initial) }}
          className="mt-6 btn-outline"
        >
          Enviar outra mensagem
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nome completo *
          </label>
          <input
            id="nome" name="nome" type="text" required
            value={form.nome} onChange={handleChange}
            placeholder="Seu nome"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            E-mail *
          </label>
          <input
            id="email" name="email" type="email" required
            value={form.email} onChange={handleChange}
            placeholder="seu@email.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1.5">
            Telefone / WhatsApp
          </label>
          <input
            id="telefone" name="telefone" type="tel"
            value={form.telefone} onChange={handleChange}
            placeholder="(18) 99999-9999"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition"
          />
        </div>
        <div>
          <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 mb-1.5">
            Assunto *
          </label>
          <select
            id="assunto" name="assunto" required
            value={form.assunto} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition"
          >
            <option value="">Selecione...</option>
            <option value="duvida">Dúvida sobre produto</option>
            <option value="suporte">Suporte técnico</option>
            <option value="pedido">Informação sobre pedido</option>
            <option value="troca">Troca ou devolução</option>
            <option value="outro">Outro assunto</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-1.5">
          Mensagem *
        </label>
        <textarea
          id="mensagem" name="mensagem" required rows={5}
          value={form.mensagem} onChange={handleChange}
          placeholder="Descreva sua dúvida ou solicitação em detalhes..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition"
        />
      </div>

      <button type="submit" className="btn-primary w-full sm:w-auto">
        <Send size={16} />
        Enviar Mensagem
      </button>
    </form>
  )
}
