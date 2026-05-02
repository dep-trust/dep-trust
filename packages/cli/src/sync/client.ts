import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import pc from 'picocolors'
import type { ScanFindings, ScanRecord, ScanResult, ScanSummary } from '@dep-trust/types/scan'

const API_BASE = process.env['DEP_TRUST_API_URL'] ?? 'https://app.dep-trust.dev'

export async function syncScan(
  token: string,
  payload: Omit<ScanRecord, 'id' | 'workspace_id' | 'created_at'>,
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    console.log(pc.dim(`sync failed: ${err instanceof Error ? err.message : 'unknown'}`))
  }
}

export async function fetchRemoteAllowlist(token: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/allowlist`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as Array<{ package_name: string }>
    return data.map((e) => e.package_name)
  } catch {
    return []
  }
}

export async function syncAllowlistAdd(token: string, pkg: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/allowlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ package_name: pkg }),
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    console.log(pc.dim(`allowlist sync failed: ${err instanceof Error ? err.message : 'unknown'}`))
  }
}

export function buildScanPayload(
  result: ScanResult,
  opts: {
    projectName: string
    packageManager: 'npm' | 'pnpm'
    lockfileHash: string
    startedAt: number
  },
): Omit<ScanRecord, 'id' | 'workspace_id' | 'created_at'> {
  const summary: ScanSummary = {
    total_packages: result.packageCount,
    freshness_flags: result.freshness.filter((f) => f.flagged).length,
    script_flags: result.scripts.filter((s) => s.status === 'new').length,
    lockfile_changes:
      (result.diff?.added.length ?? 0) +
      (result.diff?.removed.length ?? 0) +
      (result.diff?.bumped.length ?? 0),
    duration_ms: Date.now() - opts.startedAt,
  }

  const findings: ScanFindings = {
    freshness: result.freshness,
    scripts: result.scripts,
    diff: result.diff,
  }

  return {
    project_name: opts.projectName,
    package_manager: opts.packageManager,
    lockfile_hash: opts.lockfileHash,
    summary,
    findings,
  }
}

export function detectPackageManager(cwd: string): 'npm' | 'pnpm' {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
  return 'npm'
}

export function hashLockfile(cwd: string): string {
  const candidates = ['package-lock.json', 'pnpm-lock.yaml']
  for (const file of candidates) {
    try {
      const content = readFileSync(join(cwd, file), 'utf-8')
      return createHash('sha256').update(content).digest('hex')
    } catch {
      // try next candidate
    }
  }
  return ''
}

export function getProjectName(cwd: string): string {
  try {
    const raw = readFileSync(join(cwd, 'package.json'), 'utf-8')
    const pkg = JSON.parse(raw) as { name?: string }
    if (pkg.name) return pkg.name
  } catch {
    // fall through
  }
  return cwd.split('/').at(-1) ?? 'unknown'
}
