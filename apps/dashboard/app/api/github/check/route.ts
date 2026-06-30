import { type NextRequest } from 'next/server'
import { authenticate, apiErrorResponse } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { getInstallationToken, postComment, buildComment } from '@/lib/github'
import type { ScanRecord } from '@dep-trust/types/scan'

export async function POST(req: NextRequest) {
  try {
    const ctx = await authenticate(req)
    const body = (await req.json()) as {
      owner: string
      repo: string
      pr: number
      scanResult: Omit<ScanRecord, 'id' | 'workspace_id' | 'created_at'>
    }

    if (!body.owner || !body.repo || !body.pr || !body.scanResult) {
      return Response.json({ error: 'missing required fields' }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()
    const { data: installRow } = await admin
      .from('github_installations')
      .select('installation_id')
      .eq('workspace_id', ctx.workspaceId)
      .eq('account_login', body.owner)
      .single()

    if (!installRow) {
      // Installation not found for this workspace & owner. Just ignore, they might not have the app installed.
      return Response.json({ ok: true, status: 'no_installation' })
    }

    const appId = process.env['GITHUB_APP_ID']
    const privateKey = (process.env['GITHUB_APP_PRIVATE_KEY'] ?? '').replace(/\\n/g, '\n')

    if (!appId || !privateKey) {
      return Response.json({ error: 'missing github app credentials' }, { status: 500 })
    }

    const installationToken = await getInstallationToken(installRow.installation_id, appId, privateKey)

    // For the scanId, since this runs right after syncScan, we can just omit the id for now or pass 'unknown'
    // Alternatively, the CLI could pass the id it got from syncScan.
    // For now, let's use 'unknown' to avoid another db query, or query the latest scan for this lockfile_hash
    const { data: scanRow } = await admin
      .from('scans')
      .select('id')
      .eq('workspace_id', ctx.workspaceId)
      .eq('project_name', `${body.owner}/${body.repo}`)
      .eq('lockfile_hash', body.scanResult.lockfile_hash)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const scanId = scanRow?.id ?? 'unknown'
    
    // Convert findings to the shape expected by buildComment
    const commentResult = {
      freshness: body.scanResult.findings.freshness.map(f => ({
        name: f.name,
        version: f.version,
        ageHours: f.ageHours,
        flagged: f.flagged
      })),
      scripts: body.scanResult.findings.scripts.map(s => ({
        name: s.name,
        scripts: s.scripts,
        status: s.status
      }))
    }

    const comment = buildComment(scanId, commentResult)
    await postComment(body.owner, body.repo, body.pr, comment, installationToken)

    return Response.json({ ok: true })
  } catch (err) {
    return apiErrorResponse(err)
  }
}
