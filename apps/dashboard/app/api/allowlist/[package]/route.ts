import { type NextRequest } from 'next/server'
import { authenticate, apiErrorResponse } from '../../../../../lib/auth'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/server'

export async function DELETE(req: NextRequest, { params }: { params: { package: string } }) {
  try {
    const ctx = await authenticate(req)
    const packageName = decodeURIComponent(params.package)
    const admin = createSupabaseAdminClient()

    const { error } = await admin
      .from('allowlist')
      .delete()
      .eq('workspace_id', ctx.workspaceId)
      .eq('package_name', packageName)

    if (error) throw error

    return new Response(null, { status: 204 })
  } catch (err) {
    return apiErrorResponse(err)
  }
}
