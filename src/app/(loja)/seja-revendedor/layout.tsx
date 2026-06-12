import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seja um Parceiro Sixxis',
  description:
    'Revenda a linha Sixxis de climatizadores, aspiradores e bikes spinning. Margem competitiva, suporte dedicado e produto certificado. Cadastro gratuito, sem taxa de adesão.',
  alternates: { canonical: '/seja-revendedor' },
}

export default function SejaRevendedorLayout({ children }: { children: React.ReactNode }) {
  return children
}
