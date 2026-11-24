import type { Metadata } from 'next'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { Cookie } from 'lucide-react'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Saiba como a Sixxis utiliza cookies para melhorar sua experiência de navegação, em conformidade com a LGPD.',
  alternates: { canonical: '/cookies' },
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-sx-raised">
      <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Política de Cookies' }]} />

      {/* Hero */}
      <section className="sx-escuro py-16 px-4 text-white"
        style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-sx-accent/20 flex items-center justify-center mx-auto mb-5">
            <Cookie size={28} className="text-sx-accent-text" />
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
        <div className="bg-sx-surface rounded-2xl border border-sx-line shadow-sm p-8 sm:p-10 prose prose-sm max-w-none">

          <h2 className="text-lg font-extrabold text-sx-text mb-3">O que são cookies?</h2>
          <p className="text-sx-muted text-sm leading-relaxed mb-6">
            Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você acessa um site.
            Eles permitem que o site reconheça seu dispositivo em visitas futuras, melhorando sua experiência
            e possibilitando funcionalidades como manter o carrinho de compras e lembrar suas preferências.
          </p>

          <h2 className="text-lg font-extrabold text-sx-text mb-3">Como utilizamos cookies</h2>
          <div className="space-y-4 mb-6">
            {[
              {
                tipo: 'Cookies essenciais',
                desc: 'Necessários para o funcionamento básico do site. Permitem navegar e usar recursos como o carrinho de compras. Não podem ser desativados.',
                badge: 'Sempre ativos',
                badgeCor: '#15803d',
              },
              {
                tipo: 'Cookies de desempenho',
                desc: 'Coletamos informações anônimas sobre como os visitantes usam o site (páginas mais visitadas, tempo de navegação) para melhorar continuamente a experiência.',
                badge: 'Opcionais',
                badgeCor: 'var(--sx-accent-text)',
              },
              {
                tipo: 'Cookies de preferências',
                desc: 'Permitem que o site lembre suas configurações, como idioma e região, para oferecer uma experiência personalizada.',
                badge: 'Opcionais',
                badgeCor: '#6d28d9',
              },
            ].map(item => (
              <div key={item.tipo} className="bg-sx-raised rounded-xl p-4 border border-sx-line">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-extrabold text-sx-text">{item.tipo}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: item.badgeCor }}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-sx-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-extrabold text-sx-text mb-3">Como gerenciar cookies</h2>
          <p className="text-sx-muted text-sm leading-relaxed mb-4">
            Você pode controlar e excluir cookies conforme desejar. Para isso, acesse as configurações
            do seu navegador. Lembre-se de que desativar certos cookies pode afetar o funcionamento
            do site.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {['Chrome', 'Firefox', 'Safari', 'Edge'].map(b => (
              <div key={b} className="bg-sx-raised rounded-xl p-3 text-center border border-sx-line">
                <p className="text-xs font-bold text-sx-text-2">{b}</p>
                <p className="text-[10px] text-sx-subtle mt-0.5">Configurações → Privacidade</p>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-extrabold text-sx-text mb-3">Cookies de terceiros</h2>
          <p className="text-sx-muted text-sm leading-relaxed mb-6">
            Utilizamos serviços de terceiros que também podem utilizar cookies, incluindo:
            Google Analytics (análise de tráfego), Mercado Pago (processamento de pagamentos).
            Esses serviços possuem suas próprias políticas de privacidade.
          </p>

          <div className="bg-sx-tint border border-sx-accent/20 rounded-xl p-4">
            <p className="text-xs text-sx-text leading-relaxed">
              <strong>Atualização:</strong> Esta política foi atualizada em maio de 2026.
              Para dúvidas, entre em contato: <a href="mailto:sac@sixxis.com.br"
                className="text-sx-accent-text hover:underline">sac@sixxis.com.br</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
