export interface GitHubInstallation {
  id: string
  workspace_id: string
  installation_id: number
  account_login: string
  account_type: 'User' | 'Organization'
  created_at: string
}

export interface GitHubPrEvent {
  action: 'opened' | 'synchronize' | 'reopened' | string
  number: number
  pull_request: {
    head: {
      sha: string
      ref: string
      repo: {
        full_name: string
        clone_url: string
      }
    }
    base: {
      ref: string
    }
  }
  repository: {
    full_name: string
    owner: {
      login: string
    }
    name: string
  }
  installation: {
    id: number
  }
}

export interface GitHubWebhookPayload {
  action?: string
  pull_request?: GitHubPrEvent['pull_request']
  repository?: GitHubPrEvent['repository']
  installation?: GitHubPrEvent['installation']
  number?: number
}
