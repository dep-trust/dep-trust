import { createHash, randomBytes } from 'node:crypto'
import { type NextRequest } from 'next/server'
import { authenticate, apiErrorResponse } from '../../../../lib/auth'
import { createSupabaseAdminClient } from '../../../../lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const ctx = await authenticate(req)

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')

    const admin = createSupabaseAdminClient()
    const { error } = await admin.from('cli_tokens').insert({
      user_id: ctx.userId,
      token_hash: tokenHash,
      label: 'CLI',
    })

    if (error) throw error

    return Response.json({ token: rawToken }, { status: 201 })
  } catch (err) {
    return apiErrorResponse(err)
  }
}
