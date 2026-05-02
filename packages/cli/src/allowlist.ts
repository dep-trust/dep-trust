import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface AllowlistData {
  packages: string[]
}

export function loadAllowlist(cwd: string): Set<string> {
  const path = join(cwd, '.dep-trust', 'allowlist.json')
  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw) as AllowlistData
    return new Set(parsed.packages)
  } catch {
    return new Set()
  }
}

export async function loadAllowlistWithRemote(
  cwd: string,
  token: string | null,
): Promise<Set<string>> {
  const local = loadAllowlist(cwd)
  if (!token) return local

  const { fetchRemoteAllowlist } = await import('./sync/client')
  const remote = await fetchRemoteAllowlist(token)

  for (const pkg of remote) {
    local.add(pkg)
  }
  return local
}

export async function addToAllowlist(
  cwd: string,
  name: string,
  token: string | null,
): Promise<void> {
  const allowlist = loadAllowlist(cwd)
  allowlist.add(name)
  writeAllowlist(cwd, allowlist)

  if (token) {
    const { syncAllowlistAdd } = await import('./sync/client')
    await syncAllowlistAdd(token, name)
  }
}

export function listAllowlist(cwd: string): string[] {
  return [...loadAllowlist(cwd)].sort()
}

function writeAllowlist(cwd: string, entries: Set<string>): void {
  const dir = join(cwd, '.dep-trust')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const payload: AllowlistData = { packages: [...entries].sort() }
  writeFileSync(join(dir, 'allowlist.json'), JSON.stringify(payload, null, 2) + '\n')
}
