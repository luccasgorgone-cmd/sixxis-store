import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre Nós',
  description:
    'Conheça a história da Sixxis: 30 anos levando qualidade e conforto para o Brasil. De uma importadora em Araçatuba-SP a mais de 1 milhão de clientes atendidos.',
  alternates: { canonical: '/sobre' },
}

export default function SobreLayout({ children }: { children: React.ReactNode }) {
  return children
}
