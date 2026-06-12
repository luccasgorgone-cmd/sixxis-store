import type { Metadata } from 'next'

// SEO próprio — a página é client component, então o metadata fica no layout.
export const metadata: Metadata = {
  title: 'Termo de Garantia',
  description:
    'Garantia Sixxis de 12 meses contra defeitos de fabricação, em conformidade com o CDC. Veja o que está coberto, como acionar e a garantia estendida disponível no checkout.',
  alternates: { canonical: '/garantia' },
}

export default function GarantiaLayout({ children }: { children: React.ReactNode }) {
  return children
}
