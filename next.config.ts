import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'pub-543c49f4581a424aa738beacf3a89e96.r2.dev' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Desabilita Router Cache (client-side) completamente
  // Resolve o problema de múltiplas instâncias no Railway
  experimental: {
    staleTimes: {
      dynamic: 0,
      static:  30,
    },
  },
}

export default nextConfig
