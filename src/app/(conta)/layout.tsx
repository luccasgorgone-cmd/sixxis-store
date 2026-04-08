import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s — Minha Conta | Sixxis Store', default: 'Minha Conta — Sixxis Store' },
  robots: { index: false },
}

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
