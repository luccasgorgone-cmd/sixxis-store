import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AvaliacoesParceirosRedirect() {
  redirect('/adm-a7f9c2b4/avaliacoes?tipo=parceiro')
}
