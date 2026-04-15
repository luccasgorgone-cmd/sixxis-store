'use client'

interface LunaAvatarProps {
  size?: number
  className?: string
  animated?: boolean
}

// Avatar EXCLUSIVO da Luna — não aparece em AVATARES_PREDEFINIDOS.
// Mulher com cabelo preto curto liso, headset profissional, polo preta
// com logo Sixxis, sorriso sutil. Usado apenas nos componentes da Luna.
export function LunaAvatar({ size = 56, className = '', animated = true }: LunaAvatarProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        style={{ display: 'block' }}
      >
        {/* ── Fundo ── */}
        <rect width="200" height="200" fill="#0f2e2b" />

        {/* ── Ombros / polo preta ── */}
        <path d="M20 200 C20 155 50 145 100 142 C150 145 180 155 180 200 Z" fill="#111111" />
        {/* Gola polo */}
        <path d="M82 142 C82 142 90 148 100 148 C110 148 118 142 118 142 L113 135 C108 140 100 143 100 143 C100 143 92 140 87 135 Z" fill="#1a1a1a" />
        {/* Botões */}
        <circle cx="100" cy="148" r="2" fill="#2a2a2a" />
        <circle cx="100" cy="155" r="2" fill="#2a2a2a" />

        {/* ── Logo SIXXIS no peito ── */}
        <g transform="translate(125, 158)">
          <rect x="-12" y="-8" width="24" height="16" rx="3" fill="#3cbfb3" opacity="0.9" />
          <text
            x="0" y="4"
            textAnchor="middle"
            fontSize="7"
            fontWeight="900"
            fontFamily="system-ui,-apple-system,sans-serif"
            fill="#0f2e2b"
            letterSpacing="-0.3"
          >SIXXIS</text>
        </g>

        {/* ── Pescoço ── */}
        <path d="M88 128 L88 143 C88 143 93 148 100 148 C107 148 112 143 112 143 L112 128 Z" fill="#e8b89a" />

        {/* ── Cabeça ── */}
        <ellipse cx="100" cy="95" rx="40" ry="44" fill="#e8b89a" />

        {/* ── Cabelo curto bob preto ── */}
        <path d="M62 85 C62 55 138 55 138 85 L138 75 C138 50 62 50 62 75 Z" fill="#111111" />
        <path d="M62 75 C60 85 59 95 62 105 C64 110 67 112 70 110 C68 100 65 90 65 80 Z" fill="#111111" />
        <path d="M138 75 C140 85 141 95 138 105 C136 110 133 112 130 110 C132 100 135 90 135 80 Z" fill="#111111" />
        <path d="M62 80 C65 72 75 68 85 70 C78 70 70 74 67 82 Z" fill="#111111" />
        <ellipse cx="100" cy="58" rx="38" ry="22" fill="#111111" />
        <path d="M80 55 C85 52 90 51 95 52" stroke="#2a2a2a" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* ── Orelhas ── */}
        <ellipse cx="61" cy="98" rx="7" ry="9" fill="#e8b89a" />
        <ellipse cx="61" cy="98" rx="4" ry="6" fill="#d9a88a" opacity="0.5" />
        <ellipse cx="139" cy="98" rx="7" ry="9" fill="#e8b89a" />
        <ellipse cx="139" cy="98" rx="4" ry="6" fill="#d9a88a" opacity="0.5" />

        {/* ── Headset profissional ── */}
        <path d="M63 85 C63 55 137 55 137 85" stroke="#1a1a1a" strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="55" y="88" width="14" height="20" rx="6" fill="#222222" />
        <rect x="57" y="90" width="10" height="16" rx="5" fill="#3a3a3a" />
        <rect x="131" y="88" width="14" height="20" rx="6" fill="#222222" />
        <rect x="133" y="90" width="10" height="16" rx="5" fill="#3a3a3a" />
        <rect x="59" y="82" width="4" height="10" rx="2" fill="#333333" />
        <rect x="137" y="82" width="4" height="10" rx="2" fill="#333333" />
        {/* Braço e cápsula do microfone */}
        <path d="M145 96 C150 96 154 100 154 106" stroke="#222222" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="154" cy="109" rx="5" ry="6" fill="#1a1a1a" />
        <ellipse cx="154" cy="109" rx="3" ry="4" fill="#3cbfb3" opacity="0.8" />
        {/* LED ativo */}
        <circle cx="154" cy="107" r="1.5" fill="#3cbfb3">
          {animated && (
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          )}
        </circle>

        {/* ── Sobrancelhas ── */}
        <path d="M82 82 C85 79 90 78 94 80" stroke="#5a3825" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M106 80 C110 78 115 79 118 82" stroke="#5a3825" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* ── Olhos ── */}
        <ellipse cx="90" cy="95" rx="8" ry="9" fill="white" />
        <ellipse cx="91" cy="96" rx="5.5" ry="6" fill="#3d2814" />
        <ellipse cx="92" cy="96" rx="3.5" ry="4" fill="#1a0a00" />
        <ellipse cx="93.5" cy="93.5" rx="1.5" ry="1.5" fill="white" />
        <ellipse cx="89.5" cy="97" rx="0.8" ry="0.8" fill="white" opacity="0.6" />
        <path d="M83 90 C85 87 89 86 92 87" stroke="#2a1a0a" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        <ellipse cx="110" cy="95" rx="8" ry="9" fill="white" />
        <ellipse cx="109" cy="96" rx="5.5" ry="6" fill="#3d2814" />
        <ellipse cx="109" cy="96" rx="3.5" ry="4" fill="#1a0a00" />
        <ellipse cx="111.5" cy="93.5" rx="1.5" ry="1.5" fill="white" />
        <ellipse cx="107.5" cy="97" rx="0.8" ry="0.8" fill="white" opacity="0.6" />
        <path d="M108 87 C111 86 115 87 117 90" stroke="#2a1a0a" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* ── Nariz ── */}
        <path d="M98 104 C99 107 101 107 102 104" stroke="#c4906a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="96" cy="106" r="1.5" fill="#d9a87a" opacity="0.4" />
        <circle cx="104" cy="106" r="1.5" fill="#d9a87a" opacity="0.4" />

        {/* ── Sorriso suave ── */}
        <path d="M88 115 C91 120 97 123 100 123 C103 123 109 120 112 115" stroke="#c4705a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M90 113 C94 111 106 111 110 113" stroke="#d4806a" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
        <circle cx="84" cy="113" r="2" fill="#f0a090" opacity="0.4" />
        <circle cx="116" cy="113" r="2" fill="#f0a090" opacity="0.4" />

        {/* ── Piscar animado ── */}
        {animated && (
          <>
            <ellipse cx="90" cy="95" rx="8" ry="0" fill="#e8b89a" opacity="0">
              <animate attributeName="ry" values="0;9;0" dur="4s" begin="2s" repeatCount="indefinite"
                calcMode="spline" keySplines="0.5 0 0.5 1; 0.5 0 0.5 1" />
              <animate attributeName="opacity" values="0;1;0" dur="4s" begin="2s" repeatCount="indefinite"
                calcMode="spline" keySplines="0.5 0 0.5 1; 0.5 0 0.5 1" />
            </ellipse>
            <ellipse cx="110" cy="95" rx="8" ry="0" fill="#e8b89a" opacity="0">
              <animate attributeName="ry" values="0;9;0" dur="4s" begin="2s" repeatCount="indefinite"
                calcMode="spline" keySplines="0.5 0 0.5 1; 0.5 0 0.5 1" />
              <animate attributeName="opacity" values="0;1;0" dur="4s" begin="2s" repeatCount="indefinite"
                calcMode="spline" keySplines="0.5 0 0.5 1; 0.5 0 0.5 1" />
            </ellipse>
          </>
        )}
      </svg>
    </div>
  )
}

export function LunaAvatarMini({ size = 32 }: { size?: number }) {
  return <LunaAvatar size={size} animated={false} />
}
