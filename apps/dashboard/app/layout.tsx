import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body-loaded',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-mono-loaded',
})

export const metadata: Metadata = {
  title: 'dep-trust dashboard',
  description: 'Monitor your npm supply chain scan history and allowlist.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <head>
        <style>{`
          :root {
            --font-body: var(--font-body-loaded, 'Space Grotesk', system-ui, sans-serif);
            --font-mono: var(--font-mono-loaded, 'Space Mono', monospace);
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
