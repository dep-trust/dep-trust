import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ScanRecord } from '@dep-trust/types/scan'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ScansPage() {
  const supabase = await createSupabaseServerClient()

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  const scans: ScanRecord[] = []

  if (member) {
    const { data } = await supabase
      .from('scans')
      .select('*')
      .eq('workspace_id', member.workspace_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) scans.push(...(data as ScanRecord[]))
  }

  if (scans.length === 0) {
    return (
      <>
        <h1 className="page-title">Scans</h1>
        <div className="card empty-state">
          <p>No scans yet. Run your first scan to see results here.</p>
          <div className="code-block">{'npx dep-trust scan'}</div>
          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Authenticate first with{' '}
            <code className="monospace" style={{ fontSize: 12 }}>dep-trust auth login</code>{' '}
            to sync results automatically.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">Scans</h1>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Project</th>
              <th>Manager</th>
              <th>Packages</th>
              <th>Flags</th>
              <th>Changes</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan) => {
              const flags = 
                scan.summary.freshness_flags + 
                scan.summary.script_flags + 
                (scan.summary.maintainer_flags ?? 0) +
                (scan.summary.typosquat_flags ?? 0) +
                (scan.summary.code_flags ?? 0) +
                (scan.summary.provenance_flags ?? 0)
              return (
                <tr key={scan.id}>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    {formatDate(scan.created_at)}
                  </td>
                  <td>
                    <Link href={`/scans/${scan.id}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>
                      {scan.project_name}
                    </Link>
                  </td>
                  <td><span className="tag">{scan.package_manager}</span></td>
                  <td className="monospace">{scan.summary.total_packages}</td>
                  <td>
                    {flags > 0 ? (
                      <span className="flag-badge">{flags}</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-disabled)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td className="monospace" style={{ color: scan.summary.lockfile_changes > 0 ? 'var(--color-warning)' : 'inherit' }}>
                    {scan.summary.lockfile_changes}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
