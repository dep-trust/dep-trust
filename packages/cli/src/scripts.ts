import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { ScriptResult } from '@dep-trust/types/scan'

const INSTALL_HOOKS = ['preinstall', 'install', 'postinstall'] as const

export function detectScripts(cwd: string, allowlist: Set<string>): ScriptResult[] {
  const nodeModules = join(cwd, 'node_modules')
  const seenPath = join(cwd, '.dep-trust', 'seen-scripts.json')
  const seen = loadSeen(seenPath)
  const results: ScriptResult[] = []

  let entries: string[]
  try {
    entries = readdirSync(nodeModules)
  } catch {
    return results
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue

    if (entry.startsWith('@')) {
      let scopedEntries: string[]
      try {
        scopedEntries = readdirSync(join(nodeModules, entry))
      } catch {
        continue
      }
      for (const scoped of scopedEntries) {
        const fullName = `${entry}/${scoped}`
        const pkg = readPkg(join(nodeModules, entry, scoped))
        if (pkg) processPackage(fullName, pkg, allowlist, seen, results)
      }
    } else {
      const pkg = readPkg(join(nodeModules, entry))
      if (pkg) processPackage(entry, pkg, allowlist, seen, results)
    }
  }

  return results
}

function processPackage(
  name: string,
  pkg: Record<string, unknown>,
  allowlist: Set<string>,
  seen: Set<string>,
  results: ScriptResult[],
) {
  const scripts = pkg.scripts as Record<string, string> | undefined
  if (!scripts) return

  const hooks = INSTALL_HOOKS.filter((hook) => typeof scripts[hook] === 'string')
  if (hooks.length === 0) return

  let status: ScriptResult['status']
  if (allowlist.has(name)) {
    status = 'allowlisted'
  } else if (seen.has(name)) {
    status = 'seen'
  } else {
    status = 'new'
  }

  results.push({ name, scripts: [...hooks], status })
}

function readPkg(pkgDir: string): Record<string, unknown> | null {
  try {
    const raw = readFileSync(join(pkgDir, 'package.json'), 'utf-8')
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

function loadSeen(path: string): Set<string> {
  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw) as string[]
    return new Set(parsed)
  } catch {
    return new Set()
  }
}
