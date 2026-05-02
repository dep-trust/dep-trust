'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function updateWorkspaceName(formData: FormData): Promise<{ error?: string }> {
  const name = (formData.get('name') as string)?.trim()
  if (!name || name.length < 2) return { error: 'Name must be at least 2 characters' }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!member) return { error: 'No workspace found' }

  const { error } = await supabase
    .from('workspaces')
    .update({ name })
    .eq('id', member.workspace_id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return {}
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { createSupabaseAdminClient } = await import('../../../lib/supabase/server')
  const admin = createSupabaseAdminClient()

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  return {}
}
