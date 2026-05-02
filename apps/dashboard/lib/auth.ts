import { createHash } from 'node:crypto'
import { createSupabaseAdminClient, createSupabaseServerClient } from './supabase/server'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface AuthContext {
  userId: string
  workspaceId: string
}

export async function authenticate(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const rawToken = authHeader.slice(7)
    return authenticateCliToken(rawToken)
  }

  return authenticateSession()
}

async function authenticateCliToken(rawToken: string): Promise<AuthContext> {
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const admin = createSupabaseAdminClient()

  const { data: tokenRow, error } = await admin
    .from('cli_tokens')
    .select('user_id, id')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !tokenRow) {
    throw new ApiError(401, 'invalid token')
  }

  await admin
    .from('cli_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenRow.id)

  const workspaceId = await getFirstWorkspace(admin, tokenRow.user_id)

  return { userId: tokenRow.user_id, workspaceId }
}

async function authenticateSession(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new ApiError(401, 'unauthenticated')
  }

  const workspaceId = await getFirstWorkspace(supabase, user.id)

  return { userId: user.id, workspaceId }
}

async function getFirstWorkspace(
  client: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
): Promise<string> {
  const { data, error } = await client
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error || !data) {
    throw new ApiError(403, 'no workspace found for user')
  }

  return data.workspace_id
}

export function apiErrorResponse(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status })
  }
  return Response.json({ error: 'internal server error' }, { status: 500 })
}
