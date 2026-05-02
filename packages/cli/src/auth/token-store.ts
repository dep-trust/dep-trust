import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import pc from 'picocolors'

const SERVICE = 'dep-trust'
const ACCOUNT = 'cli-token'
const FALLBACK_DIR = join(homedir(), '.dep-trust')
const FALLBACK_PATH = join(FALLBACK_DIR, 'token')

async function tryKeytar(): Promise<typeof import('keytar') | null> {
  try {
    const mod = await import('keytar')
    return (mod.default ?? mod) as typeof import('keytar')
  } catch {
    return null
  }
}

export async function getToken(): Promise<string | null> {
  const keytar = await tryKeytar()
  if (keytar) {
    try {
      return await keytar.getPassword(SERVICE, ACCOUNT)
    } catch (err) {
      console.log(
        pc.dim(`keychain read failed: ${err instanceof Error ? err.message : 'unknown'}, falling back to file`),
      )
    }
  }
  try {
    return readFileSync(FALLBACK_PATH, 'utf-8').trim() || null
  } catch {
    return null
  }
}

export async function setToken(token: string): Promise<void> {
  const keytar = await tryKeytar()
  if (keytar) {
    try {
      await keytar.setPassword(SERVICE, ACCOUNT, token)
      return
    } catch (err) {
      console.log(
        pc.dim(
          `keychain write failed: ${err instanceof Error ? err.message : 'unknown'}, storing in ~/.dep-trust/token`,
        ),
      )
    }
  }
  if (!existsSync(FALLBACK_DIR)) mkdirSync(FALLBACK_DIR, { recursive: true })
  writeFileSync(FALLBACK_PATH, token, { mode: 0o600 })
}

export async function deleteToken(): Promise<void> {
  const keytar = await tryKeytar()
  if (keytar) {
    try {
      await keytar.deletePassword(SERVICE, ACCOUNT)
    } catch {
      // not stored in keychain
    }
  }
  try {
    rmSync(FALLBACK_PATH)
  } catch {
    // not stored in file
  }
}
