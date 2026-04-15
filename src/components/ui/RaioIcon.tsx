interface Props {
  size?: number
  className?: string
  comFundo?: boolean
  animate?: boolean
  mirror?: boolean
}

export default function RaioIcon({
  size = 26,
  comFundo = false,
  className = '',
  animate = true,
  mirror = false,
}: Props) {
  const animClass = animate ? 'raio-flash' : ''
  const mirrorStyle: React.CSSProperties = mirror ? { transform: 'scaleX(-1)' } : {}

  const svgEl = (
    <svg
      width={size}
      height={Math.round(size * 1.45)}
      viewBox="0 0 14 20"
      fill="none"
      style={mirrorStyle}
    >
      {/* Brilho/sombra atrás */}
      <path
        d="M8.5 1.5L1.5 11.5H7L6 18.5L13 8.5H7.5L8.5 1.5Z"
        fill="#FFD700"
        opacity="0.22"
        transform="translate(0.8, 0.8)"
      />
      {/* Raio principal */}
      <path
        d="M8.5 1.5L1.5 11.5H7L6 18.5L13 8.5H7.5L8.5 1.5Z"
        fill="#FFD700"
        stroke="#1a1a00"
        strokeWidth="1.1"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )

  if (comFundo) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-xl ${animClass} ${className}`}
        style={{
          width: size + 10,
          height: size + 14,
          backgroundColor: 'rgba(255,215,0,0.12)',
          border: '1px solid rgba(255,215,0,0.25)',
          flexShrink: 0,
        }}
      >
        {svgEl}
      </span>
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
