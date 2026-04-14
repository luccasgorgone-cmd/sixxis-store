import type { Metadata } from 'next'
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'
import FormContato from '@/components/contato/FormContato'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Contato',
  description:
    'Entre em contato com a Sixxis. Tire dúvidas, solicite suporte técnico ou fale conosco via WhatsApp, e-mail ou formulário.',
}

const infos = [
  {
    icon:  MessageCircle,
    title: 'WhatsApp',
    lines: ['(18) 99747-4701', 'Resposta rápida'],
    href:  'https://wa.me/5518997474701',
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
    lines: ['R. Anhanguera, 1711 - Icaray', 'Araçatuba - SP, 16020-355'],
  },
  {
    icon:  Clock,
    title: 'Horário de Atendimento',
    lines: ['Seg–Sex: 08h às 18h', 'Sáb: 08h às 12h'],
  },
  {
    icon:  Phone,
    title: 'Telefone',
    lines: ['(18) 99747-4701'],
    href:  'tel:+5518997474701',
  },
]

export default function ContatoPage() {
  return (
    <main className="bg-white">

      {/* Hero */}
      <section
        className="py-16 md:py-20"
        style={{ backgroundColor: '#1a4f4a' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#3cbfb3] text-sm font-semibold uppercase tracking-widest mb-3">
            Fale com a gente
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Contato</h1>
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

            {/* Mapa Google Maps — R. Anhanguera, 1711, Araçatuba-SP */}
            <div className="mt-8 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <iframe
                src="https://maps.google.com/maps?q=R.+Anhanguera,+1711,+Icaray,+Araçatuba,+SP,+16020-355&output=embed&z=16"
                width="100%"
                height="320"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                title="Localização Sixxis — R. Anhanguera, 1711, Araçatuba SP"
              />
            </div>
            <a
              href="https://maps.google.com/maps?q=R.+Anhanguera,+1711,+Icaray,+Araçatuba,+SP,+16020-355"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-[#3cbfb3] hover:underline"
            >
              <MapPin size={11} /> Abrir no Google Maps
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
