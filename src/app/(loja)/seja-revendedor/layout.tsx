import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seja um Revendedor',
  description:
    'Torne-se revendedor Sixxis e venda climatizadores, aspiradores e spinning com condições especiais. Cadastre-se no programa de parceiros e fale com a gente.',
  alternates: { canonical: '/seja-revendedor' },
}

export default function SejaRevendedorLayout({ children }: { children: React.ReactNode }) {
  return children
}
