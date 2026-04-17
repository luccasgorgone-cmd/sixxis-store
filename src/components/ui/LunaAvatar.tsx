'use client'

interface LunaAvatarProps {
  size?: number
  className?: string
  animated?: boolean
}

export function LunaAvatar({ size = 56, className = '', animated = true }: LunaAvatarProps) {
  const u = `luna${size}`
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
        <radialGradient id={`${u}bg`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#1a5a52"/>
          <stop offset="100%" stopColor="#0a2820"/>
        </radialGradient>
        <radialGradient id={`${u}face`} cx="40%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#FFE4C8"/>
          <stop offset="45%" stopColor="#F5C09A"/>
          <stop offset="85%" stopColor="#E8A07A"/>
          <stop offset="100%" stopColor="#D4885A"/>
        </radialGradient>
        <radialGradient id={`${u}hair`} cx="38%" cy="18%" r="70%">
          <stop offset="0%" stopColor="#2e2e2e"/>
          <stop offset="60%" stopColor="#111"/>
          <stop offset="100%" stopColor="#050505"/>
        </radialGradient>
        <linearGradient id={`${u}body`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a"/>
          <stop offset="100%" stopColor="#0a0a0a"/>
        </linearGradient>
        <radialGradient id={`${u}iris`} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#6b4020"/>
          <stop offset="100%" stopColor="#1a0800"/>
        </radialGradient>
        <radialGradient id={`${u}blush`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF9070" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#FF5050" stopOpacity="0"/>
        </radialGradient>
        <filter id={`${u}sh`}>
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.30"/>
        </filter>
        <clipPath id={`${u}clip`}>
          <circle cx="100" cy="100" r="100"/>
        </clipPath>
      </defs>

      <circle cx="100" cy="100" r="100" fill={`url(#${u}bg)`}/>
      <circle cx="100" cy="100" r="100" fill="none"
        stroke="rgba(60,191,179,0.06)" strokeWidth="36"/>

      <g clipPath={`url(#${u}clip)`}>
        {/* Corpo — polo preta */}
        <ellipse cx="100" cy="198" rx="72" ry="55" fill={`url(#${u}body)`}/>
        <ellipse cx="100" cy="182" rx="52" ry="36" fill="rgba(255,255,255,0.03)"/>
        {/* Gola V */}
        <path d="M88 148 L100 163 L112 148 Q100 155 88 148Z" fill="#0f0f0f"/>
        {/* Logo SIXXIS */}
        <rect x="115" y="167" width="28" height="15" rx="4" fill="#3cbfb3" opacity="0.92"/>
        <text x="129" y="177.5" textAnchor="middle" fontSize="5.8" fontWeight="900"
          fontFamily="system-ui,-apple-system,Arial,sans-serif"
          fill="#062220" letterSpacing="-0.2">SIXXIS</text>
        {/* Pescoço */}
        <rect x="86" y="136" width="28" height="22" rx="12" fill="#F0AE85"/>
        <ellipse cx="100" cy="157" rx="12" ry="4" fill="rgba(0,0,0,0.18)"/>
        {/* Orelhas */}
        <ellipse cx="58" cy="102" rx="8" ry="10" fill="#EDB082"/>
        <ellipse cx="59.5" cy="102" rx="5" ry="7" fill="#D4946A" opacity="0.5"/>
        <ellipse cx="142" cy="102" rx="8" ry="10" fill="#EDB082"/>
        <ellipse cx="140.5" cy="102" rx="5" ry="7" fill="#D4946A" opacity="0.5"/>
        {/* Cabeça */}
        <ellipse cx="100" cy="96" rx="45" ry="49"
          fill={`url(#${u}face)`} filter={`url(#${u}sh)`}/>

        {/* CABELO PRETO BOB LISO */}
        <ellipse cx="100" cy="62" rx="45" ry="29" fill={`url(#${u}hair)`}/>
        <path d="M56 82C54 96 55 116 60 128C58 120 54 100 56 82Z" fill="#111"/>
        <path d="M144 82C146 96 145 116 140 128C142 120 146 100 144 82Z" fill="#111"/>
        <path d="M60 128C64 133 76 135 100 134C124 135 136 133 140 128"
          stroke="#111" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <path d="M60 79C64 68 78 62 100 61C122 62 136 68 140 79
                 C128 70 114 67 100 67C86 67 72 70 60 79Z"
          fill="#0d0d0d"/>
        <path d="M80 59C88 55 108 55 120 60"
          stroke="#3a3a3a" strokeWidth="4" fill="none"
          strokeLinecap="round" opacity="0.55"/>

        {/* HEADSET PROFISSIONAL */}
        <path d="M63 86C63 46 137 46 137 86"
          stroke="#1c1c1c" strokeWidth="7"
          fill="none" strokeLinecap="round" filter={`url(#${u}sh)`}/>
        <path d="M65 86C65 49 135 49 135 86"
          stroke="rgba(80,80,80,0.38)" strokeWidth="2"
          fill="none" strokeLinecap="round"/>
        {/* Cup esquerdo */}
        <rect x="50" y="87" width="18" height="24" rx="8"
          fill="#1e1e1e" filter={`url(#${u}sh)`}/>
        <rect x="52" y="89" width="14" height="20" rx="6" fill="#2e2e2e"/>
        <ellipse cx="59" cy="99" rx="4.5" ry="5.5" fill="#1a1a1a"/>
        <path d="M52 90C53.5 88 57 87 60 88"
          stroke="rgba(255,255,255,0.11)" strokeWidth="1.5"
          fill="none" strokeLinecap="round"/>
        {/* Cup direito */}
        <rect x="132" y="87" width="18" height="24" rx="8"
          fill="#1e1e1e" filter={`url(#${u}sh)`}/>
        <rect x="134" y="89" width="14" height="20" rx="6" fill="#2e2e2e"/>
        <ellipse cx="141" cy="99" rx="4.5" ry="5.5" fill="#1a1a1a"/>
        <path d="M134 90C135.5 88 139 87 142 88"
          stroke="rgba(255,255,255,0.11)" strokeWidth="1.5"
          fill="none" strokeLinecap="round"/>
        {/* Hastes */}
        <rect x="55" y="79" width="4" height="11" rx="2" fill="#252525"/>
        <rect x="141" y="79" width="4" height="11" rx="2" fill="#252525"/>

        {/* MICROFONE + LED TIFFANY */}
        <path d="M150 96C156 96 162 102 162 112"
          stroke="#1a1a1a" strokeWidth="3.5"
          fill="none" strokeLinecap="round"/>
        <ellipse cx="162" cy="116" rx="5.5" ry="6"
          fill="#1a1a1a" filter={`url(#${u}sh)`}/>
        <ellipse cx="162" cy="116" rx="3.5" ry="4.5" fill="#2a2a2a"/>
        <circle cx="162" cy="114" r="2.5" fill="#3cbfb3" opacity="0.9">
          {animated && (
            <animate attributeName="opacity"
              values="0.9;0.3;0.9" dur="2.4s"
              repeatCount="indefinite"/>
          )}
        </circle>
        <circle cx="162" cy="114" r="1.2" fill="#8fefea" opacity="0.9"/>

        {/* SOBRANCELHAS */}
        <path d="M80 88C84 84.5 91 83.5 96 85.5"
          stroke="#3d1f08" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        <path d="M104 85.5C109 83.5 116 84.5 120 88"
          stroke="#3d1f08" strokeWidth="2.8" fill="none" strokeLinecap="round"/>

        {/* OLHOS com reflexos 3D */}
        <ellipse cx="90" cy="98" rx="9.5" ry="10.5" fill="white"/>
        <circle cx="90" cy="98" r="7" fill={`url(#${u}iris)`}/>
        <circle cx="90" cy="98" r="5" fill="#0d0500"/>
        <ellipse cx="93.5" cy="94.5" rx="2.5" ry="2.5" fill="white" opacity="0.96"/>
        <circle cx="87.5" cy="100" r="1.2" fill="white" opacity="0.5"/>
        <path d="M82 91C85 87 91 85.5 96 88.5"
          stroke="#1a0800" strokeWidth="2" fill="none" strokeLinecap="round"/>

        <ellipse cx="110" cy="98" rx="9.5" ry="10.5" fill="white"/>
        <circle cx="110" cy="98" r="7" fill={`url(#${u}iris)`}/>
        <circle cx="110" cy="98" r="5" fill="#0d0500"/>
        <ellipse cx="113.5" cy="94.5" rx="2.5" ry="2.5" fill="white" opacity="0.96"/>
        <circle cx="107.5" cy="100" r="1.2" fill="white" opacity="0.5"/>
        <path d="M104 88.5C109 85.5 115 87 118 91"
          stroke="#1a0800" strokeWidth="2" fill="none" strokeLinecap="round"/>

        {/* NARIZ */}
        <path d="M97 112C98.5 116 101.5 116 103 112"
          stroke="#C07855" strokeWidth="1.8" fill="none"
          strokeLinecap="round" opacity="0.7"/>
        <circle cx="95.5" cy="114" r="1.8" fill="#C07855" opacity="0.22"/>
        <circle cx="104.5" cy="114" r="1.8" fill="#C07855" opacity="0.22"/>

        {/* BOCHECHAS */}
        <ellipse cx="79" cy="113" rx="12" ry="9" fill={`url(#${u}blush)`}/>
        <ellipse cx="121" cy="113" rx="12" ry="9" fill={`url(#${u}blush)`}/>

        {/* SORRISO natural */}
        <path d="M88 122C91 118 97 116 100 116C103 116 109 118 112 122
                 C109 128 91 128 88 122Z" fill="#C8685A"/>
        <path d="M88 122C91 120 97 119 100 119C103 119 109 120 112 122"
          stroke="#AE4A3C" strokeWidth="0.8" fill="none"/>
        <path d="M88 122C91 127 109 127 112 122"
          stroke="#AE4A3C" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
        <path d="M91 122 Q100 121 109 122 Q109 124.5 100 124.5 Q91 124.5 91 122Z"
          fill="white" opacity="0.82"/>
        <circle cx="85" cy="122" r="1.5" fill="#B85A4A" opacity="0.28"/>
        <circle cx="115" cy="122" r="1.5" fill="#B85A4A" opacity="0.28"/>

        {/* PISCAR ANIMADO */}
        {animated && (
          <>
            <ellipse cx="90" cy="97" rx="9.5" ry="10.5"
              fill={`url(#${u}face)`} opacity="0">
              <animate attributeName="ry"
                values="0;10.5;0" dur="5s" begin="2.5s"
                repeatCount="indefinite" calcMode="spline"
                keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
              <animate attributeName="opacity"
                values="0;1;0" dur="5s" begin="2.5s"
                repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="110" cy="97" rx="9.5" ry="10.5"
              fill={`url(#${u}face)`} opacity="0">
              <animate attributeName="ry"
                values="0;10.5;0" dur="5s" begin="2.5s"
                repeatCount="indefinite" calcMode="spline"
                keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
              <animate attributeName="opacity"
                values="0;1;0" dur="5s" begin="2.5s"
                repeatCount="indefinite"/>
            </ellipse>
          </>
        )}
      </g>
    </svg>
  )
}

export function LunaAvatarMini({ size = 40, animated = false }: { size?: number; animated?: boolean }) {
  return <LunaAvatar size={size} animated={animated}/>
}
