'use server'

import { redirect } from 'next/navigation'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server'

export async function loginAction(formData: FormData): Promise<{ error: string } | never> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServerClient()
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

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

    if (data.user) {
      const workspaceName = `${email.split('@')[0]}'s workspace`
      const admin = createSupabaseAdminClient()

      const { data: workspace, error: wsErr } = await admin
        .from('workspaces')
        .insert({ name: workspaceName, owner_id: data.user.id })
        .select('id')
        .single()

      if (!wsErr && workspace) {
        await admin.from('workspace_members').insert({
          workspace_id: workspace.id,
          user_id: data.user.id,
          role: 'owner',
        })
      }
    }

  redirect('/scans')
}

export async function logoutAction(): Promise<never> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
