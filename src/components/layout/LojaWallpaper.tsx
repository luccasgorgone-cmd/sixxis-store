'use client'

import { usePathname } from 'next/navigation'

interface Props {
  children: React.ReactNode
  wallpaperStyle: React.CSSProperties
  bgAtivo: boolean
  bgOverlay: number
}

const ROTAS_FUNDO_BRANCO = ['/ofertas']
// Home ('/') usa branco puro; a cor de texto base fica a cargo das classes
// de cada seção da home (gray-900/gray-500), por isso não força `color` aqui.
const ROTAS_FUNDO_BRANCO_PURO = ['/']

export default function LojaWallpaper({
  children, wallpaperStyle, bgAtivo, bgOverlay,
}: Props) {
  const pathname = usePathname() || ''
  const fundoBranco = ROTAS_FUNDO_BRANCO.includes(pathname)
  const fundoBrancoPuro = ROTAS_FUNDO_BRANCO_PURO.includes(pathname)

  const finalStyle: React.CSSProperties = fundoBrancoPuro
    ? { backgroundColor: '#ffffff' }
    : fundoBranco
    ? { backgroundColor: '#f9fafb', color: '#0f2e2b' }
    : wallpaperStyle

  const mostrarOverlay = !fundoBranco && !fundoBrancoPuro && bgAtivo && bgOverlay > 0

  return (
    <div className="relative min-h-screen" style={finalStyle}>
      {mostrarOverlay && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ backgroundColor: `rgba(0,0,0,${bgOverlay / 100})`, zIndex: 0 }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  )
}
