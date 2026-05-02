'use client'

import { useState } from 'react'

export function Nav() {
  const [copied, setCopied] = useState(false)

  async function copyInstall() {
    await navigator.clipboard.writeText('npm install -g dep-trust')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" className="font-display font-bold text-sm tracking-tight text-text-display">
          dep-trust
        </a>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/salarkhannn/dep-trust"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            GitHub
          </a>
          <a
            href="https://dep-trust.vercel.app/login"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            Login
          </a>
          <a
            href="https://dep-trust.vercel.app/signup"
            className="font-mono text-[13px] uppercase tracking-[0.06em] px-6 py-2 border border-border-visible text-text-primary rounded-full hover:text-text-display hover:border-text-display transition-colors duration-200"
          >
            Sign up
          </a>
          <button
            onClick={copyInstall}
            className="hidden md:block font-mono text-[13px] uppercase tracking-[0.06em] px-6 py-2.5 bg-text-display text-black rounded-full hover:opacity-90 transition-opacity duration-200 cursor-pointer"
          >
            {copied ? '[COPIED]' : 'npm install dep-trust'}
          </button>
        </div>
      </div>
    </nav>
  )
}
