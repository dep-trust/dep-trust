import * as readline from 'node:readline'
import pc from 'picocolors'
import { deleteToken, getToken, setToken } from './token-store'

const CLI_AUTH_URL = 'https://app.dep-trust.dev/cli-auth'

export async function loginCommand(opts: { token?: string }): Promise<void> {
  if (opts.token) {
    await setToken(opts.token)
    console.log(pc.green('✓') + ' Authenticated. Token stored.')
    return
  }

  let openUrl: ((url: string) => Promise<unknown>) | null = null
  try {
    const mod = await import('open')
    openUrl = mod.default
  } catch {
    // open package unavailable
  }

  if (openUrl) {
    await openUrl(CLI_AUTH_URL)
    console.log(`Opening ${CLI_AUTH_URL}...`)
  } else {
    console.log(`Visit ${CLI_AUTH_URL} to generate a token.`)
  }

  console.log('Paste your CLI token and press Enter:')
  const token = await prompt()

  if (!token) {
    console.error('No token provided.')
    process.exit(1)
  }

  await setToken(token)
  console.log(pc.green('✓') + ' Authenticated. Token stored.')
}

export async function logoutCommand(): Promise<void> {
  await deleteToken()
  console.log('Logged out.')
}

export async function statusCommand(): Promise<void> {
  const token = await getToken()
  if (token) {
    console.log(pc.green('✓') + ' Authenticated')
    console.log(pc.dim('  Scans sync to dep-trust cloud automatically'))
  } else {
    console.log(pc.dim('Not authenticated'))
    console.log(pc.dim('  Run: dep-trust auth login'))
  }
}

function prompt(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question('', (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}
