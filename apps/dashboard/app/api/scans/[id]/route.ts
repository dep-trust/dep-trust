import { type NextRequest } from 'next/server'
import { authenticate, apiErrorResponse } from '../../../../../lib/auth'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/server'
import { ApiError } from '../../../../../lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await authenticate(req)
    const admin = createSupabaseAdminClient()

    const { data, error } = await admin
      .from('scans')
      .select('*')
      .eq('id', params.id)
      .eq('workspace_id', ctx.workspaceId)
      .single()

    if (error || !data) throw new ApiError(404, 'scan not found')

    return Response.json(data)
  } catch (err) {
    return apiErrorResponse(err)
  }
}
