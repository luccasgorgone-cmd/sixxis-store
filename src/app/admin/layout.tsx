import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = {
  title: { default: 'Admin | Sixxis Store', template: '%s | Admin Sixxis' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden bg-[#f8f9fa]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  )
}
