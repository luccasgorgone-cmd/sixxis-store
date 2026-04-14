interface Props {
  size?: number
  comFundo?: boolean
}

export default function RaioIcon({ size = 18, comFundo = false }: Props) {
  const svg = (
    <svg
      width={size}
      height={Math.round(size * 1.43)}
      viewBox="0 0 14 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {/* Glow amarelo */}
      <path
        d="M8.5 1.5L1.5 11.5H7L6 18.5L13 8.5H7.5L8.5 1.5Z"
        fill="#FFD700"
        opacity="0.3"
        transform="translate(0.5, 0.5)"
      />
      {/* Raio principal */}
      <path
        d="M8.5 1.5L1.5 11.5H7L6 18.5L13 8.5H7.5L8.5 1.5Z"
        fill="#FFD700"
        stroke="#111"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )

  if (comFundo) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#3cbfb3',
          border: '2px solid rgba(0,0,0,0.2)',
          borderRadius: '8px',
          padding: '4px 6px',
        }}
      >
        {svg}
      </div>
    )
  }

  return svg
}
