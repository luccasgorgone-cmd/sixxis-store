import type { Metadata } from 'next'
import { Shield } from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Política de Privacidade | Sixxis',
  description: 'Saiba como a Sixxis coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.',
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Política de Privacidade' }]} />
      {/* Hero */}
      <section
        className="text-white py-16 px-4"
        style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#3cbfb3]/20 flex items-center justify-center mx-auto mb-5">
            <Shield size={32} className="text-[#3cbfb3]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Política de Privacidade</h1>
          <p className="text-white/70 text-lg">Transparência e respeito à sua privacidade, em conformidade com a LGPD</p>
          <p className="text-white/50 text-sm mt-2">Última atualização: abril de 2026</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">

        {/* 1. Dados coletados */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
            Dados que coletamos
          </h2>
          <p className="text-gray-600 mb-4">Coletamos apenas os dados necessários para prestar nossos serviços:</p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Dados de cadastro</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>CPF (para emissão de nota fiscal)</li>
                <li>Número de telefone</li>
                <li>Endereço de entrega (CEP, rua, número, complemento, cidade, estado)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Dados de navegação</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                <li>Endereço IP e informações do navegador</li>
                <li>Páginas visitadas e tempo de permanência</li>
                <li>Produtos visualizados e adicionados ao carrinho</li>
                <li>Cookies de sessão e preferências</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Dados de transações</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                <li>Histórico de pedidos e valores</li>
                <li>Método de pagamento (não armazenamos dados completos de cartão)</li>
                <li>Status e rastreamento de entregas</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Como usamos */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
            Como utilizamos seus dados
          </h2>
          <p className="text-gray-600 mb-4">Utilizamos seus dados pessoais para as seguintes finalidades:</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { titulo: 'Processar pedidos', desc: 'Confirmar, faturar e entregar seus pedidos com precisão.' },
              { titulo: 'Atendimento ao cliente', desc: 'Responder dúvidas, solicitações de troca, garantia e suporte técnico.' },
              { titulo: 'Comunicações transacionais', desc: 'Enviar confirmações de compra, atualizações de entrega e rastreamento.' },
              { titulo: 'Prevenção de fraudes', desc: 'Proteger sua conta e garantir a segurança das transações.' },
              { titulo: 'Melhorias no serviço', desc: 'Analisar dados de uso para aprimorar nosso site e catálogo.' },
              { titulo: 'Obrigações legais', desc: 'Cumprir exigências fiscais, contábeis e regulatórias aplicáveis.' },
            ].map((item) => (
              <div key={item.titulo} className="bg-[#e8f8f7] rounded-xl p-4">
                <h3 className="font-semibold text-[#0f2e2b] text-sm mb-1">{item.titulo}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Base legal */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
            Base legal para o tratamento (LGPD)
          </h2>
          <p className="text-gray-600 mb-4">
            Tratamos seus dados com base nas seguintes hipóteses previstas na LGPD (Art. 7º):
          </p>
          <ul className="space-y-3">
            {[
              { base: 'Execução de contrato', desc: 'Para processar e entregar seus pedidos.' },
              { base: 'Cumprimento de obrigação legal', desc: 'Para emissão de notas fiscais e obrigações tributárias.' },
              { base: 'Legítimo interesse', desc: 'Para prevenção de fraudes, segurança e melhoria dos serviços.' },
              { base: 'Consentimento', desc: 'Para envio de comunicações de marketing, quando aplicável.' },
            ].map((item) => (
              <li key={item.base} className="flex gap-3 text-sm">
                <span className="text-[#3cbfb3] font-bold shrink-0">•</span>
                <span className="text-gray-700">
                  <strong>{item.base}:</strong> {item.desc}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 4. Compartilhamento */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
            Compartilhamento de dados
          </h2>
          <p className="text-gray-600 mb-4">
            Não vendemos seus dados. Compartilhamos apenas quando necessário para a prestação dos serviços:
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2"><span className="text-[#3cbfb3] font-bold">•</span><span><strong>Transportadoras e serviços de frete</strong> (ex.: Melhor Envio, Correios): para entrega dos pedidos.</span></li>
            <li className="flex gap-2"><span className="text-[#3cbfb3] font-bold">•</span><span><strong>Processadoras de pagamento</strong>: para processar transações com segurança (PCI-DSS).</span></li>
            <li className="flex gap-2"><span className="text-[#3cbfb3] font-bold">•</span><span><strong>Serviços de nuvem e hospedagem</strong>: para armazenamento seguro dos dados.</span></li>
            <li className="flex gap-2"><span className="text-[#3cbfb3] font-bold">•</span><span><strong>Autoridades públicas</strong>: quando exigido por lei, ordem judicial ou regulação aplicável.</span></li>
          </ul>
          <p className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            Todos os terceiros que acessam seus dados estão obrigados a mantê-los em sigilo e utilizá-los apenas
            para as finalidades para as quais foram compartilhados.
          </p>
        </section>

        {/* 5. Cookies */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
            Cookies
          </h2>
          <p className="text-gray-600 mb-4">
            Utilizamos cookies para melhorar sua experiência de navegação. Os tipos de cookies que usamos:
          </p>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            {[
              { tipo: 'Essenciais', desc: 'Necessários para o funcionamento do site (sessão, carrinho, autenticação). Não podem ser desativados.' },
              { tipo: 'Analíticos', desc: 'Nos ajudam a entender como os usuários utilizam o site para melhorar a experiência.' },
              { tipo: 'Preferências', desc: 'Lembram suas configurações e preferências de navegação.' },
            ].map((c) => (
              <div key={c.tipo} className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{c.tipo}</h3>
                <p className="text-gray-500 text-sm">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Você pode configurar seu navegador para recusar cookies, mas isso pode afetar o funcionamento de algumas
            funcionalidades do site.
          </p>
        </section>

        {/* 6. Retenção */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">6</span>
            Retenção e eliminação dos dados
          </h2>
          <p className="text-gray-600 mb-3">
            Retemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política:
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2"><span className="text-[#3cbfb3]">•</span><span>Dados de conta ativa: enquanto a conta existir.</span></li>
            <li className="flex gap-2"><span className="text-[#3cbfb3]">•</span><span>Histórico de pedidos: mínimo de 5 anos (obrigação fiscal/tributária).</span></li>
            <li className="flex gap-2"><span className="text-[#3cbfb3]">•</span><span>Dados de navegação e cookies: até 2 anos.</span></li>
            <li className="flex gap-2"><span className="text-[#3cbfb3]">•</span><span>Após solicitação de exclusão: eliminação em até 15 dias úteis, salvo obrigação legal.</span></li>
          </ul>
        </section>

        {/* 7. Direitos do titular */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">7</span>
            Seus direitos como titular dos dados (LGPD, Art. 18)
          </h2>
          <p className="text-gray-600 mb-4">
            Você tem os seguintes direitos em relação aos seus dados pessoais:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { direito: 'Confirmação', desc: 'Confirmar se tratamos seus dados pessoais.' },
              { direito: 'Acesso', desc: 'Obter cópia dos seus dados que tratamos.' },
              { direito: 'Correção', desc: 'Corrigir dados incompletos, inexatos ou desatualizados.' },
              { direito: 'Anonimização ou eliminação', desc: 'Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.' },
              { direito: 'Portabilidade', desc: 'Solicitar a portabilidade dos seus dados a outro fornecedor de serviço.' },
              { direito: 'Revogação do consentimento', desc: 'Retirar o consentimento a qualquer momento, sem prejuízo de tratamentos anteriores.' },
              { direito: 'Oposição', desc: 'Opor-se ao tratamento realizado com base em outras hipóteses legais.' },
              { direito: 'Informação sobre compartilhamento', desc: 'Saber com quem compartilhamos seus dados.' },
            ].map((item) => (
              <div key={item.direito} className="flex gap-3 bg-[#e8f8f7] rounded-xl p-3 text-sm">
                <span className="text-[#3cbfb3] font-bold mt-0.5">✓</span>
                <span className="text-gray-700"><strong>{item.direito}:</strong> {item.desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Para exercer qualquer um desses direitos, entre em contato conosco pelo e-mail{' '}
            <a href="mailto:brasil.sixxis@gmail.com" className="text-[#3cbfb3] font-medium hover:underline">
              brasil.sixxis@gmail.com
            </a>
            . Responderemos em até <strong>15 dias úteis</strong>.
          </p>
        </section>

        {/* 8. Segurança */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">8</span>
            Segurança dos dados
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não
            autorizado, perda, alteração ou divulgação indevida, incluindo criptografia SSL/TLS, acesso restrito
            por função, monitoramento de segurança e backups regulares. Nenhum sistema é 100% seguro, mas nos
            comprometemos a notificá-lo em caso de incidente que possa afetar seus direitos.
          </p>
        </section>

        {/* 9. Alterações */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">9</span>
            Alterações nesta política
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Podemos atualizar esta Política de Privacidade periodicamente. Quando houver alterações relevantes,
            notificaremos por e-mail ou por aviso destacado em nosso site. A versão mais recente sempre estará
            disponível nesta página, com a data da última atualização.
          </p>
        </section>

        {/* Contato */}
        <section
          className="text-white rounded-2xl p-8 text-center"
          style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
        >
          <h2 className="text-xl font-bold mb-3">Encarregado de Dados (DPO)</h2>
          <p className="text-white/70 mb-4 text-sm leading-relaxed">
            Se tiver dúvidas sobre esta Política de Privacidade ou quiser exercer seus direitos como titular,
            entre em contato com nosso responsável pela proteção de dados:
          </p>
          <a
            href="mailto:brasil.sixxis@gmail.com"
            className="inline-block bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            brasil.sixxis@gmail.com
          </a>
          <p className="text-white/40 text-xs mt-4">
            Sixxis · CNPJ 54.978.947/0001-09 · R. Anhanguera, 1711 - Araçatuba, SP
          </p>
        </section>
      </div>
    </div>
  )
}
