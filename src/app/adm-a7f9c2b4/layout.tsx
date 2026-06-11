import type { Metadata } from 'next'
import AdminLayoutSwitch from '@/components/admin/AdminLayoutSwitch'
import NoTrack from '@/components/admin/NoTrack'

export const metadata: Metadata = {
  title: {
    default:  'Painel Admin',
    template: '%s · Painel Admin · Sixxis',
  },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NoTrack />
      <AdminLayoutSwitch>{children}</AdminLayoutSwitch>
    </>
  )
}
