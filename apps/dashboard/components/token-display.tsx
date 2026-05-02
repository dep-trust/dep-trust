'use client'

import { useState } from 'react'

interface TokenDisplayProps {
  onGenerate: () => Promise<{ token?: string; error?: string }>
}

export function TokenDisplay({ onGenerate }: TokenDisplayProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setState('loading')
    setError(null)
    const result = await onGenerate()
    if (result.error) {
      setError(result.error)
      setState('idle')
    } else if (result.token) {
      setToken(result.token)
      setState('done')
    }
  }

  async function handleCopy() {
    if (!token) return
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (state === 'done' && token) {
    return (
      <div>
        <p className="warning-note">
          This token will not be shown again. Copy it now and store it somewhere safe.
        </p>
        <div style={{ position: 'relative' }}>
          <div className="token-box">{token}</div>
          <button
            type="button"
            onClick={handleCopy}
            className="btn"
            style={{ marginBottom: 16 }}
          >
            {copied ? 'Copied!' : 'Copy token'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
          Run this command to authenticate your CLI:
        </p>
        <div className="code-block">{`dep-trust auth login --token ${token}`}</div>
      </div>
    )
  }

  return (
    <div>
      {error && <p className="error-msg">{error}</p>}
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
        Generate a CLI token to authenticate <code className="monospace">dep-trust</code> on this machine.
        Each token is shown exactly once.
      </p>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={state === 'loading'}
        className="btn btn--primary"
      >
        {state === 'loading' ? 'Generating…' : 'Generate CLI token'}
      </button>
    </div>
  )
}
