import { type NextRequest } from 'next/server'
import { authenticate, apiErrorResponse } from '../../../../lib/auth'
import { ValidationError, validate } from '../../../../lib/validate'
import { createSupabaseAdminClient } from '../../../../lib/supabase/server'
import type { ScanFindings, ScanSummary } from '@dep-trust/types/scan'

export async function GET(req: NextRequest) {
  try {
    const ctx = await authenticate(req)
    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const offset = (page - 1) * limit

    const admin = createSupabaseAdminClient()
    const { data, error, count } = await admin
      .from('scans')
      .select('*', { count: 'exact' })
      .eq('workspace_id', ctx.workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return Response.json({ scans: data ?? [], total: count ?? 0, page, limit })
  } catch (err) {
    return apiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await authenticate(req)
    const body: unknown = await req.json()

    const input = validate(
      {
        project_name: 'string',
        package_manager: 'string',
        lockfile_hash: 'string',
        summary: 'object',
        findings: 'object',
      },
      body,
    )

    if (!['npm', 'pnpm'].includes(input.package_manager)) {
      return Response.json({ error: 'package_manager: must be npm or pnpm' }, { status: 400 })
    }

    const summary = input.summary as ScanSummary
    const findings = input.findings as ScanFindings

    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from('scans')
      .insert({
        workspace_id: ctx.workspaceId,
        project_name: input.project_name,
        package_manager: input.package_manager,
        lockfile_hash: input.lockfile_hash,
        summary,
        findings,
      })
      .select('id')
      .single()

    if (error) throw error

    return Response.json({ id: data.id }, { status: 201 })
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ error: err.message }, { status: 400 })
    }
    return apiErrorResponse(err)
  }
}
