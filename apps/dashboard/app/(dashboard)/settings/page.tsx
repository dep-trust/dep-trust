import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient()

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(name)')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  const workspaceName =
    (member?.workspaces as { name?: string } | null)?.name ?? 'My workspace'

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <SettingsClient workspaceName={workspaceName} />
    </>
  )
}
