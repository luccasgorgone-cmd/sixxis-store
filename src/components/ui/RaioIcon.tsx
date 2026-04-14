interface RaioIconProps {
  size?: number
  comFundo?: boolean
  className?: string
}

export default function RaioIcon({ size = 20, comFundo = false, className = '' }: RaioIconProps) {
  if (comFundo) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-black/30 shadow-md ${className}`}
        style={{
          width: size * 1.8,
          height: size * 1.8,
          backgroundColor: '#3cbfb3',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
        fill="#3cbfb3"
        stroke="#000000"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
