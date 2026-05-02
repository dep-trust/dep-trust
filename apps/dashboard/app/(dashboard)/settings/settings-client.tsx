'use client'

import { useActionState } from 'react'
import { deleteAccount, updateWorkspaceName } from './actions'

export function SettingsClient({ workspaceName }: { workspaceName: string }) {
  const [nameState, nameAction, namePending] = useActionState(
    async (_: unknown, formData: FormData) => updateWorkspaceName(formData),
    null,
  )
  const [deleteState, deleteAction, deletePending] = useActionState(
    async (_: unknown, formData: FormData) => {
      const confirmed = formData.get('confirm') === 'DELETE'
      if (!confirmed) return { error: 'Type DELETE to confirm' }
      return deleteAccount()
    },
    null,
  )

  return (
    <>
      <div className="card" style={{ marginBottom: 24, maxWidth: 480 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px 0' }}>Workspace</h2>
        {nameState?.error && <p className="error-msg">{nameState.error}</p>}
        <form action={nameAction}>
          <div className="field">
            <label htmlFor="name" className="label">Workspace name</label>
            <input
              id="name"
              name="name"
              className="input"
              defaultValue={workspaceName}
              required
              minLength={2}
            />
          </div>
          <button type="submit" disabled={namePending} className="btn btn--primary">
            {namePending ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>

      <div className="danger-zone" style={{ maxWidth: 480 }}>
        <h2 className="danger-zone-title">Danger zone</h2>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
          Permanently delete your account and all associated workspaces, scans, and data.
          This cannot be undone.
        </p>
        {deleteState?.error && <p className="error-msg">{deleteState.error}</p>}
        <form action={deleteAction} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="confirm" className="label">Type DELETE to confirm</label>
            <input id="confirm" name="confirm" className="input" placeholder="DELETE" />
          </div>
          <button type="submit" disabled={deletePending} className="btn btn--danger">
            {deletePending ? 'Deleting…' : 'Delete account'}
          </button>
        </form>
      </div>
    </>
  )
}
