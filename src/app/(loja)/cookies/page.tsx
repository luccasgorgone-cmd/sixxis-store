import type { Metadata } from 'next'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { Cookie } from 'lucide-react'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Política de Cookies | Sixxis',
  description: 'Saiba como a Sixxis utiliza cookies para melhorar sua experiência de navegação.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Política de Cookies' }]} />

      {/* Hero */}
      <section className="py-16 px-4 text-white"
        style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#3cbfb3]/20 flex items-center justify-center mx-auto mb-5">
            <Cookie size={28} className="text-[#3cbfb3]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Política de Cookies</h1>
          <p className="text-white/65 text-sm max-w-xl mx-auto">
            Utilizamos cookies para melhorar sua experiência, personalizar conteúdo
            e analisar nosso tráfego, em conformidade com a LGPD.
          </p>
        </div>
      </section>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10 prose prose-sm max-w-none">

          <h2 className="text-lg font-extrabold text-gray-900 mb-3">O que são cookies?</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você acessa um site.
            Eles permitem que o site reconheça seu dispositivo em visitas futuras, melhorando sua experiência
            e possibilitando funcionalidades como manter o carrinho de compras e lembrar suas preferências.
          </p>

          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Como utilizamos cookies</h2>
          <div className="space-y-4 mb-6">
            {[
              {
                tipo: 'Cookies essenciais',
                desc: 'Necessários para o funcionamento básico do site. Permitem navegar e usar recursos como o carrinho de compras. Não podem ser desativados.',
                badge: 'Sempre ativos',
                badgeCor: '#16a34a',
              },
              {
                tipo: 'Cookies de desempenho',
                desc: 'Coletamos informações anônimas sobre como os visitantes usam o site (páginas mais visitadas, tempo de navegação) para melhorar continuamente a experiência.',
                badge: 'Opcionais',
                badgeCor: '#3cbfb3',
              },
              {
                tipo: 'Cookies de preferências',
                desc: 'Permitem que o site lembre suas configurações, como idioma e região, para oferecer uma experiência personalizada.',
                badge: 'Opcionais',
                badgeCor: '#8b5cf6',
              },
            ].map(item => (
              <div key={item.tipo} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-extrabold text-gray-900">{item.tipo}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: item.badgeCor }}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Como gerenciar cookies</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Você pode controlar e excluir cookies conforme desejar. Para isso, acesse as configurações
            do seu navegador. Lembre-se de que desativar certos cookies pode afetar o funcionamento
            do site.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {['Chrome', 'Firefox', 'Safari', 'Edge'].map(b => (
              <div key={b} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="text-xs font-bold text-gray-700">{b}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Configurações → Privacidade</p>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Cookies de terceiros</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Utilizamos serviços de terceiros que também podem utilizar cookies, incluindo:
            Google Analytics (análise de tráfego), Mercado Pago (processamento de pagamentos).
            Esses serviços possuem suas próprias políticas de privacidade.
          </p>

          <div className="bg-[#e8f8f7] border border-[#3cbfb3]/20 rounded-xl p-4">
            <p className="text-xs text-[#0f2e2b] leading-relaxed">
              <strong>Atualização:</strong> Esta política foi atualizada em janeiro de 2025.
              Para dúvidas, entre em contato: <a href="mailto:brasil.sixxis@gmail.com"
                className="text-[#3cbfb3] hover:underline">brasil.sixxis@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
