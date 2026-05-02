'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { loginAction } from '../actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_: unknown, formData: FormData) => loginAction(formData),
    null,
  )

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <a
          href={process.env['NEXT_PUBLIC_MARKETING_URL'] ?? 'https://dep-trust.vercel.app'}
          className="auth-wordmark"
        >
          dep-trust
        </a>
        <h1 className="auth-title">Sign in</h1>

        {state?.error && <p className="error-msg">{state.error}</p>}

        <form action={formAction}>
          <div className="field">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <div className="field">
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={pending} className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          No account? <Link href="/signup">Create one</Link>
        </p>
      </div>
    </div>
  )
}
