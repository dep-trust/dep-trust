import { type NextRequest } from 'next/server'
import { authenticate, apiErrorResponse } from '@/lib/auth'
import { ValidationError, validate } from '@/lib/validate'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const ctx = await authenticate(req)
    const admin = createSupabaseAdminClient()

    const { data, error } = await admin
      .from('allowlist')
      .select('*')
      .eq('workspace_id', ctx.workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json(data ?? [])
  } catch (err) {
    return apiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await authenticate(req)
    const body: unknown = await req.json()

    const input = validate({ package_name: 'string' }, body)

    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from('allowlist')
      .insert({
        workspace_id: ctx.workspaceId,
        package_name: input.package_name,
        added_by: ctx.userId,
      })
      .select('*')
      .single()

    if (error) throw error

    return Response.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ error: err.message }, { status: 400 })
    }
    return apiErrorResponse(err)
  }
}
