import { redirect } from 'next/navigation'
import { ADMIN_BASE } from '@/lib/admin-path'

export const dynamic = 'force-dynamic'

export default function DashboardRedirect() {
  redirect(ADMIN_BASE)
}
