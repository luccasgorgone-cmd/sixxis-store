'use client'

import { usePathname } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#0f1f1d] flex items-center justify-center">
        {children}
      </div>
    )
  }

  return (
    // h-screen + overflow-hidden garante que h-full da sidebar resolve corretamente
    // Sidebar é lg:static (flex child) — não precisa de wrapper com largura duplicada
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 min-w-0 overflow-auto">
        {children}
      </div>
    </div>
  )
}
