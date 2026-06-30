import { type NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import {
  verifySignature,
  getInstallationToken,
  postComment,
  buildComment,
} from '@/lib/github'

export const dynamic = 'force-dynamic'

async function fetchLockfile(
  owner: string,
  repo: string,
  ref: string,
  token: string,
): Promise<{ content: string; filename: string } | null> {
  for (const filename of ['package-lock.json', 'pnpm-lock.yaml']) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filename}?ref=${ref}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    )
    if (!res.ok) continue
    const data = (await res.json()) as { content: string; encoding: string }
    if (data.encoding === 'base64') {
      return { content: Buffer.from(data.content, 'base64').toString('utf-8'), filename }
    }
  }
  return null
}



export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature-256')
  const webhookSecret = process.env['GITHUB_APP_WEBHOOK_SECRET'] ?? ''

  if (!verifySignature(rawBody, signature, webhookSecret)) {
    return Response.json({ error: 'invalid signature' }, { status: 401 })
  }

  const event = req.headers.get('x-github-event')
  if (event !== 'pull_request') {
    return Response.json({ ok: true })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 })
  }

  const action = payload['action'] as string
  if (!['opened', 'synchronize', 'reopened'].includes(action)) {
    return Response.json({ ok: true })
  }

  const pr = payload['pull_request'] as Record<string, unknown>
  const repository = payload['repository'] as Record<string, unknown>
  const installation = payload['installation'] as { id: number }
  const prNumber = payload['number'] as number

  const owner = (repository['owner'] as { login: string }).login
  const repo = repository['name'] as string
  const sha = (pr['head'] as { sha: string }).sha

  const appId = process.env['GITHUB_APP_ID']!
  const privateKey = (process.env['GITHUB_APP_PRIVATE_KEY'] ?? '').replace(/\\n/g, '\n')

  const admin = createSupabaseAdminClient()
  const { data: installRow } = await admin
    .from('github_installations')
    .select('workspace_id')
    .eq('installation_id', installation.id)
    .single()

  const workspaceId = installRow?.workspace_id ?? null
  let installationToken: string

  try {
    installationToken = await getInstallationToken(installation.id, appId, privateKey)
  } catch {
    return Response.json({ error: 'failed to get installation token' }, { status: 500 })
  }

  const lockfile = await fetchLockfile(owner, repo, sha, installationToken)

  if (!lockfile) {
    await postComment(owner, repo, prNumber, '**dep-trust** — no lockfile found in this PR', installationToken)
    return Response.json({ ok: true })
  }

  const tempDir = join(tmpdir(), `dep-trust-${Date.now()}`)
  mkdirSync(tempDir, { recursive: true })

  try {
    writeFileSync(join(tempDir, lockfile.filename), lockfile.content)

    const { scan } = await import('dep-trust')
    const result = await scan({ cwd: tempDir, scripts: false, age: 72 })

    let scanId = 'unknown'

    if (workspaceId) {
      const flaggedFreshness = result.freshness.filter((f) => f.flagged)
      const newScripts = result.scripts.filter((s) => s.status === 'new')

      const { data: scanRow } = await admin
        .from('scans')
        .insert({
          workspace_id: workspaceId,
          project_name: `${owner}/${repo}`,
          package_manager: lockfile.filename === 'pnpm-lock.yaml' ? 'pnpm' : 'npm',
          lockfile_hash: sha,
          summary: {
            total_packages: result.packageCount,
            freshness_flags: flaggedFreshness.length,
            script_flags: newScripts.length,
            lockfile_changes: 0,
            duration_ms: 0,
          },
          findings: {
            freshness: result.freshness,
            scripts: result.scripts,
            diff: null,
          },
        })
        .select('id')
        .single()

      if (scanRow) scanId = scanRow.id
    }

    const comment = buildComment(scanId, result)
    await postComment(owner, repo, prNumber, comment, installationToken)
  } finally {
    try {
      rmSync(tempDir, { recursive: true, force: true })
    } catch {
      // best-effort cleanup
    }
  }

  return Response.json({ ok: true })
}
