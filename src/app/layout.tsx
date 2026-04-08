import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#3cbfb3',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'Sixxis Store — Climatizadores, Aspiradores e Spinning',
    template: '%s | Sixxis Store',
  },
  description:
    'Loja oficial Sixxis. Climatizadores, aspiradores, spinning e peças de reposição originais com entrega rápida para todo o Brasil.',
  keywords: ['climatizador', 'aspirador', 'spinning', 'sixxis', 'peças de reposição'],
  authors: [{ name: 'Sixxis' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Sixxis Store',
    title: 'Sixxis Store — Climatizadores, Aspiradores e Spinning',
    description:
      'Loja oficial Sixxis. Climatizadores, aspiradores, spinning e peças de reposição originais.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 font-[family-name:var(--font-inter)]">
        <SessionProvider>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}
