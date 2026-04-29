import type { Metadata } from 'next'
import AdminLayoutSwitch from '@/components/admin/AdminLayoutSwitch'

export const metadata: Metadata = {
  title: {
    default:  'Painel Admin',
    template: '%s · Painel Admin · Sixxis',
  },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutSwitch>{children}</AdminLayoutSwitch>
}
