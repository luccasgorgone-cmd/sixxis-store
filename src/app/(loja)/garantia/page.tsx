import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termo de Garantia | Sixxis',
  description: 'Conheça os prazos e condições de garantia dos produtos Sixxis e saiba como acionar a assistência técnica.',
}

const categoriasGarantia = [
  {
    categoria: 'Climatizadores',
    prazo: '12 meses',
    cobertura: 'Defeitos de fabricação em compressor, motor, painel eletrônico e peças estruturais.',
    obs: 'Filtros e consumíveis não cobertos.',
  },
  {
    categoria: 'Aspiradores de Pó',
    prazo: '12 meses',
    cobertura: 'Motor, corpo do aspirador, mangueiras e acessórios originais.',
    obs: 'Sacos e filtros descartáveis não cobertos.',
  },
  {
    categoria: 'Bikes de Spinning',
    prazo: '12 meses',
    cobertura: 'Estrutura metálica, sistema de freio magnético, guidão, selim e pedais.',
    obs: 'Desgaste natural de correia e partes móveis após uso intenso não cobertos.',
  },
  {
    categoria: 'Peças de Reposição',
    prazo: '90 dias',
    cobertura: 'Defeito de fabricação ou incompatibilidade com o produto original Sixxis.',
    obs: 'Peças instaladas por terceiros não autorizados não cobertas.',
  },
]

const etapasGarantia = [
  {
    numero: '1',
    titulo: 'Entre em contato',
    desc: 'Envie um e-mail para brasil.sixxis@gmail.com com seu número de pedido, descrição do problema e fotos ou vídeo do defeito.',
  },
  {
    numero: '2',
    titulo: 'Análise do caso',
    desc: 'Nossa equipe técnica avaliará seu chamado em até 2 dias úteis e confirmará se o defeito é coberto pela garantia.',
  },
  {
    numero: '3',
    titulo: 'Logística reversa',
    desc: 'Aprovada a garantia, enviaremos uma etiqueta de devolução gratuita para que você nos envie o produto.',
  },
  {
    numero: '4',
    titulo: 'Reparo ou substituição',
    desc: 'O produto será reparado ou substituído em até 30 dias corridos a partir do recebimento. Você será notificado em cada etapa.',
  },
]

const naoCobertas = [
  'Danos causados por mau uso, acidentes, quedas ou impactos físicos',
  'Desgaste natural por uso prolongado (consumíveis, filtros, borrachas)',
  'Modificações ou reparos realizados por terceiros não autorizados',
  'Danos por tensão elétrica incorreta ou surtos de energia',
  'Danos causados por agentes externos (umidade excessiva, corrosão, insetos)',
  'Produtos sem nota fiscal ou com número de série adulterado',
  'Produtos fora do prazo de garantia',
]

