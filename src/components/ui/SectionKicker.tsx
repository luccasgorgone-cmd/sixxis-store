interface Props {
  texto:      string
  dark?:      boolean
  className?: string
}

export default function SectionKicker({ texto, dark = false, className = '' }: Props) {
  return (
    <p
      className={`text-base sm:text-lg font-black uppercase tracking-widest mb-1 ${className}`}
      style={{
        color:         '#3cbfb3',
        letterSpacing: '0.12em',
        opacity:       dark ? 1 : 0.95,
      }}
    >
      ── {texto} ──
    </p>
  )
}
