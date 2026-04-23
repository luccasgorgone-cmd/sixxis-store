'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Package } from 'lucide-react'

interface Props {
  src?: string | null
  alt: string
  w?: number
  h?: number
  className?: string
  fill?: boolean
  sizes?: string
}

export default function ProductImage({
  src, alt, w = 400, h = 400, className = '', fill = false, sizes,
}: Props) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={fill ? undefined : { width: w, height: h }}
      >
        <Package size={Math.min(w, h) * 0.3} className="text-gray-300" strokeWidth={1.5} />
      </div>
    )
  }

  const isExternal = src.startsWith('https://pub-') || src.startsWith('http')
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        onError={() => setError(true)}
        unoptimized={isExternal}
      />
    )
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      className={className}
      onError={() => setError(true)}
      unoptimized={isExternal}
    />
  )
}
