interface Props {
  texto:      string
  dark?:      boolean
  className?: string
}

export default function SectionKicker({ texto, className = '' }: Props) {
  return (
    <p className={`mb-2 text-xs font-bold uppercase tracking-[0.14em] text-sx-accent-text ${className}`}>
      {texto}
    </p>
  )
}
