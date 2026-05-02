import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const installationId = searchParams.get('installation_id')
  const setupAction = searchParams.get('setup_action')

  if (!installationId) {
    return NextResponse.redirect(new URL('/github', req.url))
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!member) {
    return NextResponse.redirect(new URL('/github', req.url))
  }

  const clientId = process.env['GITHUB_APP_CLIENT_ID']!
  const clientSecret = process.env['GITHUB_APP_CLIENT_SECRET']!
  const code = searchParams.get('code')

  let accountLogin = 'unknown'
  let accountType: 'User' | 'Organization' = 'User'

  if (code) {
    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
      })

      if (tokenRes.ok) {
        const tokenData = (await tokenRes.json()) as { access_token?: string }
        if (tokenData.access_token) {
          const userRes = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              Accept: 'application/vnd.github+json',
            },
          })
          if (userRes.ok) {
            const userData = (await userRes.json()) as { login: string; type: string }
            accountLogin = userData.login
            accountType = userData.type === 'Organization' ? 'Organization' : 'User'
          }
        }
      }
    } catch {
      // best-effort
    }
  }

  const admin = createSupabaseAdminClient()
  await admin.from('github_installations').upsert(
    {
      workspace_id: member.workspace_id,
      installation_id: parseInt(installationId, 10),
      account_login: accountLogin,
      account_type: accountType,
    },
    { onConflict: 'installation_id' },
  )

  return NextResponse.redirect(new URL('/github', req.url))
}
