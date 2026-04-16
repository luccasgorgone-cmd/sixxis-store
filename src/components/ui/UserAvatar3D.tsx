'use client'

export interface UserAvatarConfig {
  id: string
  label: string
  skinTone: 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark'
  hairColor: 'black' | 'dark-brown' | 'brown' | 'auburn' | 'blonde'
  hairStyle: 'short-straight' | 'bob' | 'ponytail' | 'curly-short' | 'long-straight' | 'bun'
  shirtColor: string
  shirtAccent: string
  bgColor: string
  bgColor2: string
}

const SKIN_PALETTES = {
  'light':        { base: '#FFE8D5', mid: '#F5C8A8', shadow: '#E8A87C', deep: '#D4885A' },
  'medium-light': { base: '#FFD9B8', mid: '#F0B888', shadow: '#D99060', deep: '#C07038' },
  'medium':       { base: '#EEBB90', mid: '#D49060', shadow: '#C07040', deep: '#A85028' },
  'medium-dark':  { base: '#D4956A', mid: '#B87040', shadow: '#905020', deep: '#703010' },
  'dark':         { base: '#A06840', mid: '#7A4820', shadow: '#5A3010', deep: '#3A1808' },
}

const HAIR_COLORS = {
  'black':      { base: '#111', mid: '#222', highlight: '#444' },
  'dark-brown': { base: '#1a0d00', mid: '#2d1a08', highlight: '#4a2a10' },
  'brown':      { base: '#3d1a00', mid: '#5a2e0a', highlight: '#7a4420' },
  'auburn':     { base: '#4a1a00', mid: '#6a2a08', highlight: '#8a3a18' },
  'blonde':     { base: '#7a5010', mid: '#9a7025', highlight: '#c8a04a' },
}

