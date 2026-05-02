import { TokenDisplay } from '../../../components/token-display'

async function generateToken(): Promise<{ token?: string; error?: string }> {
  'use server'

  const { createHash, randomBytes } = await import('node:crypto')
  const { createSupabaseServerClient } = await import('../../../lib/supabase/server')

  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  const { error } = await supabase.from('cli_tokens').insert({
    user_id: user.id,
    token_hash: tokenHash,
    label: 'CLI',
  })

  if (error) return { error: error.message }

  return { token: rawToken }
}

export default function CliAuthPage() {
  return (
    <>
      <h1 className="page-title">CLI Authentication</h1>
      <div className="card" style={{ maxWidth: 560 }}>
        <TokenDisplay onGenerate={generateToken} />
      </div>
    </>
  )
}
