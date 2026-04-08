import WhatsAppButton from '@/components/layout/WhatsAppButton'

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <WhatsAppButton />
    </>
  )
}
