import type { Metadata } from 'next'
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'
import FormContato from '@/components/contato/FormContato'

export const metadata: Metadata = {
  title: 'Contato',
  description:
    'Entre em contato com a Sixxis. Tire dúvidas, solicite suporte técnico ou fale conosco via WhatsApp, e-mail ou formulário.',
}

const infos = [
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
]

export default function ContatoPage() {
  return (
    <main className="bg-white">

      {/* Hero */}
      <section
        className="py-16 md:py-20"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#3cbfb3] text-sm font-semibold uppercase tracking-widest mb-3">
            Fale com a gente
          </p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Contato</h1>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">
            Nossa equipe está disponível para tirar dúvidas, dar suporte técnico e ajudar no que precisar.
          </p>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Formulário (client) */}
          <div className="lg:col-span-3">
            <h2 className="section-title mb-8">Envie uma mensagem</h2>
            <FormContato />
          </div>

          {/* Informações (server) */}
          <div className="lg:col-span-2">
            <h2 className="section-title mb-8">Informações</h2>

            <div className="space-y-6">
              {infos.map(({ icon: Icon, title, lines, href }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#e8f8f7] flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-[#3cbfb3]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0a0a0a] text-sm mb-0.5">{title}</p>
                    {lines.map((l) =>
                      href ? (
                        <a
                          key={l}
                          href={href}
                          className="block text-sm text-gray-600 hover:text-[#3cbfb3] transition"
                        >
                          {l}
                        </a>
                      ) : (
                        <p key={l} className="text-sm text-gray-600">{l}</p>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mapa OpenStreetMap */}
            <div className="mt-8 rounded-xl overflow-hidden border border-gray-200">
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
