import { createSupabaseServerClient } from '../../../lib/supabase/server'
import type { AllowlistEntry } from '@dep-trust/types/workspace'
import { AllowlistClient } from './allowlist-client'

export default async function AllowlistPage() {
  const supabase = createSupabaseServerClient()

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  const entries: AllowlistEntry[] = []

  if (member) {
    const { data } = await supabase
      .from('allowlist')
      .select('*')
      .eq('workspace_id', member.workspace_id)
      .order('created_at', { ascending: false })

    if (data) entries.push(...(data as AllowlistEntry[]))
  }

  return (
    <>
      <h1 className="page-title">Allowlist</h1>
      <AllowlistClient entries={entries} />
    </>
  )
}
