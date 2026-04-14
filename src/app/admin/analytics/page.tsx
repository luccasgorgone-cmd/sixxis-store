import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'

export const metadata = { title: 'Analytics — Admin Sixxis' }

export default function AdminAnalyticsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Comportamento dos visitantes em tempo real
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  )
}
