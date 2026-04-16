'use client'

interface LunaAvatarProps {
  size?: number
  className?: string
  animated?: boolean
}

// Avatar EXCLUSIVO da Luna — 3D clay render. Não está em AVATARES_PREDEFINIDOS.
// Mulher com cabelo preto bob, headset preto profissional com LED tiffany,
// polo preta com logo Sixxis, sorriso suave e olhos expressivos com profundidade.
export function LunaAvatar({ size = 56, className = '', animated = true }: LunaAvatarProps) {
  const id = `luna_${Math.random().toString(36).slice(2, 7)}`
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <radialGradient id={`${id}_face`} cx="42%" cy="32%" r="68%">
          <stop offset="0%"   stopColor="#FFE8D0" />
          <stop offset="45%"  stopColor="#F5C5A0" />
          <stop offset="80%"  stopColor="#E8A87C" />
          <stop offset="100%" stopColor="#D4915E" />
        </radialGradient>
        <radialGradient id={`${id}_hair`} cx="40%" cy="20%" r="70%">
          <stop offset="0%"   stopColor="#2a2a2a" />
          <stop offset="60%"  stopColor="#111111" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
        <linearGradient id={`${id}_hairshine`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%"   stopColor="#555" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#111" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}_body`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <radialGradient id={`${id}_bg`} cx="50%" cy="40%" r="65%">
          <stop offset="0%"   stopColor="#1a5a52" />
          <stop offset="100%" stopColor="#0a2820" />
        </radialGradient>
        <linearGradient id={`${id}_neck`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#E0A075" />
          <stop offset="40%"  stopColor="#F5C5A0" />
          <stop offset="100%" stopColor="#DFA070" />
        </linearGradient>
        <linearGradient id={`${id}_hs`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
        <radialGradient id={`${id}_iris`} cx="40%" cy="35%" r="70%">
          <stop offset="0%"   stopColor="#7a5030" />
          <stop offset="100%" stopColor="#2a1008" />
        </radialGradient>
        <radialGradient id={`${id}_blush`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FF9070" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FF6050" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}_shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.35" />
        </filter>
        <filter id={`${id}_softshadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.2" />
        </filter>
        <clipPath id={`${id}_circle`}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
      </defs>

      {/* Fundo */}
      <circle cx="100" cy="100" r="100" fill={`url(#${id}_bg)`} />
      <circle cx="100" cy="100" r="100" fill="none" stroke="rgba(60,191,179,0.08)" strokeWidth="40" />
      <circle cx="100" cy="100" r="70"  fill="none" stroke="rgba(60,191,179,0.05)" strokeWidth="30" />

      <g clipPath={`url(#${id}_circle)`}>
        {/* Corpo / polo */}
        <ellipse cx="100" cy="198" rx="70" ry="20" fill="rgba(0,0,0,0.4)" />
        <ellipse cx="100" cy="195" rx="72" ry="55" fill={`url(#${id}_body)`} />
        <ellipse cx="100" cy="180" rx="55" ry="38" fill="rgba(255,255,255,0.03)" />
        <path d="M88 147 L100 162 L112 147 Q100 154 88 147Z" fill="#0f0f0f" />
        <path d="M90 147 L100 160 L110 147" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />

        {/* Logo SIXXIS */}
        <rect x="116" y="168" width="26" height="14" rx="4" fill="#3cbfb3" opacity="0.95" />
        <rect x="117" y="169" width="24" height="12" rx="3" fill="#3cbfb3" opacity="0.3" />
        <text x="129" y="178.5" textAnchor="middle" fontSize="5.5" fontWeight="900"
          fontFamily="system-ui,-apple-system,Arial,sans-serif" fill="#0a2820" letterSpacing="-0.2">SIXXIS</text>

        {/* Pescoço */}
        <rect x="85" y="136" width="30" height="22" rx="12" fill={`url(#${id}_neck)`} filter={`url(#${id}_softshadow)`} />
        <ellipse cx="100" cy="157" rx="14" ry="4" fill="rgba(0,0,0,0.25)" />

        {/* Orelhas */}
        <ellipse cx="58" cy="103" rx="8" ry="10" fill="#E8B085" />
        <ellipse cx="59" cy="103" rx="5" ry="7" fill="#D49870" opacity="0.5" />
        <ellipse cx="59.5" cy="103" rx="2.5" ry="4" fill="#C07858" opacity="0.3" />
        <ellipse cx="142" cy="103" rx="8" ry="10" fill="#E8B085" />
        <ellipse cx="141" cy="103" rx="5" ry="7" fill="#D49870" opacity="0.5" />
        <ellipse cx="140.5" cy="103" rx="2.5" ry="4" fill="#C07858" opacity="0.3" />

        {/* Cabeça */}
        <ellipse cx="100" cy="97" rx="45" ry="49" fill={`url(#${id}_face)`} filter={`url(#${id}_shadow)`} />

        {/* Cabelo bob */}
        <ellipse cx="100" cy="63" rx="45" ry="32" fill={`url(#${id}_hair)`} />
        <path d="M55 82 C53 98 55 116 60 128 C63 134 61 132 59 126 C54 110 53 95 55 82Z" fill="#111" />
        <path d="M145 82 C147 98 145 116 140 128 C137 134 139 132 141 126 C146 110 147 95 145 82Z" fill="#111" />
        <path d="M59 126 C62 130 70 132 78 130" stroke="#111" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M141 126 C138 130 130 132 122 130" stroke="#111" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M58 80 C62 68 76 61 100 60 C124 61 138 68 142 80 C130 70 118 67 100 67 C82 67 70 70 58 80Z" fill="#0d0d0d" />
        <path d="M65 75 C70 69 80 66 90 67" stroke="#2a2a2a" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M78 59 C85 55 100 53 116 57" stroke={`url(#${id}_hairshine)`} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M82 62 C90 59 108 59 116 63" stroke="rgba(100,100,100,0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Headset */}
        <path d="M62 88 C62 48 138 48 138 88" stroke="#1c1c1c" strokeWidth="7" fill="none" strokeLinecap="round" filter={`url(#${id}_softshadow)`} />
        <path d="M64 88 C64 51 136 51 136 88" stroke="rgba(80,80,80,0.4)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="50" y="88" width="18" height="24" rx="8" fill={`url(#${id}_hs)`} filter={`url(#${id}_softshadow)`} />
        <rect x="52" y="90" width="14" height="20" rx="6" fill="#333" />
        <ellipse cx="59" cy="100" rx="5" ry="6" fill="#222" />
        <ellipse cx="59" cy="100" rx="3.5" ry="4.5" fill="#2a2a2a" />
        <path d="M52 91 C53 89 57 88 60 89" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <rect x="132" y="88" width="18" height="24" rx="8" fill={`url(#${id}_hs)`} filter={`url(#${id}_softshadow)`} />
        <rect x="134" y="90" width="14" height="20" rx="6" fill="#333" />
        <ellipse cx="141" cy="100" rx="5" ry="6" fill="#222" />
        <ellipse cx="141" cy="100" rx="3.5" ry="4.5" fill="#2a2a2a" />
        <path d="M134 91 C135 89 139 88 142 89" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <rect x="55" y="80" width="4" height="12" rx="2" fill="#2a2a2a" />
        <rect x="141" y="80" width="4" height="12" rx="2" fill="#2a2a2a" />

        {/* Microfone */}
        <path d="M150 97 C156 97 161 103 161 112" stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" filter={`url(#${id}_softshadow)`} />
        <path d="M152 97 C158 97 163 103 163 112" stroke="rgba(70,70,70,0.5)" strokeWidth="1" fill="none" strokeLinecap="round" />
        <ellipse cx="161" cy="116" rx="6" ry="6.5" fill="#1a1a1a" filter={`url(#${id}_softshadow)`} />
        <ellipse cx="161" cy="116" rx="4" ry="4.5" fill="#2a2a2a" />
        <circle cx="161" cy="114.5" r="2.5" fill="#3cbfb3" opacity="0.9">
          {animated && (
            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.5s" repeatCount="indefinite" />
          )}
        </circle>
        <circle cx="161" cy="114.5" r="1.2" fill="#7fefea" opacity="0.8" />

        {/* Sobrancelhas */}
        <path d="M79 89 C83 85.5 90 84.5 95 86.5" stroke="#3d1f08" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M79 89 C83 85.5 90 84.5 95 86.5" stroke="#5a3015" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M105 86.5 C110 84.5 117 85.5 121 89" stroke="#3d1f08" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M105 86.5 C110 84.5 117 85.5 121 89" stroke="#5a3015" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />

        {/* Olho esquerdo */}
        <ellipse cx="90" cy="100" rx="11" ry="12" fill="rgba(0,0,0,0.08)" />
        <ellipse cx="90" cy="99" rx="10" ry="11" fill="white" />
        <ellipse cx="90" cy="99" rx="10" ry="11" fill="rgba(180,140,100,0.08)" />
        <circle cx="90" cy="100" r="7" fill={`url(#${id}_iris)`} />
        <circle cx="90" cy="100" r="5" fill="#0d0500" />
        <ellipse cx="93" cy="96.5" rx="2.5" ry="2.5" fill="white" opacity="0.95" />
        <circle cx="87.5" cy="102" r="1.2" fill="white" opacity="0.5" />
        <path d="M81 93 C84 89 90 87 96 90" stroke="#1a0a00" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M82 106 C86 108 92 108 97 106" stroke="#8a5030" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4" />

        {/* Olho direito */}
        <ellipse cx="110" cy="100" rx="11" ry="12" fill="rgba(0,0,0,0.08)" />
        <ellipse cx="110" cy="99" rx="10" ry="11" fill="white" />
        <ellipse cx="110" cy="99" rx="10" ry="11" fill="rgba(180,140,100,0.08)" />
        <circle cx="110" cy="100" r="7" fill={`url(#${id}_iris)`} />
        <circle cx="110" cy="100" r="5" fill="#0d0500" />
        <ellipse cx="113" cy="96.5" rx="2.5" ry="2.5" fill="white" opacity="0.95" />
        <circle cx="107.5" cy="102" r="1.2" fill="white" opacity="0.5" />
        <path d="M104 90 C110 87 116 89 119 93" stroke="#1a0a00" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M103 106 C108 108 114 108 118 106" stroke="#8a5030" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4" />

        {/* Nariz */}
        <path d="M97 113 C98.5 117 101.5 117 103 113" stroke="#C07855" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7" />
        <circle cx="95.5" cy="115" r="1.8" fill="#C07855" opacity="0.25" />
        <circle cx="104.5" cy="115" r="1.8" fill="#C07855" opacity="0.25" />
        <ellipse cx="100" cy="117" rx="5" ry="2" fill="#D09060" opacity="0.15" />

        {/* Bochechas */}
        <ellipse cx="79" cy="114" rx="12" ry="9" fill={`url(#${id}_blush)`} />
        <ellipse cx="121" cy="114" rx="12" ry="9" fill={`url(#${id}_blush)`} />

        {/* Boca */}
        <ellipse cx="100" cy="126" rx="14" ry="5" fill="rgba(0,0,0,0.08)" />
        <path d="M87 124 C90 120 96 118 100 118 C104 118 110 120 113 124 C110 130 90 130 87 124Z" fill="#D4705A" />
        <path d="M87 124 C90 122 96 121 100 121 C104 121 110 122 113 124" stroke="#B85040" strokeWidth="0.7" fill="none" />
        <path d="M87 124 C90 129 110 129 113 124" stroke="#B85040" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        <path d="M90 124 Q100 123 110 124 Q110 126.5 100 126.5 Q90 126.5 90 124Z" fill="white" opacity="0.85" />
        <circle cx="84" cy="123" r="1.5" fill="#C06050" opacity="0.3" />
        <circle cx="116" cy="123" r="1.5" fill="#C06050" opacity="0.3" />

        <ellipse cx="100" cy="141" rx="28" ry="6" fill="rgba(0,0,0,0.12)" />

        {/* Piscar animado */}
        {animated && (
          <>
            <ellipse cx="90" cy="99" rx="10" ry="11" fill={`url(#${id}_face)`} opacity="0">
              <animate attributeName="ry" values="0;11;0" dur="5s" begin="2s" repeatCount="indefinite"
                calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
              <animate attributeName="opacity" values="0;1;0" dur="5s" begin="2s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="110" cy="99" rx="10" ry="11" fill={`url(#${id}_face)`} opacity="0">
              <animate attributeName="ry" values="0;11;0" dur="5s" begin="2s" repeatCount="indefinite"
                calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
              <animate attributeName="opacity" values="0;1;0" dur="5s" begin="2s" repeatCount="indefinite" />
            </ellipse>
          </>
        )}
      </g>
    </svg>
  )
}

export function LunaAvatarMini({ size = 40, animated = false }: { size?: number; animated?: boolean }) {
  return <LunaAvatar size={size} animated={animated} />
}
