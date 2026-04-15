interface Props {
  size?: number
  className?: string
  comFundo?: boolean
  animate?: boolean
  mirror?: boolean
}

export default function RaioIcon({
  size = 20,
  comFundo = false,
  className = '',
  animate = true,
  mirror = false,
}: Props) {
  const animClass = animate ? 'raio-flash' : ''
  const mirrorStyle: React.CSSProperties = mirror ? { transform: 'scaleX(-1)' } : {}

  const svgEl = (
    <svg
      width={size * 1.2}
      height={size * 1.2}
      viewBox="0 0 24 24"
      fill="none"
      style={mirrorStyle}
    >
      {/* Brilho/sombra atrás */}
      <path
        d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
        fill="#FFD700"
        opacity="0.2"
        transform="translate(0.6, 0.6)"
      />
      {/* Raio principal */}
      <path
        d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
        fill="#FFD700"
        stroke="#1a1a00"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )

  if (comFundo) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border-2 border-black/30 shadow-lg ${animClass} ${className}`}
        style={{
          width: size * 2.2,
          height: size * 2.2,
          backgroundColor: '#3cbfb3',
          boxShadow: '0 3px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          flexShrink: 0,
        }}
      >
        {svgEl}
      </div>
    )
  }

  return (
    <span
      className={`inline-flex items-center ${animClass} ${className}`}
      style={{ flexShrink: 0 }}
    >
      {svgEl}
    </span>
  )
}
