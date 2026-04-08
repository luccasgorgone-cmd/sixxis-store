import Image from 'next/image'
import Link from 'next/link'
import { Mail, Phone, MapPin, ExternalLink, ShieldCheck } from 'lucide-react'
import PagamentosBar from './PagamentosBar'

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1 — Marca */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo-sixxis.png"
                alt="Sixxis"
                width={100}
                height={34}
                className="object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-sm leading-relaxed mb-3">
              Importação, Exportação e Comércio de produtos de alta qualidade para o seu lar e bem-estar.
            </p>
            <p className="text-xs text-gray-600">CNPJ: 54.978.947/0001-09</p>
          </div>

          {/* Col 2 — Produtos */}
          <div>
            <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Produtos</p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['Climatizadores', '/produtos?categoria=climatizadores'],
                ['Aspiradores',    '/produtos?categoria=aspiradores'],
                ['Spinning',       '/produtos?categoria=spinning'],
                ['Peças de Reposição', '/pecas'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-[#3cbfb3] transition">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Institucional */}
          <div>
            <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Institucional</p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['Quem Somos',         '/sobre'],
                ['FAQ',                '/faq'],
                ['Política de Troca',  '/politica-de-troca'],
                ['Privacidade',        '/privacidade'],
                ['Termo de Garantia',  '/garantia'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-[#3cbfb3] transition">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contato */}
          <div>
            <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Contato</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="mailto:brasil.sixxis@gmail.com" className="flex items-center gap-2 hover:text-[#3cbfb3] transition">
                  <Mail size={15} className="shrink-0" />
                  brasil.sixxis@gmail.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/5518999999999" className="flex items-center gap-2 hover:text-[#3cbfb3] transition">
                  <Phone size={15} className="shrink-0" />
                  (18) 99999-9999
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={15} className="shrink-0 mt-0.5" />
                Araçatuba, SP — Brasil
              </li>
            </ul>

            {/* Redes sociais */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://instagram.com/sixxis"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-700 hover:border-[#3cbfb3] hover:text-[#3cbfb3] transition"
              >
                <ExternalLink size={12} />
                Instagram
              </a>
              <a
                href="https://facebook.com/sixxis"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-700 hover:border-[#3cbfb3] hover:text-[#3cbfb3] transition"
              >
                <ExternalLink size={12} />
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Ícones de pagamento */}
      <div className="border-t border-gray-800 bg-[#111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <PagamentosBar />
        </div>
      </div>

      {/* Selos de segurança */}
      <div className="bg-[#111] border-t border-gray-800 py-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 font-medium shrink-0">Certificados e Segurança:</p>
          <div className="flex flex-wrap items-center justify-center gap-3">

            {/* Google Safe */}
            <div className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
              <ShieldCheck size={14} color="#34A853" strokeWidth={2.5} />
              <span className="text-xs text-gray-300 font-medium">Google Safe</span>
            </div>

            {/* Mercado Pago */}
            <div className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="11" fill="#009EE3"/>
                <ellipse cx="12" cy="12" rx="6" ry="4" fill="white"/>
                <circle cx="12" cy="12" r="2" fill="#009EE3"/>
              </svg>
              <span className="text-xs text-gray-300 font-medium">Mercado Pago</span>
            </div>

            {/* Loja Verificada */}
            <div className="flex items-center gap-1.5 bg-gray-800 border border-[#3cbfb3]/40 rounded-lg px-3 py-1.5">
              <ShieldCheck size={14} color="#3cbfb3" strokeWidth={2.5} />
              <span className="text-xs text-[#3cbfb3] font-medium">Loja Verificada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t-2 border-[#3cbfb3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Sixxis — Todos os direitos reservados
        </div>
      </div>
    </footer>
  )
}
