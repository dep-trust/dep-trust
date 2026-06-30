import { createHmac, createSign } from 'node:crypto'

export function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const expected = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}

export function makeAppJwt(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId })).toString('base64url')
  const unsigned = `${header}.${payload}`
  const sign = createSign('RSA-SHA256')
  sign.update(unsigned)
  const signature = sign.sign(privateKey, 'base64url')
  return `${unsigned}.${signature}`
}

export async function getInstallationToken(installationId: number, appId: string, privateKey: string): Promise<string> {
  const jwt = makeAppJwt(appId, privateKey)
  const res = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) throw new Error(`failed to get installation token: HTTP ${res.status}`)
  const data = (await res.json()) as { token: string }
  return data.token
}

export async function postComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
  token: string,
): Promise<void> {
  await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  })
}

export function formatAge(hours: number | null): string {
  if (hours === null) return 'unknown'
  if (hours < 1) return '<1h ago'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function buildComment(scanId: string, result: {
  freshness: Array<{ name: string; version: string; ageHours: number | null; flagged: boolean }>
  scripts: Array<{ name: string; scripts: string[]; status: string }>
}): string {
  const flagged = result.freshness.filter((f) => f.flagged)
  const newScripts = result.scripts.filter((s) => s.status === 'new')

  if (flagged.length === 0 && newScripts.length === 0) {
    return '**dep-trust** — no supply chain flags detected'
  }

  const lines: string[] = [
    `**dep-trust** found supply chain indicators in this PR`,
    '',
    `${flagged.length} freshness flag${flagged.length !== 1 ? 's' : ''} · ${newScripts.length} new install script${newScripts.length !== 1 ? 's' : ''}`,
  ]

  if (flagged.length > 0) {
    lines.push('', '**Freshness**')
    for (const f of flagged) {
      lines.push(`- \`${f.name}\` v${f.version} — published ${formatAge(f.ageHours)}`)
    }
  }

  if (newScripts.length > 0) {
    lines.push('', '**Install Scripts**')
    for (const s of newScripts) {
      lines.push(`- \`${s.name}\` — new ${s.scripts.join(', ')} script`)
    }
  }

  const dashboardUrl =
    process.env['NEXT_PUBLIC_APP_URL'] ??
    process.env['NEXT_PUBLIC_DASHBOARD_URL'] ??
    'https://dep-trust-dashboard.vercel.app'

  lines.push('', `[View full scan](${dashboardUrl}/scans/${scanId})`)
  return lines.join('\n')
}
