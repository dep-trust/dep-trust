'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../lib/supabase/server'

export async function loginAction(formData: FormData): Promise<{ error: string } | never> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/scans')
}

export async function signupAction(
  formData: FormData,
): Promise<{ error: string } | never> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    const workspaceName = `${email.split('@')[0]}'s workspace`

    const { data: workspace, error: wsErr } = await supabase
      .from('workspaces')
      .insert({ name: workspaceName, owner_id: data.user.id })
      .select('id')
      .single()

    if (!wsErr && workspace) {
      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: data.user.id,
        role: 'owner',
      })
    }
  }

  redirect('/scans')
}

export async function logoutAction(): Promise<never> {
  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
