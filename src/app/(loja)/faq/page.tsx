'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
  {
    q: 'Qual é o prazo de entrega?',
    a: 'O prazo de entrega varia conforme a região. Para Araçatuba e região, entregamos em 1–2 dias úteis. Para o interior de SP, 3–5 dias úteis. Para o restante do Brasil, entre 5 e 12 dias úteis, dependendo da transportadora e da localidade. Após a confirmação do pagamento, o pedido é processado em até 1 dia útil.',
  },
  {
    q: 'Quais são as formas de pagamento aceitas?',
    a: 'Aceitamos PIX (com 3% de desconto à vista), cartão de crédito (Visa, Mastercard, Elo, Amex) parcelado em até 12x, cartão de débito e boleto bancário. Todos os pagamentos são processados com segurança.',
  },
  {
    q: 'O frete é gratuito?',
    a: 'Sim! Oferecemos frete grátis para compras acima de R$ 500,00 para todo o Brasil. Para compras abaixo desse valor, o frete é calculado automaticamente no checkout com base no CEP de entrega.',
  },
  {
    q: 'Como funciona a garantia dos produtos?',
    a: 'Todos os produtos Sixxis possuem garantia contra defeitos de fabricação. O prazo de garantia varia por produto: climatizadores e spinning têm 12 meses, aspiradores têm 6 meses, e peças de reposição têm 3 meses. A garantia cobre defeitos de fabricação, mas não cobre danos por uso inadequado.',
  },
  {
    q: 'Posso trocar ou devolver um produto?',
    a: 'Sim. Você tem até 7 dias após o recebimento para solicitar troca ou devolução por arrependimento (conforme o Código de Defesa do Consumidor). Para produtos com defeito dentro do prazo de garantia, realizamos a troca ou reparo sem custo. O produto deve estar em perfeito estado, com embalagem original e todos os acessórios.',
  },
  {
    q: 'Como acompanho meu pedido?',
    a: 'Após a confirmação do pagamento e envio, você receberá um e-mail com o código de rastreamento. Você também pode acompanhar o status diretamente na área "Meus Pedidos" dentro da sua conta no site.',
  },
  {
    q: 'Os produtos são originais?',
    a: 'Sim! A Sixxis é importadora oficial dos produtos que comercializa. Todos os produtos são 100% originais, com nota fiscal e garantia. Não trabalhamos com produtos falsificados ou paralelos.',
  },
  {
    q: 'Vocês têm assistência técnica?',
    a: 'Sim. Contamos com uma equipe de suporte técnico especializado para auxiliar em dúvidas de instalação, uso e manutenção. Para atendimento técnico, entre em contato via WhatsApp (18) 99999-9999 ou pelo e-mail brasil.sixxis@gmail.com.',
  },
  {
    q: 'Como funciona o parcelamento no cartão?',
    a: 'Parcelamos em até 12x no cartão de crédito. Para compras acima de R$ 200,00, o parcelamento é sem juros em até 6x. Acima de 6x, aplicamos os juros da operadora de cartão. A opção de parcelamento é exibida automaticamente no checkout conforme o valor do pedido.',
  },
  {
    q: 'Posso comprar peças de reposição avulsas?',
    a: 'Sim! Temos um catálogo completo de peças de reposição originais para todos os produtos Sixxis. Acesse a seção "Peças" no menu ou entre em contato informando o modelo do equipamento para verificar disponibilidade.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-[#f8f9fa] transition-colors"
      >
        <span className="font-semibold text-[#0a0a0a] text-sm sm:text-base">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#3cbfb3] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-[#fafafa]">
          {a}
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  return (
    <main className="bg-white">

      {/* Hero */}
      <section
        className="py-16 md:py-20"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 mb-6">
            <HelpCircle size={14} />
            Central de Ajuda
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Perguntas Frequentes</h1>
          <p className="mt-4 text-white/70">
            Respondemos as principais dúvidas sobre entrega, pagamento, troca, garantia e produtos.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="space-y-3">
          {faqs.map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-[#f8f9fa] rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-[#0a0a0a] mb-2">Não encontrou sua resposta?</h2>
          <p className="text-gray-600 text-sm mb-6">
            Nossa equipe está pronta para te ajudar. Entre em contato via WhatsApp ou pelo formulário de contato.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://wa.me/5518999999999" target="_blank" rel="noopener noreferrer" className="btn-primary">
              WhatsApp
            </a>
            <a href="/contato" className="btn-outline">
              Formulário de Contato
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
