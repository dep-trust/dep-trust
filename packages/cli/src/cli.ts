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
import { generateSbom } from './sbom'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

interface CliArgs {
  command: string
  subcommand: string | null
  age: number
  scripts: boolean
  json: boolean
  packageName: string | null
  token: string | null
  list: boolean
  ci: boolean
  deep: boolean
  sbom: boolean
  failOn: import('@dep-trust/types/scan').FailOn
}

function loadConfig(cwd: string): Partial<CliArgs> {
  try {
    const configPath = join(cwd, '.dep-trust.json')
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'))
    }
  } catch {
    // ignore
  }
  return {}
}

function parseArgs(argv: string[], cwd: string): CliArgs {
  const args = argv.slice(2)
  const config = loadConfig(cwd)
  
  const parsed: CliArgs = {
    command: args[0] ?? 'scan',
    subcommand: args[1] && !args[1].startsWith('--') ? args[1] : null,
    age: config.age ?? 72,
    scripts: config.scripts ?? true,
    json: false,
    packageName: null,
    token: null,
    list: false,
    ci: config.ci ?? false,
    deep: config.deep ?? false,
    sbom: false,
    failOn: config.failOn ?? 'all',
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
      case '--sbom':
        parsed.sbom = true
        break
      case '--list':
        parsed.list = true
        break
      case '--token':
        parsed.token = args[++i] ?? null
        break
      case '--ci':
        parsed.ci = true
        break
      case '--deep':
        parsed.deep = true
        break
      case '--fail-on': {
        const val = args[++i]
        if (val === 'freshness' || val === 'scripts' || val === 'diff' || val === 'maintainers' || val === 'typosquat' || val === 'code' || val === 'all') {
          parsed.failOn = val as import('@dep-trust/types/scan').FailOn
        }
        break
      }
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
dep-trust v0.1.3 — npm supply chain audit

Usage:
  dep-trust scan                  Run full audit
  dep-trust scan --age 24         Override freshness window (hours)
  dep-trust scan --no-scripts     Skip install script detection
  dep-trust scan --json           Output machine-readable JSON
  dep-trust scan --sbom           Output CycloneDX SBOM
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
  const cwd = process.cwd()
  const cli = parseArgs(process.argv, cwd)

  switch (cli.command) {
    case 'scan': {
      const startedAt = Date.now()
      const token = cli.token ?? await getToken()
      const allowlist = await loadAllowlistWithRemote(cwd, token)

      let spinner: ReturnType<typeof setInterval> | undefined
      if (!cli.json && !cli.sbom) {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
        let i = 0
        process.stdout.write('\x1B[?25l')
        spinner = setInterval(() => {
          readline.cursorTo(process.stdout, 0)
          process.stdout.write(`  ${pc.dim(frames[i++ % frames.length])} scanning dependencies...`)
        }, 80)
      }

      try {
        const result = await scan({ age: cli.age, scripts: cli.scripts, json: cli.json, cwd, allowlist, ci: cli.ci, failOn: cli.failOn, deep: cli.deep })

        if (cli.json) {
          if (cli.ci) {
            console.log(JSON.stringify({
              pass: result.pass,
              severity: result.severity,
              failedChecks: result.failedChecks,
              ...result
            }, null, 2))
          } else {
            console.log(JSON.stringify(result, null, 2))
          }
        } else if (cli.sbom) {
          console.log(generateSbom(result, getProjectName(cwd)))
        } else {
          if (spinner) clearInterval(spinner)
          readline.clearLine(process.stdout, 0)
          readline.cursorTo(process.stdout, 0)
          process.stdout.write('\x1B[?25h')
          console.log(formatScanResult(result))
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

        if (cli.ci && result.pass === false) {
          process.exit(1)
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
