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
          <p className="text-white/50 text-sm mt-2">Última atualização: maio de 2026 — atualizamos esta página sempre que houver mudanças relevantes.</p>
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

        {/* 3. Compartilhamento — enxuto */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
            Compartilhamento de dados
          </h2>
          <p className="text-gray-600 mb-4">
            <strong>Não vendemos seus dados.</strong> Compartilhamos apenas com:
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2"><span className="text-[#3cbfb3] font-bold">•</span><span><strong>Transportadoras</strong> (Correios, Melhor Envio etc.) — para entregar seu pedido.</span></li>
            <li className="flex gap-2"><span className="text-[#3cbfb3] font-bold">•</span><span><strong>Processadoras de pagamento</strong> (Mercado Pago) — com proteção PCI-DSS.</span></li>
            <li className="flex gap-2"><span className="text-[#3cbfb3] font-bold">•</span><span><strong>Autoridades públicas</strong> — quando exigido por lei.</span></li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">
            Todos seguem cláusulas de sigilo e usam seus dados só para a finalidade contratada.
          </p>
        </section>

        {/* 4. Cookies — enxuto */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
            Cookies
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Usamos cookies <strong>essenciais</strong> (sessão, carrinho, autenticação),{' '}
            <strong>analíticos</strong> (entender como o site é usado) e{' '}
            <strong>de preferências</strong> (lembrar suas configurações). Você pode gerenciá-los
            nas configurações do seu navegador, mas isso pode afetar funcionalidades do site.
          </p>
        </section>

        {/* 5. Direitos LGPD — enxuto + retenção embutida */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
            Seus direitos (LGPD)
          </h2>
          <p className="text-gray-600 mb-4">
            Pela Lei Geral de Proteção de Dados (Art. 18), você pode a qualquer momento:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { direito: 'Acessar', desc: 'Solicitar cópia dos dados que tratamos.' },
              { direito: 'Corrigir', desc: 'Atualizar dados incompletos ou desatualizados.' },
              { direito: 'Eliminar', desc: 'Pedir exclusão dos seus dados (salvo obrigação legal).' },
              { direito: 'Portar', desc: 'Receber seus dados em formato estruturado.' },
            ].map((item) => (
              <div key={item.direito} className="flex gap-3 bg-[#e8f8f7] rounded-xl p-3 text-sm">
                <span className="text-[#3cbfb3] font-bold mt-0.5">✓</span>
                <span className="text-gray-700"><strong>{item.direito}:</strong> {item.desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Para exercer seus direitos, escreva para{' '}
            <a href="mailto:brasil.sixxis@gmail.com" className="text-[#3cbfb3] font-medium hover:underline">
              brasil.sixxis@gmail.com
            </a>
            . Respondemos em até <strong>15 dias úteis</strong>.
          </p>
          <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            Conservamos seus dados pelo tempo necessário às finalidades descritas
            (mínimo 5 anos para histórico fiscal). Após exclusão solicitada, dados são
            eliminados em até 15 dias úteis.
          </p>
        </section>

        {/* 6. Segurança + DPO (fundidos) */}
        <section
          className="text-white rounded-2xl p-8"
          style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-[#3cbfb3]/20 text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">6</span>
            Segurança e contato (DPO)
          </h2>
          <p className="text-white/75 leading-relaxed text-sm mb-5">
            Adotamos criptografia SSL/TLS, acesso restrito por função, monitoramento de
            segurança e backups regulares. Notificaremos você em caso de incidente que
            afete seus direitos.
          </p>

          <div className="bg-white/8 border border-white/15 rounded-xl p-5 backdrop-blur-sm">
            <p className="text-white/55 text-xs font-bold uppercase tracking-widest mb-2">
              Encarregado de Dados (DPO)
            </p>
            <a
              href="mailto:brasil.sixxis@gmail.com"
              className="inline-block bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              brasil.sixxis@gmail.com
            </a>
            <p className="text-white/50 text-xs mt-4 leading-relaxed">
              Sixxis · CNPJ 54.978.947/0001-09<br />
              R. Anhanguera, 1711 — Araçatuba, SP
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
