'use client'

import { usePathname } from 'next/navigation'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'
import { ADMIN_BASE } from '@/lib/admin-path'

export default function AdminLayoutSwitch({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === `${ADMIN_BASE}/login`) {
    return (
      <div className="min-h-screen bg-[#0f1f1d] flex items-center justify-center">
        {children}
      </div>
    )
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
