import { checkFreshness } from './freshness'
import { parseLockfile } from './lockfile'
import { detectScripts } from './scripts'
import { diffSnapshot, saveSeen } from './snapshot'
import { detectTyposquats } from './typosquat'
import { analyzePackageCode } from './code-analysis'
import topPackagesJson from './data/top-packages.json'
import type { ScanOptions, ScanResult } from '@dep-trust/types/scan'

const TOP_PACKAGES = new Set(topPackagesJson as string[])

const DEFAULT_OPTIONS: ScanOptions = {
  age: 72,
  scripts: true,
  json: false,
  cwd: process.cwd(),
  deep: false,
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
  const typosquats = detectTyposquats(packages.map(p => p.name), TOP_PACKAGES)

  if (opts.scripts) {
    const scriptNames = scripts.map((s) => s.name)
    saveSeen(opts.cwd, scriptNames)
  }

  const flaggedPackages = new Set<string>()
  for (const f of freshness) if (f.flagged) flaggedPackages.add(f.name)
  for (const s of scripts) if (s.status === 'new') flaggedPackages.add(s.name)
  for (const t of typosquats) flaggedPackages.add(t.name)

  const packagesToScan = opts.deep ? packages.map(p => p.name) : [...flaggedPackages]
  const codeAnalysis = packagesToScan.length > 0 
    ? analyzePackageCode(opts.cwd, packagesToScan, allowlist) 
    : { findings: [], packagesScanned: 0, filesScanned: 0 }

  const failedChecks: string[] = []
  
  const hasFreshness = freshness.some((f) => f.flagged)
  const hasScripts = scripts.some((s) => s.status === 'new')
  const hasDiff = (diff?.added.length ?? 0) > 0 || (diff?.removed.length ?? 0) > 0 || (diff?.bumped.length ?? 0) > 0
  const hasMaintainerChanges = (diff?.maintainerChanges.length ?? 0) > 0
  const hasTyposquats = typosquats.length > 0
  const hasCodeFlags = codeAnalysis.findings.length > 0

  const missingProvenance: string[] = []
  const allFlagged = new Set([...flaggedPackages, ...packagesToScan.filter(p => codeAnalysis.findings.some(f => f.name === p))])
  
  for (const f of freshness) {
    if (allFlagged.has(f.name) && !f.hasProvenance) {
      missingProvenance.push(f.name)
    }
  }

  if (hasFreshness) failedChecks.push('freshness')
  if (hasScripts) failedChecks.push('scripts')
  if (hasDiff) failedChecks.push('diff')
  if (hasMaintainerChanges) failedChecks.push('maintainers')
  if (hasTyposquats) failedChecks.push('typosquat')
  if (hasCodeFlags) failedChecks.push('code')

  let severity: 'clean' | 'warning' | 'critical' = 'clean'
  if (hasScripts || hasFreshness || hasMaintainerChanges || hasTyposquats || codeAnalysis.findings.some(f => f.severity === 'critical')) {
    severity = 'critical'
  } else if (hasDiff || hasCodeFlags || missingProvenance.length > 0) {
    severity = 'warning'
  }

  const failOn = options?.failOn ?? 'all'
  let pass = true
  if (failOn === 'all' && failedChecks.length > 0) pass = false
  if (failOn === 'freshness' && hasFreshness) pass = false
  if (failOn === 'scripts' && hasScripts) pass = false
  if (failOn === 'diff' && hasDiff) pass = false
  if (failOn === 'maintainers' && hasMaintainerChanges) pass = false
  if (failOn === 'typosquat' && hasTyposquats) pass = false
  if (failOn === 'code' && hasCodeFlags) pass = false

  // Return missing provenance in ScanResult
  return {
    freshness,
    scripts,
    diff,
    typosquats,
    codeAnalysis,
    missingProvenance,
    timestamp: new Date().toISOString(),
    packageCount: packages.length,
    severity,
    pass,
    failedChecks,
  }
}
