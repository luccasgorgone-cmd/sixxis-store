'use client'

import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react'

export default function ContatoPage() {
  const [enviado, setEnviado] = useState(false)
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', assunto: '', mensagem: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Aqui enviaria para uma API de contato
    setEnviado(true)
  }

  return (
    <main className="bg-white">

      {/* Hero */}
      <section
        className="py-16 md:py-20"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#3cbfb3] text-sm font-semibold uppercase tracking-widest mb-3">Fale com a gente</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Contato</h1>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">
            Nossa equipe está disponível para tirar dúvidas, dar suporte técnico e ajudar no que precisar.
          </p>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Formulário */}
          <div className="lg:col-span-3">
            <h2 className="section-title mb-8">Envie uma mensagem</h2>

            {enviado ? (
              <div className="bg-[#e8f8f7] border border-[#3cbfb3] rounded-xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[#3cbfb3] flex items-center justify-center mx-auto mb-4">
                  <Send size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0a0a0a] mb-2">Mensagem enviada!</h3>
                <p className="text-gray-600">Obrigado pelo contato. Responderemos em até 1 dia útil.</p>
                <button
                  onClick={() => { setEnviado(false); setForm({ nome: '', email: '', telefone: '', assunto: '', mensagem: '' }) }}
                  className="mt-6 btn-outline"
                >
                  Enviar outra mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo *</label>
                    <input
                      id="nome"
                      name="nome"
                      type="text"
                      required
                      value={form.nome}
                      onChange={handleChange}
                      placeholder="Seu nome"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">E-mail *</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1.5">Telefone / WhatsApp</label>
                    <input
                      id="telefone"
                      name="telefone"
                      type="tel"
                      value={form.telefone}
                      onChange={handleChange}
                      placeholder="(18) 99999-9999"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 mb-1.5">Assunto *</label>
                    <select
                      id="assunto"
                      name="assunto"
                      required
                      value={form.assunto}
                      onChange={handleChange}
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
                  <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem *</label>
                  <textarea
                    id="mensagem"
                    name="mensagem"
                    required
                    rows={5}
                    value={form.mensagem}
                    onChange={handleChange}
                    placeholder="Descreva sua dúvida ou solicitação em detalhes..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition"
                  />
                </div>

                <button type="submit" className="btn-primary w-full sm:w-auto">
                  <Send size={16} />
                  Enviar Mensagem
                </button>
              </form>
            )}
          </div>

          {/* Informações */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="section-title mb-8">Informações</h2>

            {[
              {
                icon:  MessageCircle,
                title: 'WhatsApp',
                lines: ['(18) 99999-9999', 'Resposta rápida'],
                href:  'https://wa.me/5518999999999',
              },
              {
                icon:  Mail,
                title: 'E-mail',
                lines: ['brasil.sixxis@gmail.com', 'Respondemos em até 1 dia útil'],
                href:  'mailto:brasil.sixxis@gmail.com',
              },
              {
                icon:  MapPin,
                title: 'Localização',
                lines: ['Araçatuba, São Paulo', 'Brasil'],
              },
              {
                icon:  Clock,
                title: 'Horário de Atendimento',
                lines: ['Seg–Sex: 08h às 18h', 'Sáb: 08h às 12h'],
              },
              {
                icon:  Phone,
                title: 'Telefone',
                lines: ['(18) 99999-9999'],
                href:  'tel:+5518999999999',
              },
            ].map(({ icon: Icon, title, lines, href }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#e8f8f7] flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[#3cbfb3]" />
                </div>
                <div>
                  <p className="font-semibold text-[#0a0a0a] text-sm">{title}</p>
                  {lines.map(l => (
                    href
                      ? <a key={l} href={href} className="block text-sm text-gray-600 hover:text-[#3cbfb3] transition">{l}</a>
                      : <p key={l} className="text-sm text-gray-600">{l}</p>
                  ))}
                </div>
              </div>
            ))}

            {/* Mapa OpenStreetMap */}
            <div className="mt-6 rounded-xl overflow-hidden border border-gray-200">
              <iframe
                title="Localização Sixxis — Araçatuba, SP"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-50.5247,-21.2178,-50.4247,-21.1478&layer=mapnik&marker=-21.1828,-50.4747"
                width="100%"
                height="200"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
