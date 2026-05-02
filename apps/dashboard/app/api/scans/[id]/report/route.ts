import { type NextRequest } from 'next/server'
import { authenticate, apiErrorResponse, ApiError } from '../../../../../lib/auth'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/server'
import { generateScanReport } from '../../../../../lib/pdf/report'
import type { ScanRecord } from '@dep-trust/types/scan'

export const dynamic = 'force-dynamic'

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

    const pdfBuffer = await generateScanReport(data as ScanRecord)
    const filename = `dep-trust-${(data as ScanRecord).project_name}-${params.id.slice(0, 8)}.pdf`

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch (err) {
    return apiErrorResponse(err)
  }
}
