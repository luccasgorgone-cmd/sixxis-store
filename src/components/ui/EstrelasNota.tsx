'use client'

interface Props {
  nota: number
  size?: number
  showNumber?: boolean
}

export default function EstrelasNota({ nota, size = 14, showNumber = false }: Props) {
  const estrelas = [1, 2, 3, 4, 5]

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {estrelas.map(i => {
          const fill = Math.min(1, Math.max(0, nota - (i - 1)))
          const percent = Math.round(fill * 100)

          return (
            <div
              key={i}
              className="relative"
              style={{ width: size, height: size }}
            >
              {/* Estrela vazia (cinza) — base */}
              <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                className="absolute inset-0"
              >
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="#e5e7eb"
                  stroke="none"
                />
              </svg>
              {/* Estrela preenchida (amarela) — clip por percentual */}
              {percent > 0 && (
                <svg
                  width={size}
                  height={size}
                  viewBox="0 0 24 24"
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
                >
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#f59e0b"
                    stroke="none"
                  />
                </svg>
              )}
            </div>
          )
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-bold text-gray-700 ml-0.5">
          {nota.toFixed(1)}
        </span>
      )}
    </div>
  )
}
