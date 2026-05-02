'use client'

import { useActionState } from 'react'
import type { AllowlistEntry } from '@dep-trust/types/workspace'
import { addAllowlistEntry, removeAllowlistEntry } from './actions'

export function AllowlistClient({ entries }: { entries: AllowlistEntry[] }) {
  const [addState, addAction, addPending] = useActionState(
    async (_: unknown, formData: FormData) => addAllowlistEntry(formData),
    null,
  )

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 24 }}>
        {addState?.error && <p className="error-msg">{addState.error}</p>}
        <form action={addAction} style={{ display: 'flex', gap: 10 }}>
          <input
            name="package_name"
            className="input"
            placeholder="package-name"
            required
            pattern="^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn--primary" disabled={addPending}>
            {addPending ? 'Adding…' : 'Add to allowlist'}
          </button>
        </form>
      </div>

      <div className="table-wrap">
        {entries.length === 0 ? (
          <p style={{ padding: '24px 16px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
            No packages allowlisted yet.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="monospace">{entry.package_name}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    {formatDate(entry.created_at)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <form action={removeAllowlistEntry.bind(null, entry.package_name)}>
                      <button type="submit" className="btn btn--ghost" style={{ fontSize: 12, padding: '4px 10px' }}>
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
