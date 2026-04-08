import TrustBar from '@/components/layout/TrustBar'
import WhatsAppButton from '@/components/layout/WhatsAppButton'

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TrustBar />
      {children}
      <WhatsAppButton />
    </>
  )
}
