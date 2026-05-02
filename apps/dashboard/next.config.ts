import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['dep-trust', '@dep-trust/types'],
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
}

export default config
