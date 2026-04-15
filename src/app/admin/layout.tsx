'use client'

import { usePathname } from 'next/navigation'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-[#0f1f1d] flex items-center justify-center">
        {children}
      </div>
    )
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
