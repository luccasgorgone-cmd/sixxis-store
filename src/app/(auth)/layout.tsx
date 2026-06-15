import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s — Sixxis', default: 'Sixxis' },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
