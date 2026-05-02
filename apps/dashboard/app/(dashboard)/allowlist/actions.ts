'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function addAllowlistEntry(formData: FormData): Promise<{ error?: string }> {
  const packageName = (formData.get('package_name') as string)?.trim()
  if (!packageName) return { error: 'Package name is required' }

  const supabase = await createSupabaseServerClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return { error: 'Not authenticated' }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!member) return { error: 'No workspace found' }

  const { error } = await supabase.from('allowlist').insert({
    workspace_id: member.workspace_id,
    package_name: packageName,
    added_by: user.user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/allowlist')
  return {}
}

export async function removeAllowlistEntry(packageName: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return { error: 'Not authenticated' }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!member) return { error: 'No workspace found' }

  const { error } = await supabase
    .from('allowlist')
    .delete()
    .eq('workspace_id', member.workspace_id)
    .eq('package_name', packageName)

  if (error) return { error: error.message }

  revalidatePath('/allowlist')
  return {}
}
