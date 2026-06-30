import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { FindingsSection } from '@/components/findings-section'
import type { ScanRecord } from '@dep-trust/types/scan'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  })
}

function formatAge(hours: number | null): string {
  if (hours === null) return 'unknown'
  if (hours < 1) return '<1h'
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export default async function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient()

  const { data: scan, error } = await supabase
    .from('scans')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !scan) notFound()

  const s = scan as ScanRecord
  const { summary, findings } = s

  const flaggedFreshness = findings.freshness.filter((f) => f.flagged)
  const newScripts = findings.scripts.filter((sc) => sc.status === 'new')
  const maintainerChanges = findings.diff?.maintainerChanges ?? []
  const typosquats = findings.typosquats ?? []
  const codeFindings = findings.codeAnalysis?.findings ?? []
  const missingProvenance = findings.missingProvenance ?? []
  const diff = findings.diff
  const diffTotal = (diff?.added.length ?? 0) + (diff?.removed.length ?? 0) + (diff?.bumped.length ?? 0)

  return (
    <>
      <div className="section-header">
        <h1 className="page-title" style={{ margin: 0 }}>{s.project_name}</h1>
        <a
          href={`/api/scans/${s.id}/report`}
          download={`dep-trust-${s.project_name}-${s.id.slice(0, 8)}.pdf`}
          className="btn"
        >
          Download Report
        </a>
      </div>

      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
        {formatDate(s.created_at)} · {s.package_manager}
      </p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{summary.total_packages}</div>
          <div className="stat-label">Packages</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: summary.freshness_flags > 0 ? 'var(--color-accent)' : 'inherit' }}>
            {summary.freshness_flags}
          </div>
          <div className="stat-label">Freshness Flags</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: summary.script_flags > 0 ? 'var(--color-accent)' : 'inherit' }}>
            {summary.script_flags}
          </div>
          <div className="stat-label">Script Flags</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: summary.lockfile_changes > 0 ? 'var(--color-warning)' : 'inherit' }}>
            {summary.lockfile_changes}
          </div>
          <div className="stat-label">Lockfile Changes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: (summary.maintainer_flags ?? 0) > 0 ? 'var(--color-accent)' : 'inherit' }}>
            {summary.maintainer_flags ?? 0}
          </div>
          <div className="stat-label">Maintainers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: (summary.typosquat_flags ?? 0) > 0 ? 'var(--color-accent)' : 'inherit' }}>
            {summary.typosquat_flags ?? 0}
          </div>
          <div className="stat-label">Typosquats</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: (summary.code_flags ?? 0) > 0 ? 'var(--color-accent)' : 'inherit' }}>
            {summary.code_flags ?? 0}
          </div>
          <div className="stat-label">Code Flags</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: (summary.provenance_flags ?? 0) > 0 ? 'var(--color-warning)' : 'inherit' }}>
            {summary.provenance_flags ?? 0}
          </div>
          <div className="stat-label">Provenance</div>
        </div>
      </div>

      <FindingsSection title="Freshness Findings" count={flaggedFreshness.length}>
        {flaggedFreshness.length === 0 ? (
          <p style={{ padding: '16px', color: 'var(--color-text-secondary)', fontSize: 13 }}>No freshness flags.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Version</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {flaggedFreshness.map((f) => (
                <tr key={f.name}>
                  <td className="monospace" style={{ color: 'var(--color-accent)' }}>{f.name}</td>
                  <td className="monospace">{f.version}</td>
                  <td style={{ color: 'var(--color-accent)' }}>{formatAge(f.ageHours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </FindingsSection>

      <FindingsSection title="Install Script Findings" count={newScripts.length}>
        {newScripts.length === 0 ? (
          <p style={{ padding: '16px', color: 'var(--color-text-secondary)', fontSize: 13 }}>No new install scripts.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Scripts</th>
              </tr>
            </thead>
            <tbody>
              {newScripts.map((s) => (
                <tr key={s.name}>
                  <td className="monospace" style={{ color: 'var(--color-accent)' }}>{s.name}</td>
                  <td className="monospace">{s.scripts.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </FindingsSection>

      <FindingsSection title="Lockfile Diff" count={diffTotal}>
        {!diff || diffTotal === 0 ? (
          <p style={{ padding: '16px', color: 'var(--color-text-secondary)', fontSize: 13 }}>No lockfile changes.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Change</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {diff.added.map((d) => (
                <tr key={`a-${d.name}`}>
                  <td className="monospace">{d.name}</td>
                  <td style={{ color: 'var(--color-success)' }}>added</td>
                  <td className="monospace">{d.version}</td>
                </tr>
              ))}
              {diff.removed.map((d) => (
                <tr key={`r-${d.name}`}>
                  <td className="monospace">{d.name}</td>
                  <td style={{ color: 'var(--color-accent)' }}>removed</td>
                  <td className="monospace">{d.version}</td>
                </tr>
              ))}
              {diff.bumped.map((d) => (
                <tr key={`b-${d.name}`}>
                  <td className="monospace">{d.name}</td>
                  <td style={{ color: 'var(--color-warning)' }}>bumped</td>
                  <td className="monospace">{d.from} → {d.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </FindingsSection>

      <FindingsSection title="Maintainer Changes" count={maintainerChanges.length}>
        {maintainerChanges.length === 0 ? (
          <p style={{ padding: '16px', color: 'var(--color-text-secondary)', fontSize: 13 }}>No maintainer changes.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Added</th>
                <th>Removed</th>
              </tr>
            </thead>
            <tbody>
              {maintainerChanges.map((m) => (
                <tr key={m.name}>
                  <td className="monospace" style={{ color: 'var(--color-accent)' }}>{m.name}</td>
                  <td className="monospace" style={{ color: 'var(--color-success)' }}>{m.added.join(', ') || '—'}</td>
                  <td className="monospace" style={{ color: 'var(--color-accent)' }}>{m.removed.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </FindingsSection>

      <FindingsSection title="Typosquat Warnings" count={typosquats.length}>
        {typosquats.length === 0 ? (
          <p style={{ padding: '16px', color: 'var(--color-text-secondary)', fontSize: 13 }}>No typosquat warnings.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Similar To</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              {typosquats.map((t) => (
                <tr key={t.name}>
                  <td className="monospace" style={{ color: t.confidence === 'high' ? 'var(--color-accent)' : 'var(--color-warning)' }}>{t.name}</td>
                  <td className="monospace">{t.similarTo}</td>
                  <td>{t.distance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </FindingsSection>

      <FindingsSection title="Code Analysis" count={codeFindings.length}>
        {codeFindings.length === 0 ? (
          <p style={{ padding: '16px', color: 'var(--color-text-secondary)', fontSize: 13 }}>No code analysis findings.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Pattern</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {codeFindings.map((c, i) => (
                <tr key={i}>
                  <td className="monospace" style={{ color: c.severity === 'critical' ? 'var(--color-accent)' : 'var(--color-warning)' }}>{c.name}</td>
                  <td className="monospace">{c.pattern}</td>
                  <td className="monospace">{c.file}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </FindingsSection>

      <FindingsSection title="Missing Provenance" count={missingProvenance.length}>
        {missingProvenance.length === 0 ? (
          <p style={{ padding: '16px', color: 'var(--color-text-secondary)', fontSize: 13 }}>No flagged packages are missing provenance.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Package</th>
              </tr>
            </thead>
            <tbody>
              {missingProvenance.map((p) => (
                <tr key={p}>
                  <td className="monospace" style={{ color: 'var(--color-warning)' }}>{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </FindingsSection>
    </>
  )
}
