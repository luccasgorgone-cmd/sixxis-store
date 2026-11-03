import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildPreviewDocument } from './preview-document'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Preview — Sixxis PDP Master V1',
  description: 'Preview interno do padrão candidato de página de produto Sixxis.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default async function PdpMasterPreviewPage() {
  const enabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_PDP_MASTER_PREVIEW === 'true'

  if (!enabled) notFound()

  const srcDoc = await buildPreviewDocument()

  return (
    <iframe
      title="Preview interno do padrão Sixxis PDP Master V1"
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-modals allow-forms"
      style={{
        display: 'block',
        width: '100%',
        height: '100dvh',
        border: 0,
        background: '#f4f6f5',
      }}
    />
  )
}
