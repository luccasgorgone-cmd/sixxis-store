'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import Image from 'next/image'
import AdminSidebar from './AdminSidebar'

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden bg-[#f8f9fa]">
      <AdminSidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Header mobile do admin (< lg) ── */}
        <div
          className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-white/10 shrink-0"
          style={{ backgroundColor: '#0f2e2b' }}
        >
          {/* Hambúrguer */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            aria-label="Abrir menu admin"
          >
            <Menu size={22} className="text-white" />
          </button>

          {/* Logo centralizada */}
          <Image
            src="/logo-sixxis.png"
            alt="Sixxis Admin"
            width={90}
            height={30}
            className="object-contain"
          />

          {/* Espaço para balancear o layout (espelho do hamburger) */}
          <div className="w-10" aria-hidden="true" />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  )
}
