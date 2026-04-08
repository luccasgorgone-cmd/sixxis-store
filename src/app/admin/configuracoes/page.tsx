import { Settings } from 'lucide-react'

export const metadata = { title: 'Configurações' }

export default function ConfiguracoesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <Settings className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Configurações em breve</p>
      </div>
    </div>
  )
}
