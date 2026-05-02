import * as readline from 'node:readline'
import pc from 'picocolors'
import { addToAllowlist, listAllowlist, loadAllowlistWithRemote } from './allowlist'
import { loginCommand, logoutCommand, statusCommand } from './auth/commands'
import { getToken } from './auth/token-store'
import { formatScanResult } from './formatter'
import { scan } from './scan'
import { saveSnapshot } from './snapshot'
import {
  buildScanPayload,
  detectPackageManager,
  getProjectName,
  hashLockfile,
  syncScan,
} from './sync/client'

interface CliArgs {
  command: string
  subcommand: string | null
  age: number
  scripts: boolean
  json: boolean
  packageName: string | null
  token: string | null
  list: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2)
  const parsed: CliArgs = {
    command: args[0] ?? 'scan',
    subcommand: args[1] && !args[1].startsWith('--') ? args[1] : null,
    age: 72,
    scripts: true,
    json: false,
    packageName: null,
    token: null,
    list: false,
  }

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--age': {
        const val = parseInt(args[++i], 10)
        if (!isNaN(val)) parsed.age = val
        break
      }
      case '--no-scripts':
        parsed.scripts = false
        break
      case '--json':
        parsed.json = true
        break
      case '--list':
        parsed.list = true
        break
      case '--token':
        parsed.token = args[++i] ?? null
        break
      default:
        if (!arg.startsWith('--') && parsed.command !== 'auth') {
          parsed.packageName = arg
        }
    }
  }

  return parsed
}

function printUsage(): void {
  console.log(`
dep-trust v0.1.1 — npm supply chain audit

Usage:
  dep-trust scan                  Run full audit
  dep-trust scan --age 24         Override freshness window (hours)
  dep-trust scan --no-scripts     Skip install script detection
  dep-trust scan --json           Output machine-readable JSON
  dep-trust snapshot              Save current lockfile as baseline
  dep-trust allow <package>       Add a package to the allowlist
  dep-trust allow --list          Print the current allowlist
  dep-trust auth login            Authenticate with dep-trust cloud
  dep-trust auth login --token    Store a token directly
  dep-trust auth logout           Remove stored credentials
  dep-trust auth status           Show authentication status
`)
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv)
  const cwd = process.cwd()

  switch (cli.command) {
    case 'scan': {
      const startedAt = Date.now()
      const token = await getToken()
      const allowlist = await loadAllowlistWithRemote(cwd, token)

      let spinner: ReturnType<typeof setInterval> | undefined
      if (!cli.json) {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
        let i = 0
        process.stdout.write('\x1B[?25l')
        spinner = setInterval(() => {
          readline.cursorTo(process.stdout, 0)
          process.stdout.write(`  ${pc.dim(frames[i++ % frames.length])} scanning dependencies...`)
        }, 80)
      }

      try {
        const result = await scan({ age: cli.age, scripts: cli.scripts, json: cli.json, cwd, allowlist })

        if (!cli.json) {
          if (spinner) clearInterval(spinner)
          readline.clearLine(process.stdout, 0)
          readline.cursorTo(process.stdout, 0)
          process.stdout.write('\x1B[?25h')
          console.log(formatScanResult(result))
        } else {
          console.log(JSON.stringify(result, null, 2))
        }

        if (token) {
          const payload = buildScanPayload(result, {
            projectName: getProjectName(cwd),
            packageManager: detectPackageManager(cwd),
            lockfileHash: hashLockfile(cwd),
            startedAt,
          })
          await syncScan(token, payload)
        }
      } finally {
        if (spinner) {
          clearInterval(spinner)
          process.stdout.write('\x1B[?25h')
        }
      }
      break
    }

    case 'snapshot': {
      saveSnapshot(cwd)
      console.log('Snapshot saved to .dep-trust/snapshot.json')
      break
    }

    case 'allow': {
      if (cli.list) {
        const entries = listAllowlist(cwd)
        if (entries.length === 0) {
          console.log('Allowlist is empty.')
        } else {
          console.log('Allowlisted packages:')
          for (const name of entries) {
            console.log(`  ${name}`)
          }
        }
      } else if (cli.packageName) {
        const token = await getToken()
        await addToAllowlist(cwd, cli.packageName, token)
        console.log(`Added ${cli.packageName} to allowlist.`)
      } else {
        console.log('Usage: dep-trust allow <package> or dep-trust allow --list')
      }
      break
    }

    case 'auth': {
      switch (cli.subcommand) {
        case 'login':
          await loginCommand({ token: cli.token ?? undefined })
          break
        case 'logout':
          await logoutCommand()
          break
        case 'status':
          await statusCommand()
          break
        default:
          console.log('Usage: dep-trust auth <login|logout|status>')
      }
      break
    }

    case '--help':
    case '-h':
    case 'help':
      printUsage()
      break

    default:
      printUsage()
      process.exit(1)
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : 'unexpected error')
  process.exit(1)
})
