import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Honeypot: qualquer caminho /admin/* retorna 404. O painel real mudou de lugar.
export default function AdminHoneypot() {
  notFound()
}
