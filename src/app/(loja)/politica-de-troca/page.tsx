import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, CheckCircle, RotateCcw, Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Troca e Devolução',
  description: 'Conheça nossa política de trocas e devoluções. Seu direito protegido pela Sixxis.',
}

export default function PoliticaDeTrocaPage() {
  return (
    <main className="bg-white">

      {/* Hero */}
      <section
        className="py-16 md:py-20"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#3cbfb3] text-sm font-semibold uppercase tracking-widest mb-3">Seus direitos garantidos</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Política de Troca e Devolução</h1>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">
            Transparência e respeito ao consumidor em cada etapa da sua experiência com a Sixxis.
          </p>
        </div>
      </section>

      {/* Cards resumo */}
      <section className="bg-[#f8f9fa] py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Clock,       title: 'Prazo de 7 dias',     text: 'Para arrependimento após o recebimento' },
              { icon: CheckCircle, title: 'Garantia total',       text: 'Defeitos cobertos dentro do prazo de garantia' },
              { icon: RotateCcw,   title: 'Processo simples',     text: 'Solicite via WhatsApp ou e-mail' },
              { icon: Phone,       title: 'Suporte dedicado',     text: 'Equipe pronta para te orientar' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-white rounded-xl p-5 border border-gray-200 text-center">
                <div className="w-10 h-10 rounded-full bg-[#e8f8f7] flex items-center justify-center mx-auto mb-3">
                  <Icon size={18} className="text-[#3cbfb3]" />
                </div>
                <p className="font-bold text-[#0a0a0a] text-sm mb-1">{title}</p>
                <p className="text-xs text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 prose-sm prose-headings:text-[#0a0a0a] prose-headings:font-bold">

        <div className="space-y-10">

          {/* Prazo */}
          <div>
            <h2 className="section-title text-xl mb-5">1. Prazo para Troca e Devolução</h2>
            <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
              <p>
                Conforme o <strong>artigo 49 do Código de Defesa do Consumidor</strong>, o cliente tem até <strong>7 (sete) dias corridos</strong> após o recebimento do produto para solicitar a devolução por arrependimento, sem necessidade de justificativa.
              </p>
              <p>
                Para produtos com <strong>defeito de fabricação</strong>, o prazo é de <strong>30 dias para produtos não duráveis</strong> e <strong>90 dias para produtos duráveis</strong>, contados a partir da data de recebimento.
              </p>
              <p>
                Para reclamações dentro do <strong>prazo de garantia Sixxis</strong> (que pode ser superior ao prazo legal), o cliente deve acionar diretamente o suporte técnico.
              </p>
            </div>
          </div>

          {/* Condições */}
          <div>
            <h2 className="section-title text-xl mb-5">2. Condições para Troca ou Devolução</h2>
            <div className="text-gray-600 text-sm leading-relaxed">
              <p className="mb-3">Para que a solicitação seja aceita, o produto deve estar:</p>
              <ul className="space-y-2 ml-4">
                {[
                  'Em perfeito estado, sem sinais de uso inadequado, danos físicos ou violações',
                  'Na embalagem original, com todos os acessórios, manuais e nota fiscal',
                  'Sem sinais de personalização, adaptação ou modificação',
                  'Sem avarias causadas pelo cliente durante o transporte de retorno',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-[#3cbfb3] font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-4 mb-3">
                <strong className="text-[#0a0a0a]">Não são aceitas devoluções</strong> nos seguintes casos:
              </p>
              <ul className="space-y-2 ml-4">
                {[
                  'Produtos com danos causados por uso indevido ou negligência',
                  'Produtos com sinais de violação do lacre de garantia',
                  'Peças de reposição já utilizadas',
                  'Solicitações fora do prazo estabelecido',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-red-400 font-bold mt-0.5">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Processo */}
          <div>
            <h2 className="section-title text-xl mb-5">3. Como Solicitar a Troca ou Devolução</h2>
            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Entre em contato',
                  text:  'Envie uma mensagem via WhatsApp (18) 99999-9999 ou e-mail brasil.sixxis@gmail.com informando o número do pedido e o motivo da solicitação.',
                },
                {
                  step: '02',
                  title: 'Aguarde a confirmação',
                  text:  'Nossa equipe analisará o pedido em até 2 dias úteis e confirmará as instruções de envio do produto.',
                },
                {
                  step: '03',
                  title: 'Envie o produto',
                  text:  'Embale o produto adequadamente e envie para o endereço informado por nossa equipe. O custo do frete de retorno é responsabilidade do cliente, salvo em casos de defeito de fabricação.',
                },
                {
                  step: '04',
                  title: 'Conclusão',
                  text:  'Após o recebimento e análise do produto (até 5 dias úteis), realizaremos a troca, o reembolso ou o reparo conforme acordado.',
                },
              ].map(({ step, title, text }) => (
                <div key={step} className="flex gap-4 bg-[#f8f9fa] rounded-xl p-5">
                  <span className="text-2xl font-extrabold text-[#3cbfb3] shrink-0">{step}</span>
                  <div>
                    <p className="font-bold text-[#0a0a0a] mb-1">{title}</p>
                    <p className="text-sm text-gray-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reembolso */}
          <div>
            <h2 className="section-title text-xl mb-5">4. Reembolso</h2>
            <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
              <p>O reembolso será processado após a confirmação do recebimento e análise do produto devolvido:</p>
              <ul className="space-y-2 ml-4">
                {[
                  'PIX: estorno em até 2 dias úteis',
                  'Cartão de crédito: estorno em até 2 faturas, conforme operadora',
                  'Boleto: reembolso via PIX ou TED em até 5 dias úteis',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-[#3cbfb3] font-bold mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-[#f8f9fa] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-[#0a0a0a] mb-3">5. Contato para Trocas e Devoluções</h2>
            <p className="text-sm text-gray-600 mb-5">
              Para qualquer dúvida ou para iniciar o processo de troca, entre em contato com nossa equipe:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="https://wa.me/5518999999999" target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                WhatsApp (18) 99999-9999
              </a>
              <a href="mailto:brasil.sixxis@gmail.com" className="btn-outline text-sm">
                brasil.sixxis@gmail.com
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Links relacionados */}
      <section className="border-t border-gray-200 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-gray-500 mb-4">Veja também:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              ['/faq', 'Perguntas Frequentes'],
              ['/garantia', 'Termo de Garantia'],
              ['/contato', 'Fale Conosco'],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="text-sm text-[#3cbfb3] hover:underline font-medium">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
