import { checkFreshness } from './freshness'
import { parseLockfile } from './lockfile'
import { detectScripts } from './scripts'
import { diffSnapshot, saveSeen } from './snapshot'
import type { ScanOptions, ScanResult } from '@dep-trust/types/scan'

const DEFAULT_OPTIONS: ScanOptions = {
  age: 72,
  scripts: true,
  json: false,
  cwd: process.cwd(),
}

export async function scan(
  options?: Partial<ScanOptions> & { allowlist?: Set<string>; failOn?: import('@dep-trust/types/scan').FailOn; ci?: boolean },
): Promise<ScanResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const deps = parseLockfile(opts.cwd)
  const packages = deps.map((dep) => ({ name: dep.name, version: dep.version }))
  const allowlist = options?.allowlist ?? new Set<string>()

  const [freshness, scripts] = await Promise.all([
    checkFreshness(packages, opts.age),
    Promise.resolve(opts.scripts ? detectScripts(opts.cwd, allowlist) : []),
  ])

  const currentMaintainers: Record<string, string[]> = {}
  for (const f of freshness) {
    if (f.maintainers.length > 0) {
      currentMaintainers[f.name] = f.maintainers
    }
  }

  const diff = diffSnapshot(opts.cwd, currentMaintainers)

  if (opts.scripts) {
    const scriptNames = scripts.map((s) => s.name)
    saveSeen(opts.cwd, scriptNames)
  }

  const failedChecks: string[] = []
  
  const hasFreshness = freshness.some((f) => f.flagged)
  const hasScripts = scripts.some((s) => s.status === 'new')
  const hasDiff = (diff?.added.length ?? 0) > 0 || (diff?.removed.length ?? 0) > 0 || (diff?.bumped.length ?? 0) > 0
  const hasMaintainerChanges = (diff?.maintainerChanges.length ?? 0) > 0

  if (hasFreshness) failedChecks.push('freshness')
  if (hasScripts) failedChecks.push('scripts')
  if (hasDiff) failedChecks.push('diff')
  if (hasMaintainerChanges) failedChecks.push('maintainers')

  let severity: 'clean' | 'warning' | 'critical' = 'clean'
  if (hasScripts || hasFreshness || hasMaintainerChanges) {
    severity = 'critical'
  } else if (hasDiff) {
    severity = 'warning'
  }

  const failOn = options?.failOn ?? 'all'
  let pass = true
  if (failOn === 'all' && failedChecks.length > 0) pass = false
  if (failOn === 'freshness' && hasFreshness) pass = false
  if (failOn === 'scripts' && hasScripts) pass = false
  if (failOn === 'diff' && hasDiff) pass = false
  if (failOn === 'maintainers' && hasMaintainerChanges) pass = false

  return {
    freshness,
    scripts,
    diff,
    timestamp: new Date().toISOString(),
    packageCount: packages.length,
    severity,
    pass,
    failedChecks,
  }
}
