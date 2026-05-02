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
  options?: Partial<ScanOptions> & { allowlist?: Set<string> },
): Promise<ScanResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const deps = parseLockfile(opts.cwd)
  const packages = deps.map((dep) => ({ name: dep.name, version: dep.version }))
  const allowlist = options?.allowlist ?? new Set<string>()

  const [freshness, scripts, diff] = await Promise.all([
    checkFreshness(packages, opts.age),
    Promise.resolve(opts.scripts ? detectScripts(opts.cwd, allowlist) : []),
    Promise.resolve(diffSnapshot(opts.cwd)),
  ])

  if (opts.scripts) {
    const scriptNames = scripts.map((s) => s.name)
    saveSeen(opts.cwd, scriptNames)
  }

  return {
    freshness,
    scripts,
    diff,
    timestamp: new Date().toISOString(),
    packageCount: packages.length,
  }
}
