import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export const metadata = {
  title: { default: 'Admin | Sixxis Store', template: '%s | Admin Sixxis' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
