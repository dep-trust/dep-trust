'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signupAction } from '../actions'

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(
    async (_: unknown, formData: FormData) => signupAction(formData),
    null,
  )

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link href="/" className="auth-wordmark">dep-trust</Link>
        <h1 className="auth-title">Create account</h1>

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
              autoComplete="new-password"
              minLength={8}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={pending} className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
            {pending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
