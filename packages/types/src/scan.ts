export interface ScanOptions {
  age: number
  scripts: boolean
  json: boolean
  cwd: string
}

export type FailOn = 'freshness' | 'scripts' | 'diff' | 'all'

export interface PackageMeta {
  name: string
  version: string
}

export interface FreshnessResult {
  name: string
  version: string
  publishedAt: Date | null
  ageHours: number | null
  flagged: boolean
  error: string | null
}

export interface ScriptResult {
  name: string
  scripts: string[]
  status: 'new' | 'seen' | 'allowlisted'
}

export interface LockfileDependency {
  name: string
  version: string
  integrity?: string
}

export interface SnapshotDiff {
  added: LockfileDependency[]
  removed: LockfileDependency[]
  bumped: Array<{
    name: string
    from: string
    to: string
  }>
  snapshotDate: string | null
}

export interface ScanResult {
  freshness: FreshnessResult[]
  scripts: ScriptResult[]
  diff: SnapshotDiff | null
  timestamp: string
  packageCount: number
  severity?: 'clean' | 'warning' | 'critical'
  pass?: boolean
  failedChecks?: string[]
}

export interface ScanSummary {
  total_packages: number
  freshness_flags: number
  script_flags: number
  lockfile_changes: number
  duration_ms: number
}

export interface ScanFindings {
  freshness: FreshnessResult[]
  scripts: ScriptResult[]
  diff: SnapshotDiff | null
}

export interface ScanRecord {
  id: string
  workspace_id: string
  created_at: string
  project_name: string
  package_manager: 'npm' | 'pnpm'
  summary: ScanSummary
  findings: ScanFindings
  lockfile_hash: string
}