export default function GarantiaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className="text-white py-16 px-4"
        style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#3cbfb3]/20 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck size={32} className="text-[#3cbfb3]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Termo de Garantia Sixxis</h1>
          <p className="text-white/70 text-lg">Produtos de qualidade com suporte técnico especializado</p>
          <p className="text-white/50 text-sm mt-2">Válido para compras realizadas na loja oficial Sixxis a partir de janeiro de 2025</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">

        {/* Intro */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <p className="text-gray-700 leading-relaxed">
            A <strong>Sixxis</strong> garante todos os produtos vendidos em sua loja oficial contra defeitos de
            fabricação, conforme os prazos e condições descritos neste termo, em cumprimento ao{' '}
            <strong>Código de Defesa do Consumidor (CDC — Lei nº 8.078/1990)</strong> e às políticas internas da
            empresa. A garantia é válida exclusivamente para o comprador original e para produtos adquiridos
            diretamente na loja oficial Sixxis.
          </p>
        </div>

        {/* Prazos por categoria */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-6 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
            Prazos de garantia por categoria
          </h2>
          <div className="space-y-4">
            {categoriasGarantia.map((item) => (
              <div key={item.categoria} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-[#e8f8f7] px-5 py-3 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">{item.categoria}</h3>
                  <span className="bg-[#3cbfb3] text-white text-sm font-bold px-3 py-1 rounded-full">
                    {item.prazo}
                  </span>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Cobertura:</strong> {item.cobertura}
                  </p>
                  <p className="text-xs text-gray-500">
                    <strong>Obs.:</strong> {item.obs}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            A garantia legal do CDC (90 dias para produtos duráveis) é adicional à garantia contratual Sixxis.
            Os prazos acima se somam ao prazo legal.
          </p>
        </section>

        {/* Como acionar */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-6 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
            Como acionar a garantia
          </h2>
          <div className="space-y-4">
            {etapasGarantia.map((etapa) => (
              <div key={etapa.numero} className="flex gap-4">
                <div className="shrink-0 bg-[#3cbfb3] text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                  {etapa.numero}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{etapa.titulo}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{etapa.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-[#e8f8f7] rounded-xl p-4 text-sm text-gray-700">
            <strong className="text-[#0f2e2b]">Importante:</strong> O acionamento da garantia deve ser solicitado dentro do prazo vigente.
            Guarde sempre sua nota fiscal como comprovante de compra — ela é obrigatória para acionamento.
          </div>
        </section>

        {/* O que não cobre */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
            Situações não cobertas pela garantia
          </h2>
          <ul className="space-y-2">
            {naoCobertas.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Assistência técnica */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
            Assistência técnica autorizada
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Para serviços de reparo dentro ou fora do prazo de garantia, você pode acionar diretamente a central
            de suporte técnico Sixxis. Reparos realizados por assistências não autorizadas anulam a garantia do
            produto.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Central de Suporte</h3>
              <ul className="space-y-1 text-gray-600">
                <li>E-mail: brasil.sixxis@gmail.com</li>
                <li>WhatsApp: (11) 93410-2621</li>
                <li>Horário: Seg–Sex, 8h–18h</li>
                <li>Resposta em até 2 dias úteis</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Documentos necessários</h3>
              <ul className="space-y-1 text-gray-600">
                <li>Nota fiscal de compra</li>
                <li>Número do pedido (loja online)</li>
                <li>Fotos/vídeo do defeito</li>
                <li>Descrição detalhada do problema</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Prazo de resposta / direitos */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
            Seus direitos e prazos legais
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              Conforme o <strong>CDC (Art. 26 e 18)</strong>, você tem direito a reclamar por vícios (defeitos)
              nos produtos nos seguintes prazos:
            </p>
            <ul className="space-y-2">
              <li className="flex gap-2"><span className="text-[#3cbfb3] font-bold">•</span><span><strong>30 dias</strong> para produtos e serviços não duráveis.</span></li>
              <li className="flex gap-2"><span className="text-[#3cbfb3] font-bold">•</span><span><strong>90 dias</strong> para produtos duráveis (eletrodomésticos, equipamentos).</span></li>
            </ul>
            <p>
              Se o defeito não for sanado em <strong>30 dias corridos</strong>, você pode exigir, à sua escolha:
              substituição do produto, restituição do valor pago ou abatimento proporcional no preço.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section
          className="text-white rounded-2xl p-8 text-center"
          style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
        >
          <div className="w-12 h-12 rounded-full bg-[#3cbfb3]/20 flex items-center justify-center mx-auto mb-4">
            <Mail size={22} className="text-[#3cbfb3]" />
          </div>
          <h2 className="text-xl font-bold mb-3">Precisa acionar a garantia?</h2>
          <p className="text-white/70 mb-6 text-sm leading-relaxed">
            Nossa equipe está pronta para ajudar. Entre em contato informando seu pedido e o defeito encontrado.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:brasil.sixxis@gmail.com"
              className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              brasil.sixxis@gmail.com
            </a>
            <Link
              href="/pedidos"
              className="border-2 border-white/30 hover:border-white text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Ver meus pedidos
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
