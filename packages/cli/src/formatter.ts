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

  if ((result.diff?.maintainerChanges?.length ?? 0) > 0) {
    lines.push(pc.bold('MAINTAINER CHANGES'))
    for (const change of result.diff!.maintainerChanges) {
      const parts: string[] = []
      for (const added of change.added) parts.push(pc.yellow(`+${added} (new)`))
      for (const removed of change.removed) parts.push(pc.red(`-${removed} (removed)`))
      
      lines.push(`  ${pc.red('✗')}  ${pc.red(change.name.padEnd(20))} ${parts.join('  ')}`)
    }
    lines.push('')
  }

  if (result.typosquats.length > 0) {
    lines.push(pc.bold('TYPOSQUAT WARNINGS'))
    for (const sq of result.typosquats) {
      const color = sq.confidence === 'high' ? pc.red : pc.yellow
      const icon = sq.confidence === 'high' ? '✗' : '?'
      lines.push(`  ${color(icon)}  ${color(sq.name.padEnd(20))} looks like ${sq.similarTo} (distance: ${sq.distance})`)
    }
    lines.push('')
  }

  if (result.codeAnalysis && result.codeAnalysis.findings.length > 0) {
    lines.push(pc.bold(`CODE ANALYSIS (${result.codeAnalysis.packagesScanned} packages scanned)`))
    for (const finding of result.codeAnalysis.findings) {
      const color = finding.severity === 'critical' ? pc.red : pc.yellow
      const icon = finding.severity === 'critical' ? '✗' : '?'
      lines.push(`  ${color(icon)}  ${color(finding.name.padEnd(20))} ${finding.pattern} in ${finding.file}`)
      lines.push(`       ${pc.dim(finding.snippet)}`)
    }
    lines.push('')
  }

  if (result.missingProvenance && result.missingProvenance.length > 0) {
    lines.push(pc.bold('PROVENANCE WARNINGS'))
    for (const pkg of result.missingProvenance) {
      lines.push(`  ${pc.yellow('?')}  ${pc.yellow(pkg.padEnd(20))} missing SLSA provenance (flagged package)`)
    }
    lines.push('')
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
  const maintainerChanges = result.diff?.maintainerChanges.length ?? 0

  const parts: string[] = []

  if (flagged > 0) parts.push(pc.red(`${flagged} freshness flag${flagged > 1 ? 's' : ''}`))
  else parts.push(pc.green('0 freshness flags'))

  if (newScripts > 0) parts.push(pc.red(`${newScripts} new install script${newScripts > 1 ? 's' : ''}`))
  else parts.push(pc.green('0 new install scripts'))

  if (changes > 0) parts.push(pc.yellow(`${changes} lockfile change${changes > 1 ? 's' : ''}`))
  else parts.push(pc.green('0 lockfile changes'))

  if (maintainerChanges > 0) parts.push(pc.red(`${maintainerChanges} maintainer change${maintainerChanges > 1 ? 's' : ''}`))
  if (result.typosquats.length > 0) parts.push(pc.red(`${result.typosquats.length} typosquat warning${result.typosquats.length > 1 ? 's' : ''}`))
  
  const codeFlags = result.codeAnalysis?.findings.length ?? 0
  if (codeFlags > 0) parts.push(pc.red(`${codeFlags} code flag${codeFlags > 1 ? 's' : ''}`))

  const missingProv = result.missingProvenance?.length ?? 0
  if (missingProv > 0) parts.push(pc.yellow(`${missingProv} missing provenance`))

  return `${pc.bold('SUMMARY')}  ${parts.join('   ')}`
}
