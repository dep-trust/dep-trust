import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseLockfile } from './lockfile'
import type { LockfileDependency, SnapshotDiff } from '@dep-trust/types/scan'

interface Snapshot {
  date: string
  dependencies: Record<string, string>
  maintainers?: Record<string, string[]>
}

export function saveSnapshot(cwd: string, maintainers?: Record<string, string[]>): void {
  const deps = parseLockfile(cwd)
  const depMap: Record<string, string> = {}
  for (const dep of deps) {
    depMap[dep.name] = dep.version
  }

  const snapshot: Snapshot = {
    date: new Date().toISOString(),
    dependencies: depMap,
    maintainers,
  }

  const dir = join(cwd, '.dep-trust')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'snapshot.json'), JSON.stringify(snapshot, null, 2) + '\n')
}

export function diffSnapshot(cwd: string, currentMaintainers?: Record<string, string[]>): SnapshotDiff | null {
  const snapshotPath = join(cwd, '.dep-trust', 'snapshot.json')
  if (!existsSync(snapshotPath)) return null

  let snapshot: Snapshot
  try {
    snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8')) as Snapshot
  } catch {
    return null
  }

  const currentDeps = parseLockfile(cwd)
  const currentMap = new Map<string, string>()
  for (const dep of currentDeps) {
    currentMap.set(dep.name, dep.version)
  }

  const added: LockfileDependency[] = []
  const removed: LockfileDependency[] = []
  const bumped: SnapshotDiff['bumped'] = []
  const maintainerChanges: import('@dep-trust/types/scan').MaintainerChange[] = []

  for (const [name, version] of currentMap) {
    const oldVersion = snapshot.dependencies[name]
    if (!oldVersion) {
      added.push({ name, version })
    } else if (oldVersion !== version) {
      bumped.push({ name, from: oldVersion, to: version })
    }
  }

  for (const [name, version] of Object.entries(snapshot.dependencies)) {
    if (!currentMap.has(name)) {
      removed.push({ name, version })
    }
  }

  if (snapshot.maintainers && currentMaintainers) {
    for (const [name, current] of Object.entries(currentMaintainers)) {
      const previous = snapshot.maintainers[name]
      if (!previous) continue

      const currentSet = new Set(current)
      const previousSet = new Set(previous)

      const addedMaintainers = current.filter(m => !previousSet.has(m))
      const removedMaintainers = previous.filter(m => !currentSet.has(m))

      if (addedMaintainers.length > 0 || removedMaintainers.length > 0) {
        maintainerChanges.push({
          name,
          previous,
          current,
          added: addedMaintainers,
          removed: removedMaintainers
        })
      }
    }
  }

  return {
    added,
    removed,
    bumped,
    maintainerChanges,
    snapshotDate: snapshot.date,
  }
}

export function saveSeen(cwd: string, names: string[]): void {
  const dir = join(cwd, '.dep-trust')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const seenPath = join(dir, 'seen-scripts.json')

  let existing: string[] = []
  try {
    existing = JSON.parse(readFileSync(seenPath, 'utf-8')) as string[]
  } catch {
    // first run
  }

  const merged = [...new Set([...existing, ...names])]
  writeFileSync(seenPath, JSON.stringify(merged, null, 2) + '\n')
}