export function UserAvatar3D({ config, size = 56 }: { config: UserAvatarConfig; size?: number }) {
  const uid = `ua_${config.id}_${Math.random().toString(36).slice(2, 5)}`
  const skin = SKIN_PALETTES[config.skinTone]
  const hair = HAIR_COLORS[config.hairColor]

  const renderHair = () => {
    switch (config.hairStyle) {
      case 'short-straight':
        return (
          <>
            <ellipse cx="100" cy="65" rx="44" ry="28" fill={hair.base} />
            <path d="M56 84 C54 96 56 108 60 116 C58 110 55 96 56 84Z" fill={hair.base} />
            <path d="M144 84 C146 96 144 108 140 116 C142 110 145 96 144 84Z" fill={hair.base} />
            <path d="M60 80 C64 68 76 62 100 61 C124 62 136 68 140 80 C128 71 116 68 100 68 C84 68 72 71 60 80Z" fill={hair.mid} />
            <path d="M80 60 C88 56 106 56 118 61" stroke={hair.highlight} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
          </>
        )
      case 'bob':
        return (
          <>
            <ellipse cx="100" cy="65" rx="44" ry="28" fill={hair.base} />
            <path d="M56 84 C54 100 56 118 62 128 C60 120 54 102 56 84Z" fill={hair.base} />
            <path d="M144 84 C146 100 144 118 138 128 C140 120 146 102 144 84Z" fill={hair.base} />
            <path d="M62 128 C70 132 84 134 100 133 C116 134 130 132 138 128" stroke={hair.base} strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M60 80 C64 68 78 62 100 61 C122 62 136 68 140 80 C128 71 114 68 100 68 C86 68 72 71 60 80Z" fill={hair.mid} />
            <path d="M80 60 C90 57 110 57 120 61" stroke={hair.highlight} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.55" />
          </>
        )
      case 'ponytail':
        return (
          <>
            <ellipse cx="100" cy="65" rx="44" ry="28" fill={hair.base} />
            <path d="M57 84 C56 92 57 102 60 108 C58 100 56 90 57 84Z" fill={hair.base} />
            <path d="M143 84 C144 92 143 102 140 108 C142 100 144 90 143 84Z" fill={hair.base} />
            <path d="M108 57 C120 55 136 60 140 75 C136 82 128 90 120 92 C128 85 132 76 130 68 C126 60 116 58 108 57Z" fill={hair.mid} />
            <path d="M115 60 C122 62 130 70 128 80 C126 86 122 90 116 93" stroke={hair.highlight} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
            <circle cx="115" cy="60" r="5" fill={hair.base} />
            <circle cx="115" cy="60" r="3" fill={hair.mid} />
            <path d="M60 80 C65 69 80 63 100 62" stroke={hair.mid} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
            <path d="M78 59 C88 56 106 56 118 60" stroke={hair.highlight} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5" />
          </>
        )
      case 'curly-short':
        return (
          <>
            <ellipse cx="100" cy="62" rx="47" ry="30" fill={hair.base} />
            {[
              [68, 62, 10, 8], [82, 55, 10, 8], [98, 52, 10, 8], [114, 55, 10, 8], [130, 62, 10, 8],
              [60, 75, 8, 7], [75, 70, 9, 7], [92, 67, 8, 7], [108, 67, 8, 7], [124, 70, 9, 7], [140, 75, 8, 7],
              [56, 88, 8, 6], [70, 85, 7, 6], [138, 88, 8, 6], [130, 85, 7, 6],
            ].map(([cx, cy, rx, ry], i) => (
              <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry}
                fill={i % 3 === 0 ? hair.mid : hair.base} opacity="0.9" />
            ))}
            <circle cx="95" cy="58" r="4" fill={hair.highlight} opacity="0.4" />
            <circle cx="108" cy="55" r="3" fill={hair.highlight} opacity="0.3" />
          </>
        )
      case 'long-straight':
        return (
          <>
            <ellipse cx="100" cy="65" rx="44" ry="28" fill={hair.base} />
            <path d="M56 84 C52 110 54 140 60 158 C56 140 52 110 56 84Z" fill={hair.base} />
            <path d="M144 84 C148 110 146 140 140 158 C144 140 148 110 144 84Z" fill={hair.base} />
            <path d="M60 80 C64 68 78 62 100 61 C122 62 136 68 140 80 C128 71 114 68 100 68 C86 68 72 71 60 80Z" fill={hair.mid} />
            <path d="M78 59 C88 56 110 56 122 60" stroke={hair.highlight} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.5" />
          </>
        )
      case 'bun':
        return (
          <>
            <ellipse cx="100" cy="68" rx="44" ry="25" fill={hair.base} />
            <path d="M57 85 C56 96 57 108 60 116 C58 108 56 95 57 85Z" fill={hair.base} />
            <path d="M143 85 C144 96 143 108 140 116 C142 108 144 95 143 85Z" fill={hair.base} />
            <ellipse cx="100" cy="50" rx="22" ry="18" fill={hair.mid} />
            <ellipse cx="100" cy="50" rx="18" ry="14" fill={hair.base} />
            <ellipse cx="97" cy="46" rx="8" ry="5" fill={hair.highlight} opacity="0.3" />
            <ellipse cx="100" cy="63" rx="18" ry="5" fill={hair.mid} />
            <path d="M78 59 C88 57 112 57 122 59" stroke={hair.highlight} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
          </>
        )
      default:
        return <ellipse cx="100" cy="65" rx="44" ry="28" fill={hair.base} />
    }
  }

  const eyebrowColor = config.hairColor === 'black' ? '#2a1000' : hair.base

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <radialGradient id={`${uid}_bg`} cx="50%" cy="40%" r="65%">
          <stop offset="0%"   stopColor={config.bgColor} />
          <stop offset="100%" stopColor={config.bgColor2} />
        </radialGradient>
        <radialGradient id={`${uid}_face`} cx="40%" cy="30%" r="70%">
          <stop offset="0%"   stopColor={skin.base} />
          <stop offset="50%"  stopColor={skin.mid} />
          <stop offset="85%"  stopColor={skin.shadow} />
          <stop offset="100%" stopColor={skin.deep} />
        </radialGradient>
        <linearGradient id={`${uid}_shirt`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={config.shirtColor} />
          <stop offset="100%" stopColor={config.shirtAccent} />
        </linearGradient>
        <radialGradient id={`${uid}_blush`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FF9070" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FF6050" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}_sh`}>
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
        </filter>
        <clipPath id={`${uid}_clip`}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
      </defs>

      <circle cx="100" cy="100" r="100" fill={`url(#${uid}_bg)`} />
      <circle cx="100" cy="100" r="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="30" />

      <g clipPath={`url(#${uid}_clip)`}>
        {/* Body */}
        <ellipse cx="100" cy="195" rx="72" ry="55" fill={`url(#${uid}_shirt)`} />
        <ellipse cx="100" cy="180" rx="55" ry="35" fill="rgba(255,255,255,0.05)" />
        <path d="M88 148 L100 163 L112 148 Q100 156 88 148Z" fill={config.shirtAccent} />

        {/* Neck */}
        <rect x="86" y="137" width="28" height="22" rx="11" fill={skin.mid} />
        <ellipse cx="100" cy="157" rx="13" ry="4" fill="rgba(0,0,0,0.18)" />

        {/* Ears */}
        <ellipse cx="58" cy="104" rx="8" ry="10" fill={skin.mid} />
        <ellipse cx="59" cy="104" rx="5" ry="7" fill={skin.shadow} opacity="0.5" />
        <ellipse cx="142" cy="104" rx="8" ry="10" fill={skin.mid} />
        <ellipse cx="141" cy="104" rx="5" ry="7" fill={skin.shadow} opacity="0.5" />

        {/* Face */}
        <ellipse cx="100" cy="98" rx="45" ry="49" fill={`url(#${uid}_face)`} filter={`url(#${uid}_sh)`} />

        {renderHair()}

        {/* Eyebrows */}
        <path d="M79 90 C83 86 91 85 96 87" stroke={eyebrowColor} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d="M104 87 C109 85 117 86 121 90" stroke={eyebrowColor} strokeWidth="2.8" fill="none" strokeLinecap="round" />

        {/* Left eye */}
        <ellipse cx="90" cy="100" rx="10" ry="11" fill="white" />
        <circle cx="90" cy="101" r="7" fill="#3d1a00" />
        <circle cx="90" cy="101" r="5" fill="#0d0500" />
        <ellipse cx="93" cy="97.5" rx="2.5" ry="2.5" fill="white" opacity="0.95" />
        <circle cx="87.5" cy="103" r="1.2" fill="white" opacity="0.5" />
        <path d="M81 94 C84 90 91 88 97 91" stroke="#1a0800" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Right eye */}
        <ellipse cx="110" cy="100" rx="10" ry="11" fill="white" />
        <circle cx="110" cy="101" r="7" fill="#3d1a00" />
        <circle cx="110" cy="101" r="5" fill="#0d0500" />
        <ellipse cx="113" cy="97.5" rx="2.5" ry="2.5" fill="white" opacity="0.95" />
        <circle cx="107.5" cy="103" r="1.2" fill="white" opacity="0.5" />
        <path d="M103 91 C109 88 116 90 119 94" stroke="#1a0800" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Nose */}
        <path d="M97 114 C98.5 118 101.5 118 103 114" stroke={skin.shadow} strokeWidth="1.7" fill="none" strokeLinecap="round" opacity="0.7" />
        <circle cx="95.5" cy="116" r="1.8" fill={skin.shadow} opacity="0.25" />
        <circle cx="104.5" cy="116" r="1.8" fill={skin.shadow} opacity="0.25" />

        {/* Blush */}
        <ellipse cx="79" cy="115" rx="12" ry="9" fill={`url(#${uid}_blush)`} />
        <ellipse cx="121" cy="115" rx="12" ry="9" fill={`url(#${uid}_blush)`} />

        {/* Smile */}
        <path d="M87 125 C90 121 96 119 100 119 C104 119 110 121 113 125 C110 131 90 131 87 125Z" fill="#D06858" />
        <path d="M87 125 C90 123 96 122 100 122 C104 122 110 123 113 125" stroke="#B05040" strokeWidth="0.7" fill="none" />
        <path d="M87 125 C90 130 110 130 113 125" stroke="#B05040" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        <path d="M90 125 Q100 124 110 125 Q110 127 100 127 Q90 127 90 125Z" fill="white" opacity="0.8" />
        <circle cx="84" cy="124" r="1.5" fill={skin.shadow} opacity="0.3" />
        <circle cx="116" cy="124" r="1.5" fill={skin.shadow} opacity="0.3" />

        <ellipse cx="100" cy="142" rx="28" ry="6" fill="rgba(0,0,0,0.1)" />
      </g>
    </svg>
  )
}
