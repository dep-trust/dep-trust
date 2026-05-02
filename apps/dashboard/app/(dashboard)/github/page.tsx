import { createSupabaseServerClient } from '../../../lib/supabase/server'
import type { GitHubInstallation } from '@dep-trust/types/github'

const GITHUB_APP_INSTALL_URL = 'https://github.com/apps/dep-trust/installations/new'

export default async function GitHubPage() {
  const supabase = createSupabaseServerClient()

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  let installation: GitHubInstallation | null = null

  if (member) {
    const { data } = await supabase
      .from('github_installations')
      .select('*')
      .eq('workspace_id', member.workspace_id)
      .limit(1)
      .single()

    if (data) installation = data as GitHubInstallation
  }

  return (
    <>
      <h1 className="page-title">GitHub App</h1>

      {installation ? (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            The dep-trust GitHub App is connected to your workspace. It will comment on pull
            requests when new dependencies trigger freshness or install script flags.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', fontSize: 12, color: 'var(--color-text-secondary)', width: 140 }}>Account</td>
                <td className="monospace" style={{ fontSize: 13 }}>{installation.account_login}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>Type</td>
                <td><span className="tag">{installation.account_type}</span></td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>Installation ID</td>
                <td className="monospace" style={{ fontSize: 13 }}>{installation.installation_id}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>Connected</td>
                <td style={{ fontSize: 12 }}>
                  {new Date(installation.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Install the dep-trust GitHub App to receive automated PR comments when new dependencies
            trigger supply chain flags.
          </p>
          <a href={GITHUB_APP_INSTALL_URL} className="btn btn--primary">
            Install GitHub App
          </a>
        </div>
      )}
    </>
  )
}
