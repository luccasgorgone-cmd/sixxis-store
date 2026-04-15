import type { Metadata } from 'next'
import { HelpCircle } from 'lucide-react'
import FaqAccordion from '@/components/faq/FaqAccordion'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Perguntas Frequentes',
  description:
    'Tire suas dúvidas sobre entrega, pagamento, troca, garantia e produtos Sixxis. Central de ajuda completa.',
}

const faqs = [
  {
    q: 'Qual é o prazo de entrega?',
    a: 'O prazo de entrega varia conforme a região. Para Araçatuba e região, entregamos em 1–2 dias úteis. Para o interior de SP, 3–5 dias úteis. Para o restante do Brasil, entre 5 e 12 dias úteis, dependendo da transportadora e da localidade. Após a confirmação do pagamento, o pedido é processado em até 1 dia útil.',
  },
  {
    q: 'Quais são as formas de pagamento aceitas?',
    a: 'Aceitamos PIX (com 3% de desconto à vista), cartão de crédito (Visa, Mastercard, Elo, Amex) parcelado em até 12x, cartão de débito e boleto bancário. Todos os pagamentos são processados com segurança via MercadoPago.',
  },
  {
    q: 'O frete é gratuito?',
    a: 'Sim! Oferecemos frete grátis para compras acima de R$ 500,00 para todo o Brasil. Para compras abaixo desse valor, o frete é calculado automaticamente no checkout com base no CEP de entrega.',
  },
  {
    q: 'Como funciona a garantia dos produtos?',
    a: 'Todos os produtos Sixxis possuem garantia contra defeitos de fabricação. O prazo de garantia varia por produto: climatizadores, aspiradores e spinning têm 12 meses. A garantia cobre defeitos de fabricação, mas não cobre danos por uso inadequado.',
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
    a: 'Sim. Contamos com uma equipe de suporte técnico especializado para auxiliar em dúvidas de instalação, uso e manutenção. Para atendimento técnico, entre em contato via WhatsApp (18) 99747-4701 ou pelo e-mail brasil.sixxis@gmail.com.',
  },
  {
    q: 'Como funciona o parcelamento no cartão?',
    a: 'Parcelamos em até 12x no cartão de crédito. Para compras acima de R$ 200,00, o parcelamento é sem juros em até 6x. Acima de 6x, aplicamos os juros da operadora de cartão. A opção de parcelamento é exibida automaticamente no checkout conforme o valor do pedido.',
  },
  {
    q: 'Posso comprar peças de reposição avulsas?',
    a: 'Sim! Entre em contato com nossa equipe pelo WhatsApp (18) 99747-4701 ou pelo formulário de contato informando o modelo do seu equipamento. Verificamos disponibilidade e enviamos o orçamento diretamente para você.',
  },
]

export default function FaqPage() {
  return (
    <main className="bg-white">
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'FAQ' }]} />

      {/* Hero */}
      <section
        className="py-16 md:py-20"
        style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 mb-6">
            <HelpCircle size={14} />
            Central de Ajuda
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Perguntas Frequentes
          </h1>
          <p className="mt-4 text-white/70">
            Respondemos as principais dúvidas sobre entrega, pagamento, troca, garantia e produtos.
          </p>
        </div>
      </section>

      {/* Accordion */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <FaqAccordion items={faqs} />

        {/* CTA */}
        <div className="mt-12 bg-[#f8f9fa] rounded-2xl p-8 text-center border border-gray-200">
          <h2 className="text-xl font-bold text-[#0a0a0a] mb-2">Não encontrou sua resposta?</h2>
          <p className="text-gray-600 text-sm mb-6">
            Nossa equipe está pronta para te ajudar via WhatsApp ou pelo formulário de contato.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/5518997474701"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
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
