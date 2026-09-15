import type { Metadata } from 'next'
import { Trash2 } from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Instruções para Exclusão de Dados',
  description: 'Saiba como solicitar a exclusão dos seus dados pessoais na Sixxis, em conformidade com a LGPD.',
  alternates: { canonical: '/exclusao-de-dados' },
}

export default function ExclusaoDeDadosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Exclusão de Dados' }]} />
      {/* Hero */}
      <section
        className="text-white py-16 px-4"
        style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#3cbfb3]/20 flex items-center justify-center mx-auto mb-5">
            <Trash2 size={32} className="text-[#3cbfb3]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Instruções para Exclusão de Dados</h1>
          <p className="text-white/70 text-lg">Como solicitar a exclusão dos seus dados pessoais, em conformidade com a LGPD</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">

        {/* 1. Como solicitar */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
            Como solicitar a exclusão
          </h2>
          <p className="text-gray-600 mb-4">
            Para solicitar a exclusão dos seus dados pessoais da Sixxis, envie um e-mail para{' '}
            <a href="mailto:sac@sixxis.com.br" className="text-[#3cbfb3] font-medium hover:underline">
              sac@sixxis.com.br
            </a>{' '}
            com o assunto <strong>&quot;Exclusão de dados&quot;</strong>, informando:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
            <li>O e-mail cadastrado na sua conta ou usado na compra</li>
            <li>Seu nome completo</li>
            <li>Se possível, o número de um pedido feito na Sixxis (facilita a localização do seu cadastro)</li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">
            Usamos essas informações só para confirmar sua identidade antes de excluir qualquer dado —
            isso evita que terceiros peçam a exclusão da conta de outra pessoa.
          </p>
        </section>

        {/* 2. O que é apagado / o que é retido */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
            O que é excluído e o que é retido
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#e8f8f7] rounded-xl p-4">
              <h3 className="font-semibold text-[#0f2e2b] text-sm mb-2">Excluído</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                <li>Dados de cadastro (nome, e-mail, telefone, endereço)</li>
                <li>Histórico de navegação e cookies associados à sua conta</li>
                <li>Preferências e dados de sessão</li>
              </ul>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <h3 className="font-semibold text-amber-800 text-sm mb-2">Retido por obrigação legal</h3>
              <ul className="list-disc list-inside text-amber-700 space-y-1 text-sm">
                <li>Notas fiscais e dados de transações, pelo prazo fiscal exigido por lei (mínimo 5 anos)</li>
                <li>Registros necessários para cumprir obrigações contábeis, tributárias ou de defesa em processos</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Dados retidos por obrigação legal ficam armazenados apenas pelo prazo exigido e com acesso
            restrito — não são mais usados para nenhuma outra finalidade (marketing, análise, etc.).
          </p>
        </section>

        {/* 3. Prazo */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f2e2b] mb-4 flex items-center gap-2">
            <span className="bg-[#e8f8f7] text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
            Prazo de conclusão
          </h2>
          <p className="text-gray-600">
            Confirmamos o recebimento da sua solicitação e concluímos a exclusão dos dados elegíveis em
            até <strong>15 dias úteis</strong>, conforme o prazo já praticado na nossa{' '}
            <a href="/privacidade" className="text-[#3cbfb3] font-medium hover:underline">
              Política de Privacidade
            </a>.
          </p>
        </section>

        {/* 4. Contato */}
        <section
          className="text-white rounded-2xl p-8"
          style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-[#3cbfb3]/20 text-[#3cbfb3] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
            Canal de contato
          </h2>
          <p className="text-white/75 leading-relaxed text-sm mb-5">
            Dúvidas sobre seus dados pessoais ou sobre esta solicitação podem ser enviadas para o mesmo
            canal do nosso Encarregado de Dados (DPO).
          </p>
          <div className="bg-white/8 border border-white/15 rounded-xl p-5 backdrop-blur-sm">
            <a
              href="mailto:sac@sixxis.com.br"
              className="inline-block bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              sac@sixxis.com.br
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
