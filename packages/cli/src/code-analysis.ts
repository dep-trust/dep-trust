import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { CodeAnalysisResult, CodeFinding } from '@dep-trust/types/scan'

const MAX_FILE_SIZE = 500 * 1024 // 500KB - skip minified bundles
const PATTERNS = [
  { regex: /child_process\.(exec|spawn)\([^'"`]/, name: 'dynamic_exec', severity: 'critical' as const },
  { regex: /eval\([^'"`]/, name: 'dynamic_eval', severity: 'critical' as const },
  { regex: /Buffer\.from\(['"`](?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?['"`],\s*['"`]base64['"`]\)/, name: 'base64_payload', severity: 'critical' as const },
  { regex: /new\s+Function\([^'"`]/, name: 'dynamic_function', severity: 'critical' as const },
  { regex: /require\(['"`]https?['"`]\)\.request/, name: 'http_request', severity: 'critical' as const },
  { regex: /fetch\(/, name: 'fetch_call', severity: 'critical' as const },
  { regex: /fs\.readFile(Sync)?\(['"`](?:\.\.\/|\/etc\/|~\/)/, name: 'fs_snooping', severity: 'warning' as const },
  { regex: /process\.env(\.|\[['"`])(AWS_ACCESS_KEY_ID|NPM_TOKEN|GITHUB_TOKEN)/, name: 'credential_harvesting', severity: 'warning' as const },
]

function shannonEntropy(str: string): number {
  const len = str.length
  if (len === 0) return 0
  const counts: Record<string, number> = {}
  for (let i = 0; i < len; i++) {
    counts[str[i]] = (counts[str[i]] || 0) + 1
  }
  let entropy = 0
  for (const char in counts) {
    const p = counts[char] / len
    entropy -= p * Math.log2(p)
  }
  return entropy
}

export function analyzePackageCode(
  cwd: string,
  packages: string[],
  allowlist: Set<string>,
): CodeAnalysisResult {
  const findings: CodeFinding[] = []
  const filesScannedRef = { count: 0 }
  let packagesScanned = 0

  const nodeModules = join(cwd, 'node_modules')

  for (const pkg of packages) {
    if (allowlist.has(pkg)) continue
    
    packagesScanned++
    const pkgDir = join(nodeModules, pkg)
    
    try {
      scanDirectory(pkgDir, pkg, pkgDir, findings, filesScannedRef)
    } catch {
      // package might not exist on disk
    }
  }

  return { findings, packagesScanned, filesScanned: filesScannedRef.count }
}

function scanDirectory(
  dir: string,
  pkgName: string,
  pkgRoot: string,
  findings: CodeFinding[],
  filesScannedRef: { count: number },
) {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }

  for (const entry of entries) {
    if (entry === 'node_modules') continue // don't recurse into nested deps
    if (entry.startsWith('.')) continue

    const fullPath = join(dir, entry)
    let stats
    try {
      stats = statSync(fullPath)
    } catch {
      continue
    }

    if (stats.isDirectory()) {
      scanDirectory(fullPath, pkgName, pkgRoot, findings, filesScannedRef)
    } else if (stats.isFile() && stats.size <= MAX_FILE_SIZE) {
      if (entry.endsWith('.js') || entry.endsWith('.mjs') || entry.endsWith('.cjs')) {
        scanFile(fullPath, pkgName, pkgRoot, findings)
        filesScannedRef.count++
      }
    }
  }
}

function scanFile(
  filePath: string,
  pkgName: string,
  pkgRoot: string,
  findings: CodeFinding[],
) {
  let content: string
  try {
    content = readFileSync(filePath, 'utf-8')
  } catch {
    return
  }

  const lines = content.split('\n')
  const relativePath = filePath.slice(pkgRoot.length + 1)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    for (const pat of PATTERNS) {
      if (pat.regex.test(line)) {
        findings.push({
          name: pkgName,
          file: relativePath,
          pattern: pat.name,
          severity: pat.severity,
          snippet: line.trim().slice(0, 80)
        })
      }
    }

    // Entropy check for long strings
    const stringMatch = line.match(/(['"`])(.*?)\1/)
    if (stringMatch && stringMatch[2].length > 100) {
      const entropy = shannonEntropy(stringMatch[2])
      if (entropy > 4.5) {
        findings.push({
          name: pkgName,
          file: relativePath,
          pattern: 'high_entropy_string',
          severity: 'warning',
          snippet: line.trim().slice(0, 80)
        })
      }
    }
  }
}
