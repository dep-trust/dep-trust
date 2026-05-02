export interface Workspace {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: 'owner' | 'member'
  created_at: string
}

export interface AllowlistEntry {
  id: string
  workspace_id: string
  package_name: string
  added_by: string
  created_at: string
}

export interface CliToken {
  id: string
  user_id: string
  token_hash: string
  label: string
  last_used_at: string | null
  created_at: string
}
