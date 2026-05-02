import pc from 'picocolors'
import type { FreshnessResult, ScanResult, ScriptResult, SnapshotDiff } from '@dep-trust/types/scan'

export function formatScanResult(result: ScanResult): string {
  const lines: string[] = []

  lines.push(pc.bold(`dep-trust v0.1.0`))
  lines.push('')
  lines.push(`scanning ${result.packageCount} packages...`)
  lines.push('')

  if (result.freshness.length > 0) {
    lines.push(pc.bold('FRESHNESS'))
    for (const pkg of result.freshness) {
      lines.push(formatFreshnessLine(pkg))
    }
    lines.push('')
  }

  if (result.scripts.length > 0) {
    lines.push(pc.bold('INSTALL SCRIPTS'))
    for (const pkg of result.scripts) {
      lines.push(formatScriptLine(pkg))
    }
    lines.push('')
  }

  if (result.diff) {
    formatDiff(result.diff, lines)
  }

  lines.push(formatSummary(result))
  lines.push(pc.dim('run dep-trust scan --json for machine-readable output'))
  lines.push('')

  return lines.join('\n')
}

function formatFreshnessLine(pkg: FreshnessResult): string {
  if (pkg.error) {
    return `  ${pc.dim('?')}  ${pc.dim(pkg.name.padEnd(20))} ${pc.dim(pkg.error)}`
  }

  const age = formatAge(pkg.ageHours)
  const version = pkg.version.padEnd(12)

  if (pkg.flagged) {
    return `  ${pc.red('✗')}  ${pc.red(pkg.name.padEnd(20))} ${version} published ${age}`
  }
  return `  ${pc.green('✓')}  ${pc.dim(pkg.name.padEnd(20))} ${pc.dim(version)} published ${pc.dim(age)}`
}

function formatAge(hours: number | null): string {
  if (hours === null) return 'unknown'
  if (hours < 1) return '<1h ago'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatScriptLine(pkg: ScriptResult): string {
  const hooks = pkg.scripts.join(', ')
  switch (pkg.status) {
    case 'new':
      return `  ${pc.red('✗')}  ${pc.red(pkg.name.padEnd(20))} ${pc.red('NEW')}       has ${hooks} script`
    case 'seen':
      return `  ${pc.dim('~')}  ${pc.dim(pkg.name.padEnd(20))} ${'SEEN'.padEnd(10)}has ${pc.dim(hooks)} script`
    case 'allowlisted':
      return `  ${pc.dim('~')}  ${pc.dim(pkg.name.padEnd(20))} ${'SEEN'.padEnd(10)}has ${pc.dim(hooks)} script ${pc.dim('(allowlisted)')}`
  }
}

function formatDiff(diff: SnapshotDiff, lines: string[]): void {
  if (diff.added.length === 0 && diff.removed.length === 0 && diff.bumped.length === 0) return

  const since = diff.snapshotDate ? ` (since ${diff.snapshotDate.split('T')[0]})` : ''
  lines.push(pc.bold(`LOCKFILE DIFF${since}`))

  for (const pkg of diff.added) {
    lines.push(`  ${pc.green('+')}  added:    ${pkg.name}@${pkg.version}`)
  }
  for (const pkg of diff.removed) {
    lines.push(`  ${pc.red('-')}  removed:  ${pkg.name}@${pkg.version}`)
  }
  for (const bump of diff.bumped) {
    lines.push(`  ${pc.yellow('↑')}  bumped:   ${bump.name} ${bump.from} → ${bump.to}`)
  }
  lines.push('')
}

function formatSummary(result: ScanResult): string {
  const flagged = result.freshness.filter((f) => f.flagged).length
  const newScripts = result.scripts.filter((s) => s.status === 'new').length
  const changes =
    (result.diff?.added.length ?? 0) +
    (result.diff?.removed.length ?? 0) +
    (result.diff?.bumped.length ?? 0)

  const parts: string[] = []

  if (flagged > 0) parts.push(pc.red(`${flagged} freshness flag${flagged > 1 ? 's' : ''}`))
  else parts.push(pc.green('0 freshness flags'))

  if (newScripts > 0) parts.push(pc.red(`${newScripts} new install script${newScripts > 1 ? 's' : ''}`))
  else parts.push(pc.green('0 new install scripts'))

  if (changes > 0) parts.push(pc.yellow(`${changes} lockfile change${changes > 1 ? 's' : ''}`))
  else parts.push(pc.green('0 lockfile changes'))

  return `${pc.bold('SUMMARY')}  ${parts.join('   ')}`
}
