import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['dep-trust', '@dep-trust/types'],
  serverExternalPackages: ['@react-pdf/renderer'],
}

export default config
