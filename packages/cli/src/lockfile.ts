import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LockfileDependency } from '@dep-trust/types/scan'

export function parseLockfile(cwd: string): LockfileDependency[] {
  const npmLock = tryReadFile(join(cwd, 'package-lock.json'))
  if (npmLock) return parsePackageLock(npmLock)

  const pnpmLock = tryReadFile(join(cwd, 'pnpm-lock.yaml'))
  if (pnpmLock) return parsePnpmLock(pnpmLock)

  const yarnLock = tryReadFile(join(cwd, 'yarn.lock'))
  if (yarnLock) return parseYarnLock(yarnLock)

  return []
}

export function parsePackageLock(content: string): LockfileDependency[] {
  const lock = JSON.parse(content) as {
    lockfileVersion?: number
    packages?: Record<string, { version?: string; integrity?: string }>
    dependencies?: Record<string, { version?: string; integrity?: string }>
  }

  const deps: LockfileDependency[] = []

  if (lock.lockfileVersion && lock.lockfileVersion >= 2 && lock.packages) {
    for (const [path, entry] of Object.entries(lock.packages)) {
      if (!path || path === '') continue
      const name = path.replace(/^node_modules\//, '')
      if (!entry.version) continue
      deps.push({ name, version: entry.version, integrity: entry.integrity })
    }
  } else if (lock.dependencies) {
    for (const [name, entry] of Object.entries(lock.dependencies)) {
      if (!entry.version) continue
      deps.push({ name, version: entry.version, integrity: entry.integrity })
    }
  }

  return deps
}

export function parsePnpmLock(content: string): LockfileDependency[] {
  const deps: LockfileDependency[] = []
  const lines = content.split('\n')
  let inPackages = false
  let currentPath = ''
  let currentVersion = ''
  let currentIntegrity = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const stripped = line.trim()

    if (stripped === 'packages:') {
      inPackages = true
      continue
    }

    if (!inPackages) continue

    if (stripped.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
      flushEntry(currentPath, currentVersion, currentIntegrity, deps)
      inPackages = false
      currentPath = ''
      currentVersion = ''
      currentIntegrity = ''
      continue
    }

    const indent = line.length - line.trimStart().length

    if (indent === 2 && stripped.endsWith(':')) {
      flushEntry(currentPath, currentVersion, currentIntegrity, deps)
      currentPath = stripped.slice(0, -1)
      currentVersion = extractVersionFromPath(currentPath)
      currentIntegrity = ''
      continue
    }

    if (indent >= 4 && currentPath) {
      const kvMatch = stripped.match(/^([\w][\w-]*):\s*(.+)$/)
      if (kvMatch) {
        const [, key, value] = kvMatch
        const cleanValue = value.replace(/^['"]|['"]$/g, '')
        if (key === 'version') currentVersion = cleanValue
        if (key === 'integrity') currentIntegrity = cleanValue
      }
    }
  }

  flushEntry(currentPath, currentVersion, currentIntegrity, deps)
  return deps
}

export function parseYarnLock(content: string): LockfileDependency[] {
  const deps: LockfileDependency[] = []
  const lines = content.split('\n')
  
  let currentName = ''
  let currentVersion = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('#') || line.trim() === '') continue
    
    // Header line, e.g., "package@^1.0.0": or "package@npm:^1.0.0":
    if (!line.startsWith(' ') && !line.startsWith('\t') && line.endsWith(':')) {
      if (currentName && currentVersion) {
        deps.push({ name: currentName, version: currentVersion })
      }
      currentVersion = ''
      
      const header = line.slice(0, -1).trim()
      const firstSpec = header.split(',')[0].trim().replace(/^"|'|"$|'$/g, '')
      const name = extractPackageName(firstSpec)
      if (name) currentName = name
      else currentName = ''
      continue
    }
    
    if (currentName && line.trim().startsWith('version')) {
      const match = line.match(/version\s+(?:"|')?([^"'\s]+)(?:"|')?/)
      if (match) {
        currentVersion = match[1]
      }
    }
  }
  
  if (currentName && currentVersion) {
    deps.push({ name: currentName, version: currentVersion })
  }
  
  // Deduplicate since yarn.lock can have the same resolved version multiple times
  const unique = new Map<string, string>()
  for (const dep of deps) {
    unique.set(`${dep.name}@${dep.version}`, dep.version)
  }
  
  return Array.from(unique.entries()).map(([key, version]) => {
    return { name: key.substring(0, key.lastIndexOf('@')), version }
  })
}

function extractVersionFromPath(path: string): string {
  const cleaned = path.replace(/^['"/]+|['"/]+$/g, '')
  const scopedMatch = cleaned.match(/^@[^@/]+\/[^@/]+@(.+)$/)
  if (scopedMatch) return scopedMatch[1]
  const simpleMatch = cleaned.match(/^[^@]+@(.+)$/)
  if (simpleMatch) return simpleMatch[1]
  return ''
}

function flushEntry(
  path: string,
  version: string,
  integrity: string,
  deps: LockfileDependency[],
) {
  if (!path || !version) return

  const name = extractPackageName(path)
  if (!name) return

  deps.push({ name, version, integrity: integrity || undefined })
}

function extractPackageName(pkgPath: string): string | null {
  const cleaned = pkgPath.replace(/^['"/]+|['"/]+$/g, '')

  const atMatch = cleaned.match(/^\/?((@[^@/]+\/[^@/]+))@/)
  if (atMatch) return atMatch[1]

  const simpleMatch = cleaned.match(/^\/?([^@/][^@]*)@/)
  if (simpleMatch) return simpleMatch[1]

  const parenMatch = cleaned.match(/^\/?([^(]+)\(/)
  if (parenMatch) {
    const inner = parenMatch[1]
    const nameMatch = inner.match(/^((@[^@/]+\/[^@/]+)|([^@/][^@]*))@/)
    if (nameMatch) return nameMatch[1]
  }

  return cleaned.split('@')[0] || null
}

function tryReadFile(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8')
  } catch {
    return null
  }
}
